const jwt = require('jsonwebtoken');
const userModel = require('../models/user-model');
const ownerModel = require('../models/owner-model');
const bcrypt = require('bcrypt');

module.exports = async function (req, res, next) {
    if(!req.cookies.token){
        req.flash('error','You need to login first');
        return res.redirect('/');
    }
    try{
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
        // Find user in the database
        let user = await ownerModel.findOne({ email: decoded.email }).select("-password");;
        if (!user) {
            req.flash("error", "You Don't Have an Access");
            return res.redirect('/shop');
        }
        req.user = user;
        next();
    }
    catch(err){
        req.flash("error", "something went wrong")
        res.redirect('/');
    }
};