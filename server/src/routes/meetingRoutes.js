import { Router } from "express";
import {
  archiveMeeting,
  createMeeting,
  deleteMeeting,
  getMeeting,
  getMeetingHistory,
  listMeetings,
  publishMeeting,
  unpublishMeeting,
  updateMeeting,
} from "../controllers/meetingController.js";
import { requireAuth, requireOperationsManager } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth);
router.get("/", listMeetings);
router.get("/:meetingId", getMeeting);
router.post("/", requireOperationsManager, createMeeting);
router.put("/:meetingId", requireOperationsManager, updateMeeting);
router.post("/:meetingId/publish", requireOperationsManager, publishMeeting);
router.post("/:meetingId/unpublish", requireOperationsManager, unpublishMeeting);
router.post("/:meetingId/archive", requireOperationsManager, archiveMeeting);
router.delete("/:meetingId", requireOperationsManager, deleteMeeting);
router.get("/:meetingId/history", requireOperationsManager, getMeetingHistory);

export default router;

