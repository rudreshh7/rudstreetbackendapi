const express = require('express');
const { body } = require('express-validator');
const ProductController = require('../controllers/ProductController');
const { authenticateToken, requireRole } = require('../middlewares/auth');
const { uploadProductImages, handleMulterError } = require('../middlewares/upload');

const router = express.Router();

// Product validation (removed image_url since we're using file uploads now)
const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer')
];

// Public routes
router.get('/', ProductController.getProducts);
router.get('/categories', ProductController.getCategories);
router.get('/:id', ProductController.getProduct);

// Admin only routes with image upload
router.post('/', 
  authenticateToken, 
  requireRole(['admin']), 
  uploadProductImages, 
  handleMulterError,
  productValidation, 
  ProductController.createProduct
);

router.put('/:id', 
  authenticateToken, 
  requireRole(['admin']), 
  uploadProductImages, 
  handleMulterError,
  productValidation, 
  ProductController.updateProduct
);

router.delete('/:id', 
  authenticateToken, 
  requireRole(['admin']), 
  ProductController.deleteProduct
);

// New route to delete specific image
router.delete('/:id/images/:imageIndex', 
  authenticateToken, 
  requireRole(['admin']), 
  ProductController.deleteProductImage
);

// Add to your productRoutes.js for testing
router.post('/test-upload', 
  uploadProductImages, 
  handleMulterError,
  (req, res) => {
    console.log('Test upload - Body:', req.body);
    console.log('Test upload - Files:', req.files);
    console.log('Files saved to:', req.files?.map(f => f.path));
    
    res.json({
      message: 'Test upload successful',
      body: req.body,
      files: req.files?.map(f => ({
        filename: f.filename,
        path: f.path,
        size: f.size
      }))
    });
  }
);

module.exports = router;
