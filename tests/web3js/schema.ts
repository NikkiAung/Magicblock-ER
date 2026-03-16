import * as borsh from "borsh";

// Mirrors TapScore { score: u64 } in state.rs
export class TapScore {
  score: number;
  constructor(fields: { score: number } | undefined = undefined) {
    this.score = fields?.score ?? 0;
  }
}

export const TapScoreSchema = new Map([
  [TapScore, { kind: "struct", fields: [["score", "u64"]] }],
]);

// Instruction discriminators — must match instruction.rs exactly
export enum TapChainInstruction {
  Initialize          = "0000000000000000",
  Tap                 = "0100000000000000",
  Delegate            = "0200000000000000",
  CommitAndUndelegate = "0300000000000000",
  Commit              = "0400000000000000",
  Undelegate          = "C41C29CE302533A7",
}

// Payload for Tap instruction (increase_by: u64)
export class TapPayload {
  increase_by: number;
  constructor(increase_by: number) {
    this.increase_by = increase_by;
  }
  static schema = new Map([
    [TapPayload, { kind: "struct", fields: [["increase_by", "u64"]] }],
  ]);
}

export function buildTapInstruction(increaseBy: number): Buffer {
  return Buffer.concat([
    Buffer.from(TapChainInstruction.Tap, "hex"),
    Buffer.from(borsh.serialize(TapPayload.schema, new TapPayload(increaseBy))),
  ]);
}
