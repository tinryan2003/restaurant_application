const Meals = require('../../models/Meals');

module.exports = async (req, res) => {
    const { mealID } = req.params;
    const { available } = req.body;
    try {
      const meal = await Meals.findOneAndUpdate(
        { mealID: mealID },
        { available: available },
        { new: true } // This option returns the updated document
      );
      if (!meal) {
        return res.status(404).json({ message: 'Meal not found' });
      }
      return res.status(200).json(meal);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
}