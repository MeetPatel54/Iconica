const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const { generateToken} = require('../utils/generateToken');

module.exports.registerUser = async function(req,res){
    try{
        let {email, password, fullname} = req.body;

        let user = await userModel.findOne({email:email});
        if(user) return res.status(401).send("You already have account please login");
       
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
                res.send("user created successfully");
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
    if(!user) return res.send("Email or Password Invalid");

    bcrypt.compare(password, user.password,function(err, result){
        if(result){
        let token = generateToken(user);
        res.cookie("token", token);
        res.redirect("/shop");
        }
        else{
            res.send("Email or Password Invalid");
        }
    })
};
module.exports.logoutUser = async function (req, res) {
    res.clearCookie("token");
    res.redirect("/"); // Redirect to login page after logout
};
