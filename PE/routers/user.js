const express = require("express");
const User = require("../models/User");
const Meals = require("../models/Meals");
const bcrypt = require("bcryptjs");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const { generateVerificationCode, sendEmail } = require("../controller/emailUtils");
const router = express.Router();
const NewUser = require("../models/NewUser");

router.get("/ngon/menu/listNoodles", async (req, res) => {
    const meals = await Meals.find({ type: "Noodles" });
    res.send(meals);
    });
router.get("/ngon/menu/listRice", async (req, res) => {
    const meals = await Meals.find({ type: "Rice" });
    res.send(meals);
    }
);
router.get("/ngon/menu/listDrink", async (req, res) => {
    const meals = await Meals.find({ type: "Drink" });
    res.send(meals);
    }
);

router.get("/ngon/menu/listBanhmi", async (req, res) => {
    const meals = await Meals.find({ type: "Banh Mi" });
    res.send(meals);
    }
);

router.post("/users/register", async (req, res) => {
    // Create a new user
    const { email, password} = req.body;

    const userExists = await User.findOne({ email: email });
    if (userExists) {
        return res.status(400).send("User already exists");
    }

    const verificationCode =  generateVerificationCode();
    const codeExpiration = new Date(new Date().getTime() + 3 * 60000); // 3 minutes from now
    
    const newUser = new NewUser({
        email: email,
        verificationCode: verificationCode,
        codeExpiration: codeExpiration
    });
    await newUser.save();

    await sendEmail(email, verificationCode);
    res.status(200).send({ message : "Verification code sent to your email"});
  });

router.post("/users/verifyOTP", async (req, res) => {
    try {
        const { email, password, verificationCode } = req.body;
        const user = await NewUser.findOne({ email: email });
        if (!user) {
            return res.status(404).send("User not found");
        }
        if (user.codeExpiration < new Date()) {
            return res.status(400).send("Verification code expired");
        }
        if (user.verificationCode !== verificationCode) {
            return res.status(400).send("Invalid verification code");
        }
        const newUser = new User({
            email: email,
            password: password
        });

        await newUser.save();
        await NewUser.findOneAndDelete({ email: email });
        res.status(201).send("User created successfully");
    } catch (error) {
        console.log(error);
        res.status(400 ).send(error);
    }
});

router.post('/users/login', async(req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findByCredentials(email, password)
        if (!user) {
            return res.status(401).send({error: 'Login failed! Check authentication credentials'})
        }
        const token = await user.generateAuthToken()
        res.status(200).send({ user, token })
    } catch (error) {
        res.status(400).send(error)
    }
});

router.post("/users/logout", auth, async (req, res) => {
    // Log user out of the application
    try {
      req.user.tokens = req.user.tokens.filter(token => {
        return token.token != req.token;
      });
      await req.user.save();
      res.send();
    } catch (error) {
    
      res.status(500).send(error);
    }
  });

  router.get("/users/address/:email", auth, async (req, res) => {
    try {
      // Find the user by email
      const user = await User.findOne({ email: req.params.email });
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
      
      // Assuming 'addresses' is the field where the user's addresses are stored
      const addresses = user.address;
  
      // Send only the addresses
      res.send(addresses);
    } catch (error) {
      res.status(500).send({ error: "Internal server error" });
    }
  });

  router.post("/users/newaddress/:email", auth, async (req, res) => {
    try {
      // Find the user by email
      const user = await User.findOne({ email: req.params.email });
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }

      const address = req.body;
      const { addressName, recepient, street1,  city, phone, isDefault} = address[0];
      
      // Add the new address to the user's addresses array
      user.address.push({
        addressName : addressName,
        recepient : recepient,
        street1 : street1,
        city : city,
        phone : phone,
        isDefault : isDefault
      });
    
      // Save the updated user document      
      await user.save();
  
      // Send back the updated list of addresses
      res.send(user.addresses);
    } catch (error) {
      res.status(500).send({ error: "Internal server error" });
    }
  });

  router.delete("/users/deleteaddress/:email/:addressId", auth, async (req, res) => {
    try {
      // Find the user by email and remove the address by _id
      const user = await User.findOneAndUpdate(
        { email: req.params.email },
        { $pull: { address: { _id: req.params.addressId } } },
        { new: true } // Return the updated document
      );
  
      if (!user) {
        return res.status(404).send({ error: "User not found or address not found" });
      }
  
      // Send back the updated list of addresses
      res.send(user.address);
    } catch (error) {
      res.status(500).send({ error: "Internal server error" });
    }
  });

  router.put("/users/updateUser", auth, async (req, res) => {
    try {
        // Extract email from the request body instead of URL parameter
        const { email, name, phone } = req.body; 

        // Validate input
        if (!email || (!name && !phone)) {
            return res.status(400).send({ error: "Please provide an email and at least a name or phone to update." });
        }

        // Find the user by email and update
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).send({ error: "User not found." });
        }

        // Update the user's name and phone if provided
        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save(); // Save the updated user document

        // Send back the updated user information
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error); // Internal server error
    }
});

