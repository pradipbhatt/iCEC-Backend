import express from 'express';
import {
  createBlogPost,
  getAllBlogPosts,
  getSingleBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '../controllers/blogController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Create a new blog post
router.post('/', upload.single('image'), createBlogPost); // Using multer for image upload

// Get all blog posts
router.get('/', getAllBlogPosts);

// Get a single blog post by ID
router.get('/:id', getSingleBlogPost);

// Update a blog post
router.put('/:id', upload.single('image'), updateBlogPost); // Using multer for image upload

// Delete a blog post
router.delete('/:id', deleteBlogPost);

export default router;
