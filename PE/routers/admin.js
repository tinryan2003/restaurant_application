const express = require("express");
const User = require("../models/User");
const Meals = require("../models/Meals");
const Admin = require("../models/Admin");
const Coupon = require("../models/Coupon");
const path = require("path");
const router = express.Router();
const { generateVerificationCode, sendEmail } = require('../controller/emailUtils')
const bcrypt = require('bcryptjs');
const addMeal = require('../controller/admin/addMeal');
const deleteMeal = require('../controller/admin/deleteMeal');
const adminLogin = require("../controller/admin/adminLogin");
const newAdmin = require("../controller/admin/newAdmin");
const authAdmin = require("../middleware/authAdmin");
const Order = require("../models/Order"); 
// New API
const listNoodles = require("../controller/admin/listNoodles");
const listRice = require("../controller/admin/listRice");
const listBanhMi = require("../controller/admin/listBanhMi");
const listDrink = require("../controller/admin/listDrink");
const orderList = require("../controller/admin/orderList");
const available = require("../controller/admin/available");

router.use('/assets/images', express.static(path.join(__dirname, '../assets/images')));

router.post("/ngon/updatefoods",authAdmin, addMeal);  

router.get("/ngon/noodles", listNoodles);

router.get("/ngon/Rice", listRice);

router.get("/ngon/BanhMi", listBanhMi);

router.get("/ngon/Drink", listDrink);

router.put("/ngon/availabe/:mealID", authAdmin, available); 

router.delete("/ngon/deleteItem/:mealID",authAdmin, deleteMeal); 

router.get("/OrderList", orderList); 

router.get('/checkAuth', authAdmin, (req, res) => {
  res.status(200).send({ isAuthenticated: true });
});

router.post("/admin/logout", authAdmin, async (req, res) => {
  // Log user out of the application
  try {
    req.admin.tokens = req.admin.tokens.filter(token => {
      return token.token != req.token;
    });
    await req.admin.save();
    res.send();
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/users', authAdmin, async (req, res) => {
  const users = await User.find().select('-password');
  res.send(users);
}); 

router.put('/OrderList/updateStatus/:orderId', authAdmin, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  try {
    const order = await Order.findOne({ orderId: orderId }).populate('items.meal');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;

    if (status === 'Delivered') {
      for (let item of order.items) {
        if (item.meal) {
          item.meal.ordered += item.quantity;
          await item.meal.save();
        }
      }
      
      // Update customer's total spending
      const user = await User.findOne({ email: order.email });
      if (user) {
        user.totalSpending += order.bill.grandTotal;
        await user.save();
      }
    }

    await order.save();

    res.json({ message: 'Order status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard/Total', authAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ status: "Delivered" });
    const totalSold = await Meals.aggregate([
      { $group: { _id: null, total: { $sum: "$ordered" } } }
    ]);
    const totalRevenue = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$bill.grandTotal" } } }
    ]);
    const totalCustomers = await User.countDocuments();
    const total = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    res.json({ totalOrders, totalSold: totalSold[0].total, totalRevenue: totalRevenue[0].total, totalCustomers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}); 

router.get("/dashboard/totalOrder", authAdmin, async (req, res) => {
  try {
      const result = await Meals.aggregate([
          {
              $match: {
                  type: { $in: ["Noodles", "Drink", "Banh Mi", "Rice"] }
              }
          },
          {
              $group: {
                  _id: "$type",
                  totalOrdered: { $sum: "$ordered" }
              }
          }
      ]);

      res.status(200).send(result);
  } catch (err) {
      res.status(500).send({ message: err.message });
  }
}); 
router.get("/dashboard/topOrdered", authAdmin, async (req, res) => {
  try {
      const result = await Meals.find()
          .sort({ ordered: -1 })
          .limit(10);

      res.status(200).send(result);
  } catch (err) {
      res.status(500).send({ message: err.message });
  }
}); 

router.post("/admin/newAdmin", newAdmin);

router.post('/login/initiate', async (req, res) => {
  const { email, password } = req.body;

  // First, check if email and password are provided to avoid unnecessary database query.
  if (!email || !password) {
    return res.status(400).send({error: 'Missing email or password'});
  }

  // Attempt to find the admin by credentials.
  const result = await Admin.findByCredentials(email, password);

  // Check if findByCredentials was successful.
  if (!result.success) {
    return res.status(401).send({error: 'Login failed! Check authentication credentials'});
  }

  // Extract the admin object from the result.
  const admin = result.admin;

  const verificationCode = generateVerificationCode();
  const codeExpiration = new Date(new Date().getTime() + 30*60000); // Code expires in 30 minutes

  // Since admin is now correctly extracted from the result, it should be a model instance with a save method.
  admin.verificationCode = verificationCode;
  admin.codeExpiration = codeExpiration;

  await admin.save();

  await sendEmail(email, verificationCode);
  res.status(200).send({ message: 'Verification code sent' });
});
// Endpoint to verify code and return token
router.post('/login/verify', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
      return res.status(400).send({ error: 'Email and code are required' });
  }

  const admin = await Admin.findOne({ email });
  if (!admin || !admin.verificationCode || admin.codeExpiration < new Date()) {
      return res.status(401).send({ error: 'Invalid or expired code' });
  }

  if (admin.verificationCode === code) {
      const token = await admin.generateAuthToken(); // Ensure this method is implemented as shown in previous examples
      // Optionally clear the verificationCode and codeExpiration here
      admin.verificationCode = undefined;
      admin.codeExpiration = undefined;
      await admin.save();

      res.status(200).send({ token });
  } else {
      res.status(401).send({ error: 'Invalid or expired code' });
  }
});
  
