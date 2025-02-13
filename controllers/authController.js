const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const { generateToken} = require('../utils/generateToken');
const { response } = require('express');

module.exports.registerUser = async function(req,res){
    try{
        let {email, password, fullname} = req.body;

        let user = await userModel.findOne({email:email});
        if(user) {
            req.flash("error", "You already have an account! please Login");
            return res.redirect("/");
        }
       
        bcrypt.genSalt(10, function(err,salt){
            bcrypt.hash(password, salt, async function(err, hash){
                if(err) throw err;
                password = hash;
                let user = await userModel.create({
                    email,
                    password,
                    fullname
                });
                let token = generateToken(user);
                res.cookie("token", token);
                res.redirect("/shop");
            });
        } )
        
        
    }
    catch(err){
        res.send(err.message);
    }
};

module.exports.loginUser = async function(req,res){
    let {email,password} = req.body;
    
    let user = await userModel.findOne({email:email});
    if(!user){
        req.flash("error", "Email or Password Invalid");
        return res.redirect("/");
    }

    bcrypt.compare(password, user.password,function(err, result){
        if(result){
        let token = generateToken(user);
        res.cookie("token", token);
        res.redirect("/shop");
        }
        else{
            req.flash("error", "Email or Password Invalid");
        return res.redirect("/");
        }
    })
};
module.exports.logoutUser = async function (req, res) {
    res.clearCookie("token");
    res.redirect("/"); // Redirect to login page after logout
};
