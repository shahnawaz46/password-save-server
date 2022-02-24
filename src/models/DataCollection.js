const mongoose = require("mongoose");


const dataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true
    },
    websites: [
        {
            websiteName: {
                type: String,
                required: true,
                trim: true
            },
            userName: {
                type: String,
                require: true
            },
            password: {
                type: String,
                required: true
            }
        }
    ]
}, { timestamps: true })

module.exports = mongoose.model("detail", dataSchema)