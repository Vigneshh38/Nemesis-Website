import "server-only";
import mongoose, { Schema, type Model, type Types } from "mongoose";

/* ───────── Arena ───────── */

export interface IPlayer {
  userId: string;
  name: string;
  imageUrl: string;
  points: number;
  solves: number;
  lastSolveAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISolve {
  userId: string;
  challengeId: string;
  points: number;
  createdAt?: Date;
}

export interface IAttempt {
  userId: string;
  challengeId: string;
  correct: boolean;
  createdAt: Date;
}

const playerSchema = new Schema<IPlayer>(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    points: { type: Number, default: 0 },
    solves: { type: Number, default: 0 },
    lastSolveAt: { type: Date, default: null },
  },
  { timestamps: true },
);
playerSchema.index({ points: -1, lastSolveAt: 1 });

const solveSchema = new Schema<ISolve>(
  {
    userId: { type: String, required: true, index: true },
    challengeId: { type: String, required: true, index: true },
    points: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
solveSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

const attemptSchema = new Schema<IAttempt>({
  userId: { type: String, required: true, index: true },
  challengeId: { type: String, required: true },
  correct: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 },
});

/* ───────── Incident reports ───────── */

export const REPORT_TYPES = ["phishing", "upi-fraud", "job-scam", "account-takeover", "malware", "harassment", "other"] as const;
export const REPORT_STATUSES = ["received", "investigating", "resolved", "dismissed"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface IEvidence {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface IReport {
  _id: Types.ObjectId;
  caseId: string;
  userId: string;
  reporterName: string;
  reporterEmail: string;
  type: ReportType;
  title: string;
  description: string;
  suspectUrl: string;
  amountLost: number;
  occurredOn: Date;
  evidence: IEvidence[];
  autoScan: { risk: number | null; headline: string };
  status: ReportStatus;
  adminNote: string;
  createdAt: Date;
  updatedAt: Date;
}

const evidenceSchema = new Schema<IEvidence>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
  },
  { _id: false },
);

const reportSchema = new Schema<IReport>(
  {
    caseId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    reporterName: { type: String, required: true },
    reporterEmail: { type: String, required: true },
    type: { type: String, enum: REPORT_TYPES, required: true },
    title: { type: String, required: true, maxlength: 140 },
    description: { type: String, required: true, maxlength: 4000 },
    suspectUrl: { type: String, default: "" },
    amountLost: { type: Number, default: 0 },
    occurredOn: { type: Date, required: true },
    evidence: { type: [evidenceSchema], default: [] },
    autoScan: {
      risk: { type: Number, default: null },
      headline: { type: String, default: "" },
    },
    status: { type: String, enum: REPORT_STATUSES, default: "received", index: true },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Player: Model<IPlayer> = (mongoose.models.Player as Model<IPlayer>) ?? mongoose.model<IPlayer>("Player", playerSchema);
export const Solve: Model<ISolve> = (mongoose.models.Solve as Model<ISolve>) ?? mongoose.model<ISolve>("Solve", solveSchema);
export const Attempt: Model<IAttempt> = (mongoose.models.Attempt as Model<IAttempt>) ?? mongoose.model<IAttempt>("Attempt", attemptSchema);
export const Report: Model<IReport> = (mongoose.models.Report as Model<IReport>) ?? mongoose.model<IReport>("Report", reportSchema);
