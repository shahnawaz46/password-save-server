const mongoose = require("mongoose")
const dotenv = require("dotenv")

dotenv.config({})

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@passwordsaver.pgxhv.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`

const connection = async () => {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
        console.log('Database Connected');

    } catch (err) {
        console.log(err);
    }
}

module.exports = connection