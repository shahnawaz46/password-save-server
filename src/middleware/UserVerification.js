const jwt = require("jsonwebtoken");

const userVerification = async (req, res, next) => {
    try {
        const token = req.cookies['p_s_user']
        const isTokenVerify = await jwt.verify(token, process.env.SECRETKEY)
        req.user = isTokenVerify

        next()

    } catch (error) {
        // console.log(error)
        return res.status(401).json({ err: "Unauthorized User" })
    }
}

module.exports = userVerification;