const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const { deleteFiles } = require('../middlewares/upload.js');
const path = require('path');

class ProductController {
  static async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded files if validation fails
        if (req.files && req.files.length > 0) {
          const filePaths = req.files.map(file => file.path);
          deleteFiles(filePaths);
        }
        return res.status(400).json({ errors: errors.array() });
      }

      // Process uploaded images
      const images = req.files ? req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        url: `/uploads/products/${file.filename}` // URL to access the image
      })) : [];

      const productData = {
        ...req.body,
        created_by: req.user.id,
        images: images
      };

      const product = await Product.create(productData);
      
      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (error) {
      console.error('Create product error:', error);
      
      // Clean up uploaded files if database operation fails
      if (req.files && req.files.length > 0) {
        const filePaths = req.files.map(file => file.path);
        deleteFiles(filePaths);
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getProducts(req, res) {
    try {
      const { category, search } = req.query;
      const filters = {};
      
      if (category) filters.category = category;
      if (search) filters.search = search;

      const products = await Product.getAll(filters);
      
      res.json({ products });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json({ product });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async updateProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded files if validation fails
        if (req.files && req.files.length > 0) {
          const filePaths = req.files.map(file => file.path);
          deleteFiles(filePaths);
        }
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      
      // Get existing product to handle old images
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        // Clean up uploaded files if product doesn't exist
        if (req.files && req.files.length > 0) {
          const filePaths = req.files.map(file => file.path);
          deleteFiles(filePaths);
        }
        return res.status(404).json({ message: 'Product not found' });
      }

      // Process new uploaded images
      const newImages = req.files ? req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
        url: `/uploads/products/${file.filename}`
      })) : [];

      // If new images are uploaded, replace old ones
      let imagesToSave = newImages.length > 0 ? newImages : existingProduct.images;

      const productData = {
        ...req.body,
        images: imagesToSave
      };

      const product = await Product.update(id, productData);

      // Delete old images if new ones were uploaded
      if (newImages.length > 0 && existingProduct.images && existingProduct.images.length > 0) {
        const oldImagePaths = existingProduct.images.map(img => img.path);
        deleteFiles(oldImagePaths);
      }
      
      res.json({
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      console.error('Update product error:', error);
      
      // Clean up uploaded files if database operation fails
      if (req.files && req.files.length > 0) {
        const filePaths = req.files.map(file => file.path);
        deleteFiles(filePaths);
      }
      
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.delete(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Delete associated image files
      if (product.images && product.images.length > 0) {
        const imagePaths = product.images.map(img => img.path);
        deleteFiles(imagePaths);
      }
      
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getCategories(req, res) {
    try {
      const categories = await Product.getCategories();
      res.json({ categories });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // New method to delete specific images
  static async deleteProductImage(req, res) {
    try {
      const { id, imageIndex } = req.params;
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (!product.images || product.images.length === 0) {
        return res.status(404).json({ message: 'No images found for this product' });
      }

      const imageIndexNum = parseInt(imageIndex);
      if (imageIndexNum < 0 || imageIndexNum >= product.images.length) {
        return res.status(400).json({ message: 'Invalid image index' });
      }

      // Get the image to delete
      const imageToDelete = product.images[imageIndexNum];
      
      // Remove image from array
      const updatedImages = product.images.filter((_, index) => index !== imageIndexNum);
      
      // Update product with new images array
      await Product.update(id, { 
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock_quantity: product.stock_quantity,
        images: updatedImages 
      });

      // Delete the physical file
      deleteFiles([imageToDelete.path]);

      res.json({ 
        message: 'Image deleted successfully',
        remainingImages: updatedImages.length
      });
    } catch (error) {
      console.error('Delete product image error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = ProductController;
