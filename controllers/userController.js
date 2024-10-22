import UserModel from '../models/User.js'; 
import TempUserModel from '../models/TempUserModel.js'; 
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto'; 
import ejs from 'ejs'; // Import EJS

export const registerUser = async (req, res) => {
    const { fullname, email, password } = req.body;

    // Check for required fields
    if (!fullname || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const existingUser = await UserModel.findOne({ email });
        const existingTempUser = await TempUserModel.findOne({ email });

        if (existingUser || existingTempUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const otp = crypto.randomInt(100000, 999999).toString(); // Generate a random OTP

        // Create a temporary user in TempUserModel
        const tempUser = new TempUserModel({
            fullname,
            email,
            password: hashedPassword,
            verificationToken,
            otp,
            otpExpires: Date.now() + 10 * 60 * 1000 // OTP expires in 10 minutes
        });

        await tempUser.save();

        // Send verification email with OTP and link
        const verificationLink = `https://icec.onrender.com/api/users/verify-email?token=${verificationToken}&otp=${otp}`;


        // Render the HTML email template with EJS
        ejs.renderFile('./views/emailVerificationTemplate.ejs', { fullname, verificationLink, otp }, async (err, html) => {
            if (err) {
                console.error('Error rendering email template:', err);
                return res.status(500).json({ message: "Error preparing verification email." });
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Verify Your Email',
                html: html, // Send the rendered HTML as email content
            });

            // Respond with a success message
            res.status(201).json({ message: "User registered successfully! Please verify your email." });
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Server error during registration" });
    }
};




export const verifyEmail = async (req, res) => {
    const { token, otp } = req.query;

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        // Find the temp user based on the decoded email
        const tempUser = await TempUserModel.findOne({ email: decoded.email });
        if (!tempUser) {
            console.error('Invalid token or user not found for email:', decoded.email);
            return res.status(404).json({ message: "Invalid token or user not found" });
        }

        // Check if the OTP is valid
        if (tempUser.otp !== otp || Date.now() > tempUser.otpExpires) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // If OTP is valid, move user data from TempUserModel to UserModel
        const newUser = new UserModel({
            fullname: tempUser.fullname,
            email: tempUser.email,
            password: tempUser.password,
            isAdmin: false, // Set admin status if needed
            isVerified: true,
        });
        await newUser.save();

        // Delete the temporary user after successful verification
        await TempUserModel.deleteOne({ email: decoded.email });

        // Render the verification success page
        res.render('verify', { message: "Email verified successfully! You can now log in." });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: "Server error during verification" });
    }
};

// Login User
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email first" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Add `name` to the token payload
        const token = jwt.sign(
            { name: user.fullname, email: user.email, id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: "25m" }
        );

        // Return the token along with user's name
        res.json({ status: "ok", token, name: user.fullname });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};




// Forgot Password
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const oldUser = await UserModel.findOne({ email });
        if (!oldUser) {
            return res.json({ status: "User not available" });
        }

        const secret = process.env.JWT_SECRET + oldUser.password;
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, { expiresIn: "10m" });

        const link = `https://kajal-backend.onrender.com/api/users/reset-password/${oldUser._id}/${token}`;

        // Set up nodemailer transporter
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS // Your email password or app password
            }
        });

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset",
            text: `Click on the link to reset your password: ${link}`,
        });

        res.json({ status: "ok", message: "Password reset link sent to your email!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Reset Password (POST to update the password)
export const resetPassword = async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;

    try {
        const oldUser = await UserModel.findOne({ _id: id });
        if (!oldUser) {
            return res.status(400).json({ status: "User not found" });
        }

        const secret = process.env.JWT_SECRET + oldUser.password;
        jwt.verify(token, secret, async (err) => {
            if (err) {
                return res.status(403).json({ status: "Invalid token or token expired" });
            }

            // Update the user's password
            const hashedPassword = await bcrypt.hash(password, 10);
            oldUser.password = hashedPassword;
            await oldUser.save();

            // Render the success page
            res.render('reset-success');
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};






export const getSingleUser = async (req, res) => {
    const { id } = req.params; // User ID from request parameters

    try {
        const user = await UserModel.findById(id).select("-password"); // Exclude password from response
        if (!user) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        res.json({ status: "ok", data: user });
    } catch (error) {
        console.error("Error retrieving user:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Get All Users
export const getAllUsers = async (req, res) => {
    let query = {};
    const searchData = req.query.search;

    if (searchData) {
        query = {
            $or: [
                { fullname: { $regex: searchData, $options: "i" } },
                { email: { $regex: searchData, $options: "i" } },
            ],
        };
    }

    try {
        const allUsers = await UserModel.find(query);
        res.json({ status: "ok", data: allUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Delete User
// Delete User
export const deleteUser = async (req, res) => {
    const { id } = req.params; // User ID from request parameters

    try {
        const result = await UserModel.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        res.json({ status: "ok", message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ status: "error", message: "Server error while deleting user" });
    }
};



// Update User
// Update User
export const updateUser = async (req, res) => {
    const { id } = req.params; // User ID from request parameters
    const updateData = req.body; // Data to update

    try {
        // Find user by ID and update with the provided data
        const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, {
            new: true, // Return the updated document
            runValidators: true // Validate the update operation
        });

        // Check if the user was found and updated
        if (!updatedUser) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        res.json({
            status: "ok",
            message: "User updated successfully",
            data: updatedUser
        });
    } catch (error) {
        console.error("Error updating user:", error);

        // Send specific validation error details if available
        if (error.name === 'ValidationError') {
            return res.status(400).json({ status: "error", message: "Validation error", details: error.errors });
        }

        res.status(500).json({ status: "error", message: "Server error while updating user" });
    }
};




// Get Paginated Users
export const getPaginatedUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to 1
    const limit = parseInt(req.query.limit) || 10; // Default limit
    const startIndex = (page - 1) * limit;

    try {
        const allUsers = await UserModel.find({});
        const results = {
            totalUser: allUsers.length,
            pageCount: Math.ceil(allUsers.length / limit),
            result: allUsers.slice(startIndex, startIndex + limit),
        };

        if (startIndex + limit < allUsers.length) {
            results.next = { page: page + 1 };
        }
        if (startIndex > 0) {
            results.prev = { page: page - 1 };
        }

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};


// Render Reset Password Page
export const resetPasswordPage = async (req, res) => {
    const { id, token } = req.params;

    try {
        const oldUser = await UserModel.findOne({ _id: id });
        if (!oldUser) {
            return res.status(400).json({ status: "User not found" });
        }

        const secret = process.env.JWT_SECRET + oldUser.password;
        jwt.verify(token, secret, (err) => {
            if (err) {
                return res.status(403).json({ status: "Invalid token or token expired" });
            }

            // Render reset.ejs with id and token as parameters
            res.render('reset', { id, token });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

