# TapChain

A real-time on-chain tapping game built with native Rust + MagicBlock Ephemeral Rollups.

Tap as fast as you can. Your score updates in real-time on the Ephemeral Rollup. When your session ends, your final score is committed permanently to Solana.

---

## Why this project?

On-chain games fail at interactivity. Every state update on Solana costs ~1 second of latency — long enough to break the illusion of a real-time experience. TapChain is the simplest possible proof that this doesn't have to be true. A tapping game is deliberately trivial in business logic, which makes the infrastructure the story. If you can tap at 100ms instead of 1000ms, you can build anything real-time on Solana.

---

## What problem does it solve?

Solana's 400ms slot time and ~1s confirmation latency make interactive applications feel broken. For games, auctions, trading UIs, and any UX that expects sub-second feedback, this is a hard ceiling. Developers are forced to choose between on-chain permanence and real-time UX.

TapChain demonstrates that this is a false choice. By delegating the game account to an Ephemeral Rollup, state transitions drop to ~10ms. When the session ends, the final state is committed back to Solana — permanent, verifiable, trustless.

---

## Why Ephemeral Rollups and MagicBlock?

Three reasons:

**1. Speed without leaving Solana.** The ER is not a separate chain or L2. It is a temporary execution environment that borrows accounts from Solana and returns them. Your program's security guarantees come from Solana. Your latency comes from the ER.

**2. Zero rewrite.** The `tap()` instruction is identical on Solana and the ER. Same bytecode, same logic. What changes is which runtime holds write authority over the account. The ER integration is additive — four new instructions (`delegate`, `commit`, `commit_and_undelegate`, `undelegate`) alongside your existing program.

**3. Automatic state synchronization.** The `DelegateConfig` sets `commit_frequency_ms: 35`, meaning the ER auto-commits state to Solana every 35ms. The base layer is always close to current. When the session ends, `commit_and_undelegate` atomically finalizes the score and returns the account.

---

## Architecture

```
[Solana Base Layer]                  [Ephemeral Rollup]

  initialize()
  delegate()  ──────────────────────►
                                       tap() tap() tap() ...
               ◄─── commit()           (score checkpointed, session continues)
                                       tap() tap() tap() ...
  ◄─── commit_and_undelegate()         (final score committed, session ends)
```

**Account:** `TapScore { score: u64 }` — PDA with seeds `["tapscore", player_pubkey]`

**Instructions:**

| # | Instruction | Runs on | Purpose |
|---|---|---|---|
| 0 | `initialize` | Solana | Create TapScore PDA |
| 1 | `tap` | Solana or ER | Increment score |
| 2 | `delegate` | Solana | Hand account to ER, start session |
| 3 | `commit_and_undelegate` | ER | Commit final score, end session |
| 4 | `commit` | ER | Checkpoint score, session continues |
| 5 | `undelegate` | Validator-called | Restore account owner on Solana |

---

## Tech Stack

- **Program:** Native Rust (no Anchor) — `solana-program`, `borsh`, `ephemeral-rollups-sdk`
- **Tests:** TypeScript — `@solana/web3.js`, `@magicblock-labs/ephemeral-rollups-sdk`

**Why native Rust?**
- Fine-grained control over account handling and CPI calls
- Smaller binary = lower deployment cost and higher runtime performance
- No Anchor versioning constraints

---

## Requirements

- Rust + Cargo
- Solana CLI 2.x
- Node.js 18+

---

## Build

```bash
cargo build-sbf
```

This compiles the program to `target/deploy/tap_chain.so` and generates the program keypair at `target/deploy/tap_chain-keypair.json`.

---

## Deploy

```bash
solana config set --url devnet
solana program deploy target/deploy/tap_chain.so
```

---

## Run Tests

```bash
npm install
npm test
```

To use the local ER validator (much faster — ~6ms vs ~200ms):

```bash
# Install local validator
npm install -g @magicblock-labs/ephemeral-validator

# Start it (connects to devnet)
ephemeral-validator --rpc-port 8899

# Run tests against local ER
EPHEMERAL_PROVIDER_ENDPOINT=http://localhost:8899 \
EPHEMERAL_WS_ENDPOINT=ws://localhost:8899 \
npm test
```

---

## Performance

| Environment | Tap latency |
|---|---|
| Solana devnet | ~1000ms |
| ER (devnet validator) | ~200ms (first tap ~600ms — account clone) |
| ER (local validator) | ~6ms |

The first ER transaction is always slower because it clones the account from Solana to the ER before executing.
