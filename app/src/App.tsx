import { useEffect, useRef, useState, useCallback } from "react";
import * as web3 from "@solana/web3.js";
import * as borsh from "borsh";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  DELEGATION_PROGRAM_ID,
  delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
  delegationRecordPdaFromDelegatedAccount,
  delegationMetadataPdaFromDelegatedAccount,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
  GetCommitmentSignature,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { motion, AnimatePresence } from "framer-motion";
import "@solana/wallet-adapter-react-ui/styles.css";

const PROGRAM_ID = new web3.PublicKey("67TpKdRHJi8DzrttRRfH3tDBm4k3uiGVnDToc9WYiVna");
const ER_ENDPOINT = "https://devnet-as.magicblock.app/";
const erConnection = new web3.Connection(ER_ENDPOINT, { commitment: "confirmed" });

class TapScore {
  score: number = 0;
  constructor(fields?: { score: number }) { if (fields) this.score = fields.score; }
}
const TapScoreSchema = new Map([[TapScore, { kind: "struct", fields: [["score", "u64"]] }]]);

function readScore(data: Buffer): number {
  const decoded = borsh.deserialize(TapScoreSchema, TapScore, data);
  return typeof (decoded.score as any).toNumber === "function"
    ? (decoded.score as any).toNumber()
    : decoded.score;
}

const IX = {
  Initialize:          Buffer.from("0000000000000000", "hex"),
  Tap:                 Buffer.from("0100000000000000", "hex"),
  Delegate:            Buffer.from("0200000000000000", "hex"),
  CommitAndUndelegate: Buffer.from("0300000000000000", "hex"),
  Commit:              Buffer.from("0400000000000000", "hex"),
};

function buildTapData(amount: number): Buffer {
  const payload = Buffer.alloc(8);
  payload.writeBigUInt64LE(BigInt(amount), 0);
  return Buffer.concat([IX.Tap, payload]);
}

async function confirmTx(conn: web3.Connection, sig: string) {
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
}

export default function App() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();

  const [solanaScore, setSolanaScore]   = useState<number | null>(null);
  const [erScore, setErScore]           = useState<number | null>(null);
  const [isDelegated, setIsDelegated]   = useState(false);
  const [status, setStatus]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [tapping, setTapping]           = useState(false); // for tap animation only

  const tempKeypair = useRef<web3.Keypair | null>(null);

  const tapScorePda = publicKey
    ? web3.PublicKey.findProgramAddressSync(
        [Buffer.from("tapscore"), publicKey.toBuffer()], PROGRAM_ID)[0]
    : null;

  const fetchScores = useCallback(async () => {
    if (!tapScorePda) return;
    const solInfo = await connection.getAccountInfo(tapScorePda);
    if (solInfo) {
      setSolanaScore(readScore(Buffer.from(solInfo.data)));
      setIsDelegated(!solInfo.owner.equals(PROGRAM_ID));
    } else {
      setSolanaScore(null);
      setIsDelegated(false);
    }
    if (solInfo && !solInfo.owner.equals(PROGRAM_ID)) {
      const erInfo = await erConnection.getAccountInfo(tapScorePda).catch(() => null);
      if (erInfo) {
        setErScore(readScore(Buffer.from(erInfo.data)));
      } else {
        setErScore(readScore(Buffer.from(solInfo.data)));
      }
    } else {
      setErScore(null);
    }
  }, [tapScorePda, connection]);

  useEffect(() => {
    fetchScores();
    const id = setInterval(fetchScores, 2000);
    return () => clearInterval(id);
  }, [fetchScores]);

  async function sendOnSolana(ix: web3.TransactionInstruction) {
    const tx = new web3.Transaction().add(ix);
    const sig = await sendTransaction(tx, connection);
    await confirmTx(connection, sig);
    return sig;
  }

  async function sendOnERSilent(ix: web3.TransactionInstruction) {
    const kp = tempKeypair.current;
    if (!kp) throw new Error("No temp keypair — delegate first");
    const tx = new web3.Transaction().add(ix);
    const { blockhash, lastValidBlockHeight } = await erConnection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = kp.publicKey;
    tx.sign(kp);
    const sig = await erConnection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
    await erConnection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
    return sig;
  }

  async function sendOnERWithWallet(ix: web3.TransactionInstruction) {
    if (!publicKey || !signTransaction) throw new Error("Wallet not connected");
    const tx = new web3.Transaction().add(ix);
    const { blockhash, lastValidBlockHeight } = await erConnection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = publicKey;
    const signed = await signTransaction(tx);
    const sig = await erConnection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
    await erConnection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
    return sig;
  }

  async function handleInitialize() {
    if (!publicKey || !tapScorePda) return;
    setLoading(true); setStatus("Initializing...");
    try {
      const ix = new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: tapScorePda, isSigner: false, isWritable: true },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: IX.Initialize,
      });
      await sendOnSolana(ix);
      setStatus("Initialized ✓");
      await fetchScores();
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }

  async function handleTap() {
    if (!publicKey || !tapScorePda) return;
    setTapping(true);
    setTimeout(() => setTapping(false), 120);

    if (isDelegated) {
      const ix = new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: false, isWritable: false },
          { pubkey: tapScorePda, isSigner: false, isWritable: true },
        ],
        data: buildTapData(1),
      });
      // Optimistic update — increment immediately for snappy feel
      setErScore((s) => (s ?? 0) + 1);
      try {
        const start = Date.now();
        await sendOnERSilent(ix);
        setStatus(`⚡ ${Date.now() - start}ms on ER`);
        await fetchScores();
      } catch (e: any) {
        setErScore((s) => (s ?? 1) - 1); // revert on error
        setStatus(`Error: ${e.message}`);
      }
    } else {
      setLoading(true);
      const ix = new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: tapScorePda, isSigner: false, isWritable: true },
        ],
        data: buildTapData(1),
      });
      try {
        const start = Date.now();
        await sendOnSolana(ix);
        setStatus(`🐢 ${Date.now() - start}ms on Solana`);
        await fetchScores();
      } catch (e: any) { setStatus(`Error: ${e.message}`); }
      finally { setLoading(false); }
    }
  }

  async function handleDelegate() {
    if (!publicKey || !tapScorePda) return;
    setLoading(true); setStatus("Delegating to ER...");
    try {
      const delegateBuffer    = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(tapScorePda, PROGRAM_ID);
      const delegationRecord  = delegationRecordPdaFromDelegatedAccount(tapScorePda);
      const delegationMetadata = delegationMetadataPdaFromDelegatedAccount(tapScorePda);
      const ix = new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: tapScorePda, isSigner: false, isWritable: true },
          { pubkey: PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: delegateBuffer, isSigner: false, isWritable: true },
          { pubkey: delegationRecord, isSigner: false, isWritable: true },
          { pubkey: delegationMetadata, isSigner: false, isWritable: true },
          { pubkey: new web3.PublicKey(DELEGATION_PROGRAM_ID), isSigner: false, isWritable: false },
        ],
        data: IX.Delegate,
      });
      await sendOnSolana(ix);
      setStatus("Setting up ER session...");
      const kp = web3.Keypair.generate();
      tempKeypair.current = kp;
      const airdropSig = await erConnection.requestAirdrop(kp.publicKey, 0.01 * web3.LAMPORTS_PER_SOL);
      await confirmTx(erConnection, airdropSig);
      setStatus("⚡ Session active — tap away, no popups!");
      await fetchScores();
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }

  async function handleCommit() {
    if (!publicKey || !tapScorePda) return;
    setLoading(true); setStatus("Committing to Solana...");
    try {
      const ix = new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: tapScorePda, isSigner: false, isWritable: true },
          { pubkey: new web3.PublicKey(MAGIC_PROGRAM_ID), isSigner: false, isWritable: false },
          { pubkey: new web3.PublicKey(MAGIC_CONTEXT_ID), isSigner: false, isWritable: true },
        ],
        data: IX.Commit,
      });
      const erSig = await sendOnERWithWallet(ix);
      setStatus("Waiting for ER → Solana...");
      await GetCommitmentSignature(erSig, erConnection);
      setStatus("Checkpointed ✓ Session still active.");
      await fetchScores();
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }

  async function handleUndelegate() {
    if (!publicKey || !tapScorePda) return;
    setLoading(true); setStatus("Ending session...");
    try {
      const ix = new web3.TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: tapScorePda, isSigner: false, isWritable: true },
          { pubkey: new web3.PublicKey(MAGIC_PROGRAM_ID), isSigner: false, isWritable: false },
          { pubkey: new web3.PublicKey(MAGIC_CONTEXT_ID), isSigner: false, isWritable: true },
        ],
        data: IX.CommitAndUndelegate,
      });
      const erSig = await sendOnERWithWallet(ix);
      setStatus("Waiting for ER → Solana...");
      await GetCommitmentSignature(erSig, erConnection);
      tempKeypair.current = null;
      setStatus("Session ended. Final score saved ✓");
      await fetchScores();
    } catch (e: any) { setStatus(`Error: ${e.message}`); }
    finally { setLoading(false); }
  }

  const initialized = solanaScore !== null;
  const tapColor = isDelegated ? "#14F195" : "#9945FF";

  return (
    <div style={styles.container}>
      <motion.h1
        style={styles.title}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        TapChain ⛓️
      </motion.h1>

      <motion.p
        style={styles.subtitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Tap on Solana. Tap faster on ER.
      </motion.p>

      <WalletMultiButton />

      {publicKey && (
        <motion.div
          style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Score boxes */}
          <div style={styles.scoreRow}>
            <ScoreBox label="Solana" score={solanaScore} color="#9945FF" note="~1000ms" />
            <ScoreBox label="Ephemeral Rollup" score={erScore} color="#14F195" note="~10ms ⚡" />
          </div>

          {/* Session badge */}
          <motion.div
            layout
            animate={{
              background: isDelegated ? "rgba(20,241,149,0.08)" : "rgba(153,69,255,0.08)",
              borderColor: isDelegated ? "#14F195" : "#9945FF",
            }}
            transition={{ duration: 0.4 }}
            style={styles.badge}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isDelegated ? "active" : "inactive"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {isDelegated ? "⚡ Session Active — No popups on ER" : "🐢 No Session — Tapping on Solana"}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* TAP button */}
          <motion.button
            style={{
              ...styles.tapButton,
              background: tapColor,
              color: isDelegated ? "#000" : "#fff",
              opacity: (!initialized || loading) ? 0.4 : 1,
            }}
            onClick={handleTap}
            disabled={!initialized || loading}
            animate={{
              scale: tapping ? 0.88 : 1,
              boxShadow: tapping
                ? `0 0 60px ${tapColor}99`
                : `0 0 24px ${tapColor}44`,
            }}
            whileHover={{ scale: initialized && !loading ? 1.04 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            TAP
          </motion.button>

          {/* Action buttons */}
          <div style={styles.actionRow}>
            <AnimatePresence mode="wait">
              {!initialized && (
                <motion.div key="init" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <ActionButton label="Initialize" onClick={handleInitialize} disabled={loading} color="#ffffff" />
                </motion.div>
              )}
              {initialized && !isDelegated && (
                <motion.div key="delegate" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <ActionButton label="Delegate →" onClick={handleDelegate} disabled={loading} color="#14F195" />
                </motion.div>
              )}
              {initialized && isDelegated && (
                <motion.div key="session" style={{ display: "flex", gap: "12px" }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <ActionButton label="Commit" onClick={handleCommit} disabled={loading} color="#FFD700" />
                  <ActionButton label="End Session" onClick={handleUndelegate} disabled={loading} color="#FF6B6B" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status message */}
          <AnimatePresence mode="wait">
            {status && (
              <motion.p
                key={status}
                style={styles.status}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {status}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {!publicKey && (
        <motion.p style={styles.hint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          Connect your wallet to start tapping
        </motion.p>
      )}
    </div>
  );
}

// ─── ScoreBox with animated number ───────────────────────────────────────────
function ScoreBox({ label, score, color, note }: { label: string; score: number | null; color: string; note: string }) {
  return (
    <motion.div
      style={{ ...styles.scoreBox, borderColor: color }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <p style={{ ...styles.scoreLabel, color }}>{label}</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={score}
          style={styles.scoreValue}
          initial={{ opacity: 0, y: -10, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {score ?? "—"}
        </motion.p>
      </AnimatePresence>
      <p style={styles.scoreNote}>{note}</p>
    </motion.div>
  );
}

function ActionButton({ label, onClick, disabled, color }: { label: string; onClick: () => void; disabled: boolean; color: string }) {
  return (
    <motion.button
      style={{ ...styles.actionButton, borderColor: color, color }}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05, backgroundColor: `${color}15` }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {label}
    </motion.button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container:    { display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", padding: "40px 20px", maxWidth: "600px", margin: "0 auto" },
  title:        { fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-1px" },
  subtitle:     { color: "#888", fontSize: "1rem" },
  scoreRow:     { display: "flex", gap: "20px", width: "100%" },
  scoreBox:     { flex: 1, border: "1px solid", borderRadius: "12px", padding: "20px", textAlign: "center", background: "#161616", cursor: "default" },
  scoreLabel:   { fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" },
  scoreValue:   { fontSize: "3rem", fontWeight: 800, minHeight: "3.5rem" },
  scoreNote:    { fontSize: "0.7rem", color: "#555", marginTop: "6px" },
  badge:        { border: "1px solid", borderRadius: "999px", padding: "6px 20px", fontSize: "0.8rem", fontWeight: 500 },
  tapButton:    { width: "180px", height: "180px", borderRadius: "50%", border: "none", fontSize: "2rem", fontWeight: 900, cursor: "pointer", letterSpacing: "2px" },
  actionRow:    { display: "flex", gap: "12px" },
  actionButton: { background: "transparent", border: "1px solid", borderRadius: "8px", padding: "10px 20px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
  status:       { fontSize: "0.85rem", color: "#aaa", textAlign: "center", maxWidth: "400px" },
  hint:         { color: "#555", fontSize: "0.9rem" },
};
