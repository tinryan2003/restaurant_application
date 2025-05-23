const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: value => {
      if (!validator.isEmail(value)) {
        throw new Error({ error: "Invalid Email address" });
      }
    }
  },
  password: {
    type: String,
    required: true,
    minLength: 8
  },
  
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ],
  verificationCode: { type: String, default: undefined},
  codeExpiration: { type: Date, default: undefined},
  passwordResetVerificationCode: { type: String, default: undefined},
  passwordResetCodeExpiration: { type: Date, default: undefined},
});

adminSchema.pre("save", async function(next) {
  // Hash the password before saving the user model
  const admin = this;
  if (admin.isModified("password")) {
    admin.password = await bcrypt.hash(admin.password, 8);
  }
  next();
});

adminSchema.methods.generateAuthToken = async function() {
  // Generate an auth token for the admin
  const admin = this;
  const token = jwt.sign({ _id: admin._id }, process.env.JWT_KEY,{ expiresIn: '12h' });
  admin.tokens = admin.tokens.concat({ token });
  await admin.save();
  return token;
};

adminSchema.statics.findByCredentials = async (email, password) => {
  // Search for an admin by email.
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return { success: false, message: "Invalid admin credentials" };
  }
  // Check if the provided password matches the admin's password.
  const isPasswordMatch = await bcrypt.compare(password, admin.password);
  if (!isPasswordMatch) {
    return { success: false, message: "Invalid pass credentials" };
  }
  
  // If both checks pass, return the admin object with a success flag.
  return { success: true, admin };
};

const Admin = mongoose.model("Admin",adminSchema);

module.exports = Admin;