const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    otp: {
        type: String,
        required: true,
        default: null,
        trim: true
    },
    createdAt: {
        type: Date,
        expires: 600,
        default: Date.now
    }

}, { timestamps: true })

module.exports = mongoose.model("otp", otpSchema)