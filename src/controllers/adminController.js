const User = require('../models/User');
const Product = require('../models/Product');

class AdminController {
  static async getDashboard(req, res) {
    try {
      const users = await User.getAll();
      const products = await Product.getAll();
      
      const stats = {
        totalUsers: users.length,
        totalProducts: products.length,
        totalAdmins: users.filter(user => user.role === 'admin').length,
        totalRegularUsers: users.filter(user => user.role === 'user').length
      };
      
      res.json({
        stats,
        recentUsers: users.slice(0, 5),
        recentProducts: products.slice(0, 5)
      });
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const users = await User.getAll();
      res.json({ users });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = AdminController;
