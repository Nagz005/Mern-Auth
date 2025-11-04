import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";

// register controller
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ success: false, message: "Missing Details" });
    }
    try {
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        const user = new userModel({ name, email, password: hashedPassword });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ success: true });

        // email sending code 


        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Welcome to Our Platform',
            text: `Hello ${user.name},\n\nThank you for registering on our platform!\n\nBest regards,\nTeam`
        };
        await transporter.sendMail(mailOptions);

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// login controller
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: "email and password required" });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" });
        }

        // ✅ mark account as verified on login
        if (!user.isAccountVerified) {
            user.isAccountVerified = true;
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // ✅ return user object so frontend knows account is verified
        return res.json({ success: true, message: "Logged in successfully", user });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



// logout controller
export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });

        return res.json({ success: true, message: "Logged out successfully" });

    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// send verify otp controller
export const sendVerifyotp = async (req, res) => {
    try {
        const userId = req.userId; // get userId from JWT middleware
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not logged in" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "User already verified" });
        }

        // generate OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // send mail
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Your Verification OTP",
            text: `Hello ${user.name},\n\nYour OTP for account verification is: ${otp}\nIt is valid for 10 minutes.\n\nBest regards,\nTeam`
        };
        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: "OTP sent to your email" });

    } catch (error) {
        console.error("sendVerifyotp error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// verify email controller
export const verifyEmail = async (req, res) => {
  try {
    const userId = req.userId; // from JWT middleware
    const { otp } = req.body;

    // 1. Validate input
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not logged in" });
    }

    if (!otp || otp.trim().length !== 6) {
      return res.status(400).json({ success: false, message: "OTP is required and must be 6 digits" });
    }

    // 2. Find user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 3. Check OTP validity
    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (!user.verifyOtpExpireAt || user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // 4. Mark account as verified
    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = null; // use null instead of 0 for clarity
    await user.save();

    // 5. Return success
    return res.status(200).json({ success: true, message: "Account verified successfully" });

  } catch (error) {
    console.error("verifyEmail error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// authentication check user is authenticated controller

export const isAuthenticated = async (req, res) => {

    try{
        return res.status(200).json({ success: true, message: "User is authenticated", userId: req.userId });

    }
    catch(error){
        return res.status(500).json({ success: false, message: error.message });
    }
}


// send reset otp controller for password reset

export const sendResetotp = async (req, res) => {

    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: "email required" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // generate OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();
        // send mail
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Your Password Reset OTP",
            text: `Hello ${user.name},\n\nYour OTP for password reset is: ${otp}\nIt is valid for 10 minutes.\n\nBest regards,\nTeam`
        };
        await transporter.sendMail(mailOptions);
        return res.json({ success: true, message: "OTP sent to your email" });


    }catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}


// reset password controller

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.json({ success: false, message: "email newpassword otp are required " });
    }
    try {
        const user = await userModel.findOne({email});

        if(!user){
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if(user.resetOtp === "" || user.resetOtp !== otp){
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 8);
        user.password = hashedPassword;
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;
        await user.save();
        return res.json({ success: true, message: "Password reset successfully" });

        

    }catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}