router.put('/users/updateAddress', auth, async (req, res) => {
  const { email, addressId, address } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Find the address by id
    const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).send({ message: 'Address not found' });
    }

    // Update the address fields
    Object.assign(user.address[addressIndex], address);

    // Save the updated user
    await user.save();

    res.send(user.address);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Server error' });
  }
});
  
  router.post('/users/orders', auth, async (req, res) => {
    try {
      const newOrder = new Order(req.body);
      if (newOrder.bill.coupon.discountPrice > 0) {
        const coupon = await Coupon.findOne({ code: newOrder.bill.coupon.code });
        
        await coupon.useCoupon(newOrder.email);
      } 

      await newOrder.save();
      res.status(201).send(newOrder);
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }
  });

  router.get('/users/orderDelivery/:email', auth, async (req, res) => {
    try {
      const userEmail = req.params.email;
      const orders = await Order.find({
        email: userEmail,
        status: { $nin: ['Delivered', 'Cancelled'] }
      }) .populate('items.meal');
      if (orders.length<1) {
        return res.status(404).json({ message: 'No orders found for the specified criteria.' });
      }
  
      res.send(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  router.get('/users/orderDone/:email', auth, async (req, res) => {
    try {
      const userEmail = req.params.email;
      const orders = await Order.find({
        email: userEmail,
        status: { $in: ['Delivered', 'Cancelled'] }
      }).populate('items.meal');;
  
      if (!orders.length) {
        return res.status(404).json({ message: 'No orders found for the specified criteria.' });
      }
  
      res.send(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.get('/users/checkToken', auth, (req, res) => {
    res.send({ valid : true});
  });

  router.put('/users/changePassword', auth, async (req, res) => {
    try {
      const { currentPassword, newPassword, email } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).send('Both current and new passwords are required');
      }
  
      // Find the user by ID
      const user = await User.findOne({ email: email });      if (!user) {
        return res.status(404).send('Admin not found');
      }
  
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).send('Current password is incorrect');
      }
  
      // Hash new password
      user.password = newPassword;
      await user.save(); 
  
      res.status(200).send('Password changed successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while changing the password');
    }
  });
  
  
router.post('/users/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

  // Check if email is provided
  if (!email) {
    return res.status(400).send({error: 'Email is required'});
  }

  // Attempt to find the user by email
  const user = await User.findOne({ email });

  // Check if user exists
  if (!user) {
    // Consider using a generic message to avoid email enumeration attacks
    return res.status(404).send({error: 'If an account with that email exists, a reset email has been sent.'});
  }

  // Generate a verification code
  const verificationCode = generateVerificationCode();
  const codeExpiration = new Date(new Date().getTime() + 3*60000); // Code expires in 30 minutes

  // Update user with verification code and expiration
  user.passwordResetVerificationCode = verificationCode;
  user.passwordResetCodeExpiration = codeExpiration;
  
  // Save the updated user
  await user.save();

  // Send the verification code via email
  await sendEmail(email, verificationCode);

  // Respond to the client
  res.status(200).send({ message: 'Send code successed!!' });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing the request');
  }
});


router.post('/users/check-verification-code', async (req, res) => {
  const { email, code } = req.body;
  
  // Validate the provided information
  if (!email || !code) {
    return res.status(400).send({ error: 'Email and verification code are required' });
  }

  // Attempt to find the user by email and verification code
  const user = await User.findOne({
    email,
    passwordResetVerificationCode: code,
    passwordResetCodeExpiration: { $gt: new Date() } // Checks if the code is not expired
  });

  // Check if user exists and the verification code is valid
  if (user) {
    user.passwordResetVerificationCode = undefined;
    user.passwordResetCodeExpiration = undefined;
    res.status(200).send({ valid: true });
  } else {
    res.status(200).send({ valid: false });
  }
});


router.post('/users/reset-password', async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  // Validate the provided information
  if (!email || !verificationCode || !newPassword) {
    return res.status(400).send({error: 'Email, verification code, and new password are required'});
  }

  // Attempt to find the user by email and verification code
  const user = await User.findOne({
    email,
    passwordResetVerificationCode: verificationCode,
    passwordResetCodeExpiration: { $gt: new Date() } // Checks if the code is not expired
  });

  // Check if user exists and the verification code is valid
  if (!user) {
    return res.status(400).send({error: 'Invalid or expired verification code'});
  }

  // Update the user's password
  user.password = newPassword; 

  // Clear the verification code and its expiration
  user.passwordResetVerificationCode = null;
  user.passwordResetCodeExpiration = null;

  // Save the updated user
  await user.save();

  // Respond to the client
  res.status(200).send({ message: 'Password has been reset successfully' });
});

router.post('/users/useCoupon', auth, async (req, res) => {
  const { code, email } = req.body;

  // Validate the input
  if (!code || !email) {
    return res.status(400).json({ message: 'Coupon code and email are required.' });
  }

  try {
    // Find the coupon by code
    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).send({ message: 'Coupon not found.' });
    }

    // Use the coupon with the provided email
    // await coupon.useCoupon(email);
    if (!coupon.isValid(email)) {
      res.send({ message: 'Coupon is invalid or has been used.', discountPrice: 0})    ;
    } else{
      res.send({ message: 'Coupon used successfully.', discountPrice: coupon.discountPrice});}

  } catch (error) {
    if (error.message === 'Coupon is invalid or has been used the maximum number of times.') {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: 'Internal server error.' });
    }
  }
});

//api to get totalSpend of user
router.get('/users/totalSpend/:email', auth, async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send({ totalSpending: user.totalSpending });
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
});

//api to set update status of order => Cancelled
router.put('/users/cancelOrder/:orderId', auth, async (req, res) => {
  try {
    const orderId = req.params.orderId;
   
    // First, find the order to check its current status
    const order = await Order.findById(orderId);

    // If the order doesn't exist
    if (!order) {
      return res.status(404).send({ error: "Order not found" });
    }

    // Check if the order status is not 'Pending'
    if (order.status !== 'Pending') {
      return res.status(400).send({ error: "Order cannot be cancelled unless it is in 'Pending' status" });
    }

    // If the order is in 'Pending' status, proceed to update it to 'Cancelled'
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      { status: 'Cancelled' },
      { new: true }
    );

    res.send(updatedOrder);
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
});

module.exports = router;