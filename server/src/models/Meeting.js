import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true, maxlength: 80 },
    project: { type: String, trim: true, maxlength: 160 },
    workDetails: { type: String, trim: true, maxlength: 3000 },
    owner: { type: String, trim: true, maxlength: 120 },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["planning", "in_progress", "blocked", "done", "on_hold"],
      default: "planning",
    },
  },
  { _id: true },
);

const pipelineSchema = new mongoose.Schema(
  {
    priority: { type: String, trim: true, maxlength: 80 },
    project: { type: String, trim: true, maxlength: 160 },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { _id: true },
);

const liveProductSchema = new mongoose.Schema(
  {
    product: { type: String, trim: true, maxlength: 160 },
    weeklyPerformance: { type: String, trim: true, maxlength: 3000 },
    improvements: { type: String, trim: true, maxlength: 3000 },
    status: { type: String, trim: true, maxlength: 80 },
  },
  { _id: true },
);

const employeeReportSchema = new mongoose.Schema(
  {
    person: { type: String, trim: true, maxlength: 120 },
    focus: { type: String, trim: true, maxlength: 2000 },
    progress: { type: String, trim: true, maxlength: 2000 },
    blocker: { type: String, trim: true, maxlength: 2000 },
  },
  { _id: true },
);

const actionItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    owner: { type: String, trim: true, maxlength: 120 },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "complete", "blocked"],
      default: "not_started",
    },
  },
  { _id: true },
);

const meetingSchema = new mongoose.Schema(
  {
    meetingNumber: { type: Number, required: true, unique: true, min: 1 },
    date: { type: Date, required: true, index: true },
    ticketNumber: { type: String, trim: true, maxlength: 100, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    recap: { type: String, trim: true, maxlength: 8000 },
    sales: {
      newLeads: { type: String, trim: true, maxlength: 3000 },
      negotiation: { type: String, trim: true, maxlength: 3000 },
      closed: { type: String, trim: true, maxlength: 3000 },
      lost: { type: String, trim: true, maxlength: 3000 },
      upcoming: { type: String, trim: true, maxlength: 3000 },
      blockers: { type: String, trim: true, maxlength: 3000 },
    },
    marketing: {
      activity: { type: String, trim: true, maxlength: 3000 },
      results: { type: String, trim: true, maxlength: 3000 },
      learnings: { type: String, trim: true, maxlength: 3000 },
      nextStrategy: { type: String, trim: true, maxlength: 3000 },
      blockers: { type: String, trim: true, maxlength: 3000 },
    },
    hosting: {
      renewals: { type: String, trim: true, maxlength: 3000 },
      renewalPlan: { type: String, trim: true, maxlength: 3000 },
      newSignups: { type: String, trim: true, maxlength: 3000 },
      cancelled: { type: String, trim: true, maxlength: 3000 },
      supportTickets: { type: String, trim: true, maxlength: 3000 },
      blockers: { type: String, trim: true, maxlength: 3000 },
    },
    currentProjects: [projectSchema],
    productPipeline: [pipelineSchema],
    liveProducts: [liveProductSchema],
    plansAhead: { type: String, trim: true, maxlength: 6000 },
    teamCheckIn: { type: String, trim: true, maxlength: 6000 },
    knowledgeSession: {
      topic: { type: String, trim: true, maxlength: 500 },
      nextTopic: { type: String, trim: true, maxlength: 500 },
      presenter: { type: String, trim: true, maxlength: 120 },
    },
    quoteOfTheWeek: { type: String, trim: true, maxlength: 1000 },
    employeeReports: [employeeReportSchema],
    actionItems: [actionItemSchema],
    foundersNotes: { type: String, trim: true, maxlength: 6000 },
    closingNotes: { type: String, trim: true, maxlength: 6000 },
    currentVersion: { type: Number, default: 1, min: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date },
    archivedAt: { type: Date },
  },
  { timestamps: true },
);

meetingSchema.index({ status: 1, date: -1 });
meetingSchema.index({ "currentProjects.project": 1 });
   meetingSchema.index({ "actionItems.owner": 1 });
export const Meeting = mongoose.model("Meeting", meetingSchema);
