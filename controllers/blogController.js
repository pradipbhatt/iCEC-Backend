import BlogPost from '../models/blogPosts.js';

// Create a new blog post
export const createBlogPost = async (req, res) => {
  const { title, category, content, author } = req.body;
  const imageFile = req.file; // Get the uploaded image file from the request

  try {
    // Initialize imageURL to null
    let imageURL = null;

    // If there is an image file, upload it to Cloudinary
    if (imageFile) {
      const result = await cloudinary.uploader.upload(imageFile.path);
      imageURL = result.secure_url; // Get the URL of the uploaded image
    }

    const newPost = new BlogPost({
      title,
      category,
      content,
      author,
      imageURL, // Store the Cloudinary image URL
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ message: error.message });
  }
};


// Get all blog posts
export const getAllBlogPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single blog post by ID
export const getSingleBlogPost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a blog post
export const updateBlogPost = async (req, res) => {
  const { id } = req.params;
  const { title, category, content, author } = req.body;
  const imageURL = req.file ? req.file.path : null; // Get the image URL from the uploaded file

  try {
    const updatedPost = await BlogPost.findByIdAndUpdate(
      id,
      { title, category, content, imageURL, author },
      { new: true } // Return the updated document
    );

    if (!updatedPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a blog post
export const deleteBlogPost = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPost = await BlogPost.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
