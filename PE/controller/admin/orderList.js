const Order = require("../../models/Order.js");

module.exports = async (req, res) => {
    try {
    const orders = await Order.find()
        .populate('items.meal', 'name price image') // Populate meal details
        .exec();
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
};