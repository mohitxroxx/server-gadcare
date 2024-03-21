const jwt = require("jsonwebtoken")

const config = process.env

const verifyToken = (req, res, next) => {
    const token = req.body.token || req.query.token|| req.headers["authorization"] || req.cookies.jwt
    // console.log(token)
    if (!token) {

        return res.status(403).send("Session Expired Login again to continue")
    }
    try {
        const decoded = jwt.verify(token, config.TOKEN_KEY)
        req.user = decoded
    } catch (err) {
        return res.status(401).send("Error occured login again")
    }    
    return next()

}

module.exports = verifyToken