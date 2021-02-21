const User = require("../models/User")

const isAuthenticated = async(req, res, next) => {

    try {
        if (req.fields.userToken) {

            const userToken = req.fields.userToken;
            const user = await User.findOne({ token: userToken});
            
        if (user) {

            // Add a user key to the req object
            req.user = user;

            // Pass the middleware to execute next task
            return next();
        } else {
            return res.status(401).json({ message: "Unauthorized"});
        }
     } else {
            return res.status(401).json({ message: "Unauthorized"})
        }
        
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

module.exports = isAuthenticated;