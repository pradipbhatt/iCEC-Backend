import mongoose from 'mongoose';

// User schema with email verification
const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,  // Regular user by default
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
    },
}, {
    timestamps: true,  // Automatically adds createdAt and updatedAt fields
});

export default mongoose.model('User', userSchema);
