import express from "express";
import { register, login, logout,sendVerifyotp,verifyEmail, isAuthenticated, sendResetotp ,resetPassword} from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout); 
router.post('/send-verify-otp', userAuth,sendVerifyotp);
router.post('/verify-account',userAuth, verifyEmail);
router.get('/is-auth',userAuth,isAuthenticated);
router.post('/send-reset-otp',sendResetotp);
router.post('/reset-password',resetPassword);



export default router;
