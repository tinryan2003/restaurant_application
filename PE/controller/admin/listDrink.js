const Meals = require("../../models/Meals");

module.exports = async (req, res) => {
    try {
      const noodles = await Meals.find({ type: 'Drink' });
      res.send(noodles);
    } catch (error) {
      res.status(500).send(error);
    }
};