router.put('/admin/change-password', authAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword, email } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).send('Both current and new passwords are required');
    }

    // Find the admin by ID
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      return res.status(404).send('Admin not found');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).send('Current password is incorrect');
    }

    // Hash new password
    admin.password = newPassword;
    await admin.save(); 

    res.status(200).send('Password changed successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while changing the password');
  }
});

router.post('/admin/forgot-password', async (req, res) => {
  const { email } = req.body;

  // Check if email is provided
  if (!email) {
    return res.status(400).send({error: 'Email is required'});
  }

  // Attempt to find the admin by email
  const admin = await Admin.findOne({ email });

  // Check if admin exists
  if (!admin) {
    // Consider using a generic message to avoid email enumeration attacks
    return res.status(404).send({error: 'If an account with that email exists, a reset email has been sent.'});
  }

  // Generate a verification code
  const verificationCode = generateVerificationCode();
  const codeExpiration = new Date(new Date().getTime() + 3*60000); // Code expires in 30 minutes

  // Update admin with verification code and expiration
  admin.passwordResetVerificationCode = verificationCode;
  admin.passwordResetCodeExpiration = codeExpiration;
  
  // Save the updated admin
  await admin.save();

  // Send the verification code via email
  await sendEmail(email, verificationCode);

  // Respond to the client
  res.status(200).send({ message: ' a reset code has been sent.' });
});

router.post('/admin/reset-password', async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  // Validate the provided information
  if (!email || !verificationCode || !newPassword) {
    return res.status(400).send({error: 'Email, verification code, and new password are required'});
  }

  // Attempt to find the admin by email and verification code
  const admin = await Admin.findOne({
    email,
    passwordResetVerificationCode: verificationCode,
    passwordResetCodeExpiration: { $gt: new Date() } // Checks if the code is not expired
  });

  // Check if admin exists and the verification code is valid
  if (!admin) {
    return res.status(400).send({error: 'Invalid or expired verification code'});
  }

  // Update the admin's password
  admin.password = newPassword; 

  // Clear the verification code and its expiration
  admin.passwordResetVerificationCode = null;
  admin.passwordResetCodeExpiration = null;

  // Save the updated admin
  await admin.save();

  // Respond to the client
  res.status(200).send({ message: 'Password has been reset successfully' });
});

router.post('/admin/check-verification-code', async (req, res) => {
  const { email, code } = req.body;
  
  // Validate the provided information
  if (!email || !code) {
    return res.status(400).send({ error: 'Email and verification code are required' });
  }

  // Attempt to find the admin by email and verification code
  const admin = await Admin.findOne({
    email,
    passwordResetVerificationCode: code,
    passwordResetCodeExpiration: { $gt: new Date() } // Checks if the code is not expired
  });

  // Check if admin exists and the verification code is valid
  if (admin) {
    admin.passwordResetVerificationCode = undefined;
    admin.passwordResetCodeExpiration = undefined;
    res.status(200).send({ valid: true });
  } else {
    res.status(200).send({ valid: false });
  }
});

router.post('/admin/new-coupon', authAdmin, async (req, res) => {
  const { code, discountPrice, expirationDate } = req.body;
  console.log(req.body);
  // Validate the input
  if (!code || discountPrice == null || !expirationDate) {
    return res.status(400).send({ message: 'All fields are required.' });
  }

  try {
    // Create a new coupon
    const newCoupon = new Coupon({
      code,
      discountPrice,
      expirationDate
    });

    // Save the coupon to the database
    const savedCoupon = await newCoupon.save();
    res.status(201).send(savedCoupon);
  } catch (error) {
    // Handle duplicate code error
    if (error.code === 11000) {
      res.status(409).send({ message: 'Coupon code already exists.' });
    } else {
      res.status(500).send({ message: 'Internal server error.' });
    }
  }
});

router.get('/admin/coupons-list', authAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.send(coupons);
  } catch (error) {
    res.status(500).send({ message: 'Internal server error.' });
  }
});

router.delete('/admin/delete-coupons/:id', authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) {
      return res.status(404).send({ message: 'Coupon not found.' });
    }
    res.status(200).send({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error.' });
  }
});

module.exports = router;

