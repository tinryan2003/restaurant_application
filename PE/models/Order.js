const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
 email: {
    type: String,
    required: true
  },
  items: [
    {
      meal: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Meals', 
        required: true
      },
      name: {
        type: String,
        required: true
      },
      chefNote: {
        type: String,
      },
      quantity: {
        type: Number,
        required: true
      },
      itemPrice: {
        type: Number,
        required: true
      }
    }
  ],
  bill: {
    subTotal: {
      type: Number,
      required: true
    },
    coupon: 
      {
        code: {
          type: String,
          default: null
        },
        discountPrice: {
          type: Number,
          default: 0
        }
      }
    ,
    //new 
    memberShip: {
      type: Number,
      default: 0
    },
    deliveryCharge: {
      type: Number,
      required: true
    },
    grandTotal: {
      type: Number,
      required: true
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['E-wallet', 'cashOnDelivery'], // Example payment methods
      required: true
    },
  },
  recepient: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Delivering', 'Delivered', 'Cancelled'], // Enum to restrict values
    default: 'Pending'
  },
}, { timestamps: true});
  // Model creation
  const Order = mongoose.model("Order", orderSchema);
  
  // Module exports
  module.exports = Order;