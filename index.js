const express = require("express");
const dotenv = require("dotenv");
require('./src/db/Connection')();
const UserCollection = require('./src/models/UserCollection');
const DataCollection = require('./src/models/DataCollection');
const OtpCollection = require('./src/models/OtpCollection');
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const userVerification = require("./src/middleware/UserVerification")
const transporter = require("./src/utils/MailTransporter");

const app = express()

dotenv.config({})

// middlewares
app.use(express.json())
app.use(cookieParser());
app.use(cors({ credentials: true, origin: 'https://manage-password.netlify.app' }))
// app.use(cors({ credentials: true, origin: true }))

// routes
app.post('/api/login', async (req, res) => {
    try {
        const isUserExist = await UserCollection.findOne({ email: req.body.email })

        if (!isUserExist) return res.status(404).json({ err: "No Accout Found Please Signup First" })

        if (!isUserExist.isUserVerified) return res.status(404).json({ err: "No Accout Found Please Signup First" })

        const OTP = Math.ceil(1000 + Math.random() * 786)

        const isOtpExist = await OtpCollection.findOne({ userId: isUserExist._id })
        if (isOtpExist) {
            isOtpExist.otp = OTP
            await isOtpExist.save()

        } else {
            const otp = new OtpCollection({ userId: isUserExist._id, otp: OTP })
            await otp.save()
        }

        res.status(200).json({ message: "OTP has been sent to your email", _id: isUserExist._id })

        transporter.sendMail({
            from: "Password Saver frowebformail@gmail.com",
            to: req.body.email,
            subject: "Verification OTP",
            html: `<b>This is your otp for login to Password Saver App : ${OTP}</b> <br /><br />Only Valid to 10m`,
        });

    } catch (error) {
        // console.log(error)
        return res.status(500).json({ error: error.message, err: "Internal Server Error" })
    }
})

app.post('/api/otp/verfication', async (req, res) => {
    try {
        const isOtpExist = await OtpCollection.findOne({ userId: req.body._id })

        if (!isOtpExist) return res.status(404).json({ err: "Something gone wrong Please Login Again" })

        if (isOtpExist.otp != req.body.otp) return res.status(401).json({ err: "Otp Not Match Please Try Again" })

        const token = await jwt.sign({ _id: isOtpExist.userId }, process.env.SECRETKEY)
        // const expireTime = new Date(Date.now() + (24 * 60 * 60000))
        // console.log(new Date(Date.now()), expireTime);


        // expires : 0, means this cookie will be expired when browser closed, not tab closed.
        res.cookie("p_s_user", token, { httpOnly: true, expires: 0, sameSite: 'none', secure: true })

        const user = await UserCollection.findById(isOtpExist.userId)
        user.isUserVerified = true
        await user.save()

        await OtpCollection.findByIdAndDelete(isOtpExist._id)
        return res.status(200).json({ message: "Login Successfully", name: user.name })

    } catch (error) {
        // console.log(error);
        return res.status(500).json({ error: error.message, err: "Internal Server Error" })
    }
})

app.post('/api/reset/otp', async (req, res) => {
    try {
        const isOtpExist = await OtpCollection.findOne({ userId: req.body.id }).populate("userId")
        if (!isOtpExist) {
            return res.status(404).json({ err: "Please Login/Signup First" })
        }

        const OTP = Math.ceil(1000 + Math.random() * 786)

        isOtpExist.otp = OTP
        await isOtpExist.save()

        res.status(200).json({ message: "OTP has been sent to your email" })

        transporter.sendMail({
            from: "Password Saver frowebformail@gmail.com",
            to: isOtpExist.userId.email,
            subject: "Verification OTP",
            html: `<b>This is your otp for login to Password Saver App : ${OTP}</b> <br /><br />Only Valid to 10m`,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message, err: "Internal Server Error" })
    }
})

app.post('/api/signup', async (req, res) => {
    const { name, email, number } = req.body
    try {
        const isUserExist = await UserCollection.findOne({ email })
        if (isUserExist && isUserExist.isUserVerified) return res.status(401).json({ err: "User Already Exist Please Login" })

        if (isUserExist && !isUserExist.isUserVerified) await UserCollection.findByIdAndDelete(isUserExist._id)

        const newUser = new UserCollection({ name, email, number })
        await newUser.save()

        const OTP = Math.ceil(1000 + Math.random() * 786)

        const otp = new OtpCollection({ userId: newUser._id, otp: OTP })
        await otp.save()

        res.status(200).json({ message: "Otp send Successfully", _id: newUser._id })

        transporter.sendMail({
            from: "Password Saver frowebformail@gmail.com",
            to: req.body.email,
            subject: "Verification OTP",
            html: `<b>This is your otp for Signup to Password Saver App : ${OTP}</b> <br /><br />Only Valid to 10m`,
        });

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

app.get('/api/get/password/:slug', userVerification, async (req, res) => {
    try {
        const {slug} = req.params
        const isdataExist = await DataCollection.findOne({ userId: req.user._id })
        if (!isdataExist) {
            return res.status(404).json({ err: "No Data Available" })
        }

        if (isdataExist) {
            for (let data of isdataExist.websites) {
                if (data.websiteName == slug) {
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

app.delete('/api/delete/website', userVerification, async (req, res) => {
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
