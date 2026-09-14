import mongoose from "mongoose";
import { Meeting } from "../models/Meeting.js";
import { MeetingRevision } from "../models/MeetingRevision.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const editableFields = [
  "meetingNumber",
  "date",
  "ticketNumber",
  "recap",
  "sales",
  "marketing",
  "hosting",
  "currentProjects",
  "productPipeline",
  "liveProducts",
  "plansAhead",
  "teamCheckIn",
  "knowledgeSession",
  "quoteOfTheWeek",
  "employeeReports",
  "actionItems",
  "foundersNotes",
  "closingNotes",
];

const cleanPayload = (body) =>
  Object.fromEntries(
    editableFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]),
  );

const assertValidPayload = (payload, isCreate = false) => {
  if (isCreate && (!Number.isInteger(Number(payload.meetingNumber)) || Number(payload.meetingNumber) < 1)) {
    throw new ApiError(400, "Meeting number must be a positive whole number");
  }
  if (isCreate && !payload.date) throw new ApiError(400, "Meeting date is required");
  if (payload.date && Number.isNaN(new Date(payload.date).getTime())) {
    throw new ApiError(400, "Meeting date is invalid");
  }

  for (const field of ["currentProjects", "productPipeline", "liveProducts", "employeeReports", "actionItems"]) {
    if (Object.hasOwn(payload, field) && !Array.isArray(payload[field])) {
      throw new ApiError(400, `${field} must be a list`);
    }
  }
  for (const field of ["sales", "marketing", "hosting", "knowledgeSession"]) {
    if (Object.hasOwn(payload, field) && (payload[field] === null || typeof payload[field] !== "object" || Array.isArray(payload[field]))) {
      throw new ApiError(400, `${field} must be an object`);
    }
  }
};

const snapshot = (meeting) => JSON.parse(JSON.stringify(meeting.toObject()));

const writeRevision = async ({ meeting, action, changedFields, changedBy }) => {
  await MeetingRevision.create({
    meeting: meeting._id,
    version: meeting.currentVersion,
    action,
    changedFields,
    snapshot: snapshot(meeting),
    changedBy,
  });
};

const populatePeople = (query) =>
  query.populate([
    { path: "createdBy", select: "fullName email role" },
    { path: "updatedBy", select: "fullName email role" },
  ]);

const getMeetingForRequest = async (id, req) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Meeting not found");
  const filter = { _id: id };
  if (!req.auth?.canManageOperations) filter.status = "published";
  const meeting = await populatePeople(Meeting.findOne(filter));
  if (!meeting) throw new ApiError(404, "Meeting not found");
  return meeting;
};

const escapedRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listMeetings = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
  const filter = req.auth?.canManageOperations ? {} : { status: "published" };

  const allowedStatuses = ["draft", "published", "archived"];
  if (req.auth?.canManageOperations && allowedStatuses.includes(req.query.status)) {
    filter.status = req.query.status;
  }
  // Date / Timeframe Filtering (Year, Month, Week, Day/Date)
  if (req.query.date && !Number.isNaN(new Date(req.query.date).getTime())) {
    const d = new Date(req.query.date);
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
    filter.date = { $gte: start, $lte: end };
  } else if (/^\d{4}$/.test(req.query.year || "")) {
    const yearVal = Number(req.query.year);
    if (req.query.month && /^\d{1,2}$/.test(req.query.month)) {
      const monthIdx = Number(req.query.month) - 1;
      if (req.query.week && /^\d{1,2}$/.test(req.query.week)) {
        const weekNum = Number(req.query.week);
        const startDay = (weekNum - 1) * 7 + 1;
        let endDay = weekNum * 7;
        const daysInMonth = new Date(Date.UTC(yearVal, monthIdx + 1, 0)).getUTCDate();
        if (endDay > daysInMonth) endDay = daysInMonth;
        const start = new Date(Date.UTC(yearVal, monthIdx, startDay, 0, 0, 0));
        const end = new Date(Date.UTC(yearVal, monthIdx, endDay, 23, 59, 59, 999));
        filter.date = { $gte: start, $lte: end };
      } else if (req.query.day && /^\d{1,2}$/.test(req.query.day)) {
        const dayVal = Number(req.query.day);
        const start = new Date(Date.UTC(yearVal, monthIdx, dayVal, 0, 0, 0));
        const end = new Date(Date.UTC(yearVal, monthIdx, dayVal, 23, 59, 59, 999));
        filter.date = { $gte: start, $lte: end };
      } else {
        const start = new Date(Date.UTC(yearVal, monthIdx, 1));
        const end = new Date(Date.UTC(yearVal, monthIdx + 1, 1));
        filter.date = { $gte: start, $lt: end };
      }
    } else if (req.query.week && /^\d{1,2}$/.test(req.query.week)) {
      const weekNum = Number(req.query.week);
      const simple = new Date(Date.UTC(yearVal, 0, 1 + (weekNum - 1) * 7));
      const dayOfWeek = simple.getUTCDay();
      const isoMonday = new Date(simple);
      if (dayOfWeek <= 4) isoMonday.setUTCDate(simple.getUTCDate() - (simple.getUTCDay() || 7) + 1);
      else isoMonday.setUTCDate(simple.getUTCDate() + (8 - (simple.getUTCDay() || 7)));
      const end = new Date(isoMonday);
      end.setUTCDate(isoMonday.getUTCDate() + 7);
      filter.date = { $gte: isoMonday, $lt: end };
    } else {
      filter.date = {
        $gte: new Date(Date.UTC(yearVal, 0, 1)),
        $lt: new Date(Date.UTC(yearVal + 1, 0, 1)),
      };
    }
  }
  if (req.query.q?.trim()) {
    const searchTerm = req.query.q.trim().slice(0, 80);
    const term = new RegExp(escapedRegex(searchTerm), "i");
    const searchFields = [
      { ticketNumber: term },
      { recap: term },
      { "currentProjects.project": term },
      { "currentProjects.owner": term },
      { "employeeReports.person": term },
      { "actionItems.owner": term },
      { "actionItems.description": term },
      { foundersNotes: term },
      { closingNotes: term },
    ];
    if (/^\d+$/.test(searchTerm)) searchFields.unshift({ meetingNumber: Number(searchTerm) });
    filter.$or = searchFields;
  }

  const [meetings, total, totalPublished, activeEmployeeCount] = await Promise.all([
    populatePeople(Meeting.find(filter).sort({ date: -1, meetingNumber: -1 }).skip((page - 1) * limit).limit(limit)),
    Meeting.countDocuments(filter),
    Meeting.countDocuments({ status: "published" }),
    User.countDocuments({ role: "employee", isActive: true }),
  ]);

  res.json({
    success: true,
    data: {
      meetings,
      page,
      total,
      totalPublished,
      activeEmployeeCount,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});


export const getMeeting = asyncHandler(async (req, res) => {
  const meeting = await getMeetingForRequest(req.params.meetingId, req);
  res.json({ success: true, data: { meeting } });
});

export const createMeeting = asyncHandler(async (req, res) => {
  const payload = cleanPayload(req.body);
  assertValidPayload(payload, true);

  const meeting = await Meeting.create({
    ...payload,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  await writeRevision({
    meeting,
    action: "created",
    changedFields: editableFields.filter((field) => Object.hasOwn(payload, field)),
    changedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: { meeting } });
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await getMeetingForRequest(req.params.meetingId, req);
  const payload = cleanPayload(req.body);
  assertValidPayload(payload);
  const changedFields = editableFields.filter(
    (field) => Object.hasOwn(payload, field) && JSON.stringify(meeting[field]) !== JSON.stringify(payload[field]),
  );

  if (!changedFields.length) {
    return res.json({ success: true, data: { meeting }, message: "No changes to save" });
  }

  Object.assign(meeting, payload, {
    updatedBy: req.user._id,
    currentVersion: meeting.currentVersion + 1,
  });
  await meeting.save();
  await writeRevision({ meeting, action: "updated", changedFields, changedBy: req.user._id });

  res.json({ success: true, data: { meeting } });
});

const changeLifecycleStatus = (status) =>
  asyncHandler(async (req, res) => {
    const meeting = await getMeetingForRequest(req.params.meetingId, req);
    if (meeting.status === status) {
      return res.json({ success: true, data: { meeting }, message: `Meeting is already ${status}` });
    }

    meeting.status = status;
    meeting.updatedBy = req.user._id;
    meeting.currentVersion += 1;
    if (status === "published") meeting.publishedAt = new Date();
    if (status === "archived") meeting.archivedAt = new Date();
    await meeting.save();
    await writeRevision({ meeting, action: status === "published" ? "published" : "archived", changedFields: ["status"], changedBy: req.user._id });
    res.json({ success: true, data: { meeting } });
  });

export const publishMeeting = changeLifecycleStatus("published");
export const unpublishMeeting = changeLifecycleStatus("draft");
export const archiveMeeting = changeLifecycleStatus("archived");

export const getMeetingHistory = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.meetingId)) throw new ApiError(404, "Meeting not found");
  const revisions = await MeetingRevision.find({ meeting: req.params.meetingId })
    .sort({ version: -1 })
    .populate("changedBy", "fullName email role");
  res.json({ success: true, data: { revisions } });
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.meetingId)) throw new ApiError(404, "Meeting not found");
  const meeting = await Meeting.findByIdAndDelete(req.params.meetingId);
  if (!meeting) throw new ApiError(404, "Meeting record not found");
  await MeetingRevision.deleteMany({ meeting: req.params.meetingId });
  res.json({ success: true, message: "Meeting record deleted successfully" });
});

