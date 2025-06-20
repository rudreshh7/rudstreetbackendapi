const pool = require('../config/database');

class Product {
  static async create(productData) {
    const { name, description, price, category, stock_quantity, created_by, images } = productData;
    
    const result = await pool.query(
      'INSERT INTO products (name, description, price, category, stock_quantity, created_by, images) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, price, category, stock_quantity, created_by, JSON.stringify(images || [])]
    );
    
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = 'SELECT p.*, u.username as created_by_name FROM products p LEFT JOIN users u ON p.created_by = u.id';
    let params = [];
    let conditions = [];

    if (filters.category) {
      conditions.push(`p.category = $${params.length + 1}`);
      params.push(filters.category);
    }

    if (filters.search) {
      conditions.push(`(p.name ILIKE $${params.length + 1} OR p.description ILIKE $${params.length + 1})`);
      params.push(`%${filters.search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    
    // Safely parse images JSON for each product
    return result.rows.map(product => ({
      ...product,
      images: this.parseImages(product.images)
    }));
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    const product = result.rows[0];
    
    if (product) {
      product.images = this.parseImages(product.images);
    }
    
    return product;
  }

  static async update(id, productData) {
    const { name, description, price, category, stock_quantity, images } = productData;
    
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, category = $4, stock_quantity = $5, images = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, description, price, category, stock_quantity, JSON.stringify(images || []), id]
    );
    
    const product = result.rows[0];
    if (product) {
      product.images = this.parseImages(product.images);
    }
    
    return product;
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    const product = result.rows[0];
    
    if (product) {
      product.images = this.parseImages(product.images);
    }
    
    return product;
  }

  static async getCategories() {
    const result = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
    return result.rows.map(row => row.category);
  }

  // Helper method to safely parse images
  static parseImages(images) {
    // If images is null or undefined, return empty array
    if (!images) {
      return [];
    }
    
    // If images is already an array (object), return as is
    if (Array.isArray(images)) {
      return images;
    }
    
    // If images is a string, try to parse it
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error('Error parsing images JSON:', error);
        return [];
      }
    }
    
    // If images is some other type, return empty array
    return [];
  }
}

module.exports = Product;