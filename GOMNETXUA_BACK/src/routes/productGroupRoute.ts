import { Router } from "express";

import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../controllers/productGroupController";

const router = Router();

router.get("/", getAllGroups);

router.get("/:id", getGroupById);

router.post("/", createGroup);

router.put("/:id", updateGroup);

router.delete("/:id", deleteGroup);

export default router;