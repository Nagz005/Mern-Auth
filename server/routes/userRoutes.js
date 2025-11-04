import express from "express";
import userAuth from "../middleware/userAuth.js"; // ✅ include .js extension
import { getUserData } from "../controllers/userController.js"; // make sure controller has .js extension

const userRouter = express.Router();

userRouter.get("/data", userAuth, getUserData);

export default userRouter;
