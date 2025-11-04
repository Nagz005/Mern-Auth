import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
    try {
        // 1️⃣ Get token from cookies
        const token = req.cookies?.token; // optional chaining to avoid errors
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided"
            });
        }

        // 2️⃣ Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded?.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid token"
            });
        }

        // 3️⃣ Attach userId to request
        req.userId = decoded.id;

        // ✅ Proceed to next middleware
        next();

    } catch (error) {
        console.error("JWT verification error:", error.message);
        return res.status(401).json({
            success: false,
            message: `Unauthorized: Invalid token - ${error.message}`
        });
    }
};

export default userAuth;
