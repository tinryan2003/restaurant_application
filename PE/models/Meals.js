const mongoose = require("mongoose");

const MealsSchema= mongoose.Schema({ 
    mealID: {
        type: String,
        required : true,
        unique: true,
        sparse: true
    },
    name : {
        type : String,
        required : true,        
    },
    price : {
        type : Number,
        required : true,  
    },
    description : {
        type : String,
        required : true,
    },
    type : {
        type : String,
        required : true,
    },
    available : {
        type : Boolean,
        required : true,
        default : true,
    },
    image : {
        type : String,
        required: true,
    },
    rating : {
        type : String,
        required : true,
    },
    delivery : {
        type : String,
        required : true,
    },
    ordered : {
        type : Number,
        required : true,
        default : 0,
    }
}, {timestamps: true})

const Meals = mongoose.model("Meals", MealsSchema);
module.exports = Meals;