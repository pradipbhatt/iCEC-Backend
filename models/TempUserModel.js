import mongoose from 'mongoose';

const TempUserSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    verificationToken: String,
    otp: String,
    otpExpires: Date
});

const TempUserModel = mongoose.model('TempUser', TempUserSchema);

export default TempUserModel; // Ensure this is a default export
