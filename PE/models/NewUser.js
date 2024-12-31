const { verify } = require('jsonwebtoken');
const mongoose = require('mongoose');

const newUserSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please enter your email"],
        trim: true,
    },
    verificationCode: {
        type: String,
    },
    codeExpiration: {
        type: Date,
    },
});

newUserSchema.pre('save', async function(next) {
    const user = this;
    // Check if a document with the same email exists
    const existingUser = await this.constructor.findOne({ email: user.email });
    if (existingUser) {
        // If an existing document is found, delete it
        await this.constructor.deleteOne({ _id: existingUser._id });
    }
    next();
});

const NewUser = mongoose.model('NewUser', newUserSchema);

module.exports = NewUser;