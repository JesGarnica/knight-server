import { Router } from "express";
const router = Router();

import userController from "../api/users.js";

router.use("/users", userController);

export default router;
