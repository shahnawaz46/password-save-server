const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    isUserVerified: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })

module.exports = mongoose.model("users", userSchema)