const Meals = require('../../models/Meals');

module.exports = async (req, res) => {
  try {
    let meal = await Meals.findOne({ mealID: req.body.mealID });
    
    if(meal) {
      meal = await Meals.findOneAndUpdate({ mealID: req.body.mealID }, req.body, { new: true });
      return res.status(200).send({ message: 'Meal updated successfully', meal });
    }

    meal = new Meals(req.body);
    await meal.save();
    res.status(201).send({ message: 'Meal created successfully' });

  } catch (error) {
    console.log(error);
    res.status(400).send(error); 
  }
}