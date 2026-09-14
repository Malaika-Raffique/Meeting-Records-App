import mongoose from "mongoose";

const meetingRevisionSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    version: { type: Number, required: true },
    action: { type: String, enum: ["created", "updated", "published", "archived"], required: true },
    changedFields: [{ type: String }],
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

meetingRevisionSchema.index({ meeting: 1, version: -1 }, { unique: true });

export const MeetingRevision = mongoose.model("MeetingRevision", meetingRevisionSchema);
