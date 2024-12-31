const Meals = require('../../models/Meals');

module.exports = async (req, res) => {
    try {
        const meal = await Meals.findOneAndDelete({ mealID: req.params.mealID });
    
        if (!meal) {
            return res.status(404).send({ message: "Meal not found" });
        }
        else {
            res.status(200).send({ message: "Meal deleted successfully" });
        }
        
    } catch (error) {
        res.status(500).send(error);
    }
}