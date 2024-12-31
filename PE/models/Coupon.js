const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  discountPrice: {
    type: Number,
    required: true,
    min: 0
  },
  expirationDate: {
    type: Date,
    required: true
  },
  usedEmails: {
    type: [String], // array of email addresses
    default: []
  }
}, {
    timestamps: true
});

// Create a method to check if the coupon is valid
couponSchema.methods.isValid = function(email) {
  const isNotExpired = new Date() < this.expirationDate;
  const emailHasNotUsed = !this.usedEmails.includes(email);

  return isNotExpired && emailHasNotUsed;
};

// Create a method to use the coupon
couponSchema.methods.useCoupon = function(email) {
  if (this.isValid(email)) {
    this.usedEmails.push(email);
    return this.save();
  } else {
    throw new Error('Coupon is invalid or has been used the maximum number of times.');
  }
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
