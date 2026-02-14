import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
        return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ email, password: hashedPassword });

    res.json({ message: "User registered successfully" });
});


// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
        return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
        return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
        {
            id: user._id,
            email: user.email
        }, 
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false // should be true in production level to protect cookies to be accessed on http also
    });

    res.json({ message: "Login successful" });
});

// Logout
router.post("/logout", (req, res) => {
    console.log("logout runned");
    res.clearCookie("token");
    res.json({ message: "Logged out" });
});


router.get("/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not logged in" });

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        res.json({
            message: "User authenticated successfully",
            user: user
        });
    } catch {
        res.status(403).json({ message: "Invalid token" });
    }
});

export default router;
