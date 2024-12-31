const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Timestamp } = require("mongodb");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please enter your email"],
    trim: true,
    unique: true,
    validate: {
      validator: value => validator.isEmail(value),
      message: "Invalid Email address"
    }
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: 8,
  },
  name: {
    type: String,
    required: [true, "Please enter your name"],
    trim: true,
    default: "User"
  },
  phone: {
    type: String,
    default: "..."
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ],
  address: [
    {
      addressName: {
        type: String,
        default: "..."
      },
      phone: {
        type: String,
        default: "..."
      },
      recepient: {
        type: String,
        default: "..."
      },
      street1: {
        type: String,
        require: [true, "Please enter your address"],
        default: "..."
      },
      city: {
        type: String,
        require: [true, "Please enter your city"],
        default: "..."
      },
      isDefault: {
        type: Boolean,
        default: false
      }
    },

  ], 
  totalSpending : { type: Number, default: 0 },
  passwordResetVerificationCode : { type: String, default: undefined },
  passwordResetCodeExpiration : { type: Date, default: undefined },
}, {  timestamps : true }
);


userSchema.pre("save", async function(next) {
  // Hash the password before saving the user model
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  const newDefaultAddress = user.address.find(addr => addr.isModified('isDefault') && addr.isDefault);

  if (newDefaultAddress) {
    // Set all addresses to non-default
    user.address.forEach(addr => {
      addr.isDefault = false;
    });

    // Mark the new address as default
    newDefaultAddress.isDefault = true;
  }

  next();
});

userSchema.methods.generateAuthToken = async function() {
  // Generate an auth token for the user
  const user = this;
  const token = jwt.sign({ _id: user._id }, process.env.JWT_KEY,{ expiresIn: '12h' });

  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  // Search for a user by email and password.
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error({ error: "Invalid login credentials" });
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error({ error: "Invalid login credentials" });
  }
  return user;
};


const User = mongoose.model("User", userSchema);

module.exports = User;