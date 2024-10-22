import mongoose from 'mongoose';

// Blog Post schema
const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  createdTime: {
    type: Date,
    default: Date.now, // Automatically sets the current date and time
  },
  content: {
    type: String,
    required: true,
  },
  imageURL: {
    type: String,
    trim: true,
  },
  author: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
});

// Create the BlogPost model
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

// Export the BlogPost model
export default BlogPost;
