import express from 'express';
import {
    registerUser,
    getSingleUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getAllUsers,
    deleteUser,
    updateUser,
    getPaginatedUsers,
    resetPasswordPage,
    verifyEmail
} from '../controllers/userController.js';

const router = express.Router();

// User Registration
// User Registration
router.post('/register', registerUser); 

// Render OTP input page
router.get('/verify-email', verifyEmail); 

router.get('/user/:id', getSingleUser);

// User Login
router.post('/login', loginUser);

router.post('/forgot-password', forgotPassword);

// Reset Password (POST to update the password)
router.post('/reset-password/:id/:token', resetPassword);

// Render Forgot Password Page (GET)
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});


// Render Reset Password Page (GET)
router.get('/reset-password/:id/:token', resetPasswordPage);


// Get single user
router.get('/:id', getSingleUser);    //done tested

// Get All Users 
router.get('/', getAllUsers);        //tested successfully

// Get Paginated Users
router.get('/paginated', getPaginatedUsers);

// Delete User
router.delete('/:id', deleteUser); // Updated to accept a user ID in the URL

// Update User
router.put('/:id', updateUser);

// Export the router
export default router;
