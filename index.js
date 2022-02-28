const express = require("express");
const dotenv = require("dotenv");
require('./src/db/Connection')();
const UserCollection = require('./src/models/UserCollection');
const DataCollection = require('./src/models/DataCollection');
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const userVerification = require("./src/middleware/UserVerification")

const app = express()

dotenv.config({})

// middlewares
app.use(express.json())
app.use(cookieParser());
app.use(cors({ credentials: true, origin: 'https://shahnawaz12.netlify.app' }))

// routes
app.post('/api/login', async (req, res) => {
    try {
        const isUserExist = await UserCollection.findOne({ email: req.body.email })
        if (!isUserExist) {
            return res.status(404).json({ err: "No Accout Found Please Signup First" })
        }

        const isPassMatch = await bcrypt.compare(req.body.password, isUserExist.password)
        if (!isPassMatch) {
            return res.status(401).json({ err: "Email and Password Not Match" })
        }

        const token = await jwt.sign({ _id: isUserExist._id }, process.env.SECRETKEY)
        // const expireTime = new Date(Date.now() + (24 * 60 * 60000))
        // console.log(new Date(Date.now()), expireTime);


        // expires : 0, means this cookie will be expired when browser closed not tab closed.
        res.cookie("p_s_user", token, { httpOnly: true, expires: 0, sameSite: 'none', secure: true })

        return res.status(200).json({ message: "Login Successfully" })

    } catch (error) {
        // console.log(error)
        return res.status(500).json({ error: error.message, err: "Internal Server Error" })
    }
})

app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body
        const isUserExist = await UserCollection.findOne({ email })
        if (isUserExist) {
            return res.status(401).json({ err: "User Already Exist Please Login" })
        }
        const newUser = new UserCollection({ email, password })

        const token = await jwt.sign({ _id: newUser._id }, process.env.SECRETKEY)
        // const expireTime = new Date(Date.now() + (24 * 60 * 60000))
        // console.log(new Date(Date.now()), expireTime);

        res.cookie("p_s_user", token, { httpOnly: true, expires: 0, sameSite: 'none', secure: true })

        await newUser.save()
        return res.status(200).json({ message: "Signup Successfully" })

    } catch (error) {
        // console.log(error);
        return res.status(500).json({ error: error.message, err: "Internal Server Error" })
    }
})

app.post('/api/save/password', userVerification, async (req, res) => {
    try {
        let { websiteName, userName, password } = req.body;

        const isdataExist = await DataCollection.findOne({ userId: req.user._id })
        if (isdataExist) {

            for (let data of isdataExist.websites) {
                if (data.websiteName == req.body.websiteName) {
                    return res.status(400).json({ err: "Data of This Website is Already Added" })
                }
            }

            // console.log(hashUserName, hashPassword);
            await DataCollection.findOneAndUpdate({ userId: req.user._id }, {
                '$push': {
                    "websites": { websiteName, userName, password }
                }
            })

            return res.status(200).json({ message: "Password Save Successfully" })

        } else {
            const newData = new DataCollection({ userId: req.user._id, websites: { websiteName, userName, password } })
            await newData.save()

            return res.status(200).json({ message: "Password Save Successfully" })
        }

    } catch (error) {
        // console.log(error);
        return res.status(500).json({ error: error.message, err: "Internal Server Error" })
    }
})

app.post('/api/get/password', userVerification, async (req, res) => {
    try {
        const isdataExist = await DataCollection.findOne({ userId: req.user._id })
        if (!isdataExist) {
            return res.status(404).json({ err: "No Data Available" })
        }

        if (isdataExist) {
            for (let data of isdataExist.websites) {
                if (data.websiteName == req.body.webName) {
                    return res.status(200).json({ userName: data.userName, websiteName: data.websiteName, password: data.password })
                }
            }
        }

        return res.status(404).json({ err: "No Data Available" })

    } catch (error) {
        // console.log(error);
        return res.status(500).json({ error: error.message, err: "Internal Server Error" })
    }
})

app.post('/api/delete/website', userVerification, async (req, res) => {
    try {
        const isUserExist = await DataCollection.findOne({ userId: req.user._id })
        if (!isUserExist) {
            return res.status(404).json({ err: "No Data Available" })
        }

        for (let data of isUserExist.websites) {
            if (data.websiteName === req.body.webName) {

                await DataCollection.findOneAndUpdate({ userId: req.user._id }, {
                    $pull: {
                        websites: { websiteName: req.body.webName }
                    }
                })

                return res.status(200).json({ message: "Information Deleted Successfully" })
            }
        }

        return res.status(404).json({ err: "No Data Available" })

    } catch (error) {
        return res.status(500).json({ error: error.message, err: "Internal Server Error" })
    }
})

const port = process.env.PORT || 9000

app.listen(port, () => {
    console.log(`Server is Running At Port No ${port}`);
})