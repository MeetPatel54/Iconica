const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require('../models/product-model');
const userModel = require('../models/user-model');

router.get('/', (req,res) => {
    let error = req.flash('error');
    let success = req.flash('success');
    res.render('index', {error, success, loggedin: false});
});

router.get('/shop', isLoggedIn, async (req,res) => {
    let products = await productModel.find();
    let success = req.flash('success');
    res.render('shop', {products, success});
});

router.get('/cart', isLoggedIn, async (req,res) => {
    let user = await userModel.findOne({email: req.user.email})
    .populate("cart");
    let tex = 20;
    if (!user || !user.cart.length) {
        return res.render('cart', { user, bill: 0 });
    }

    let totalMRP = user.cart.reduce((sum, item) => sum + Number(item.price), 0);
    let totalDiscount = user.cart.reduce((sum, item) => sum + Number(item.discount), 0);

    let platformFee = 20; // Only added once, not per item
    let bill = totalMRP - totalDiscount + platformFee;

    res.render('cart', { user, bill });
});

router.post('/update-cart', isLoggedIn, async (req, res) => {
    const { id, action } = req.body;
    let user = await userModel.findOne({ email: req.user.email }).populate("cart");

    let item = user.cart.find(item => item._id.toString() === id);
    if (!item) return res.json({ success: false });

    // Update Quantity
    if (action === "increase") item.quantity += 1;
    else if (action === "decrease" && item.quantity > 1) item.quantity -= 1;

    await user.save(); // Save updated cart

    // Recalculate Price
    let totalMRP = user.cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    let totalDiscount = user.cart.reduce((sum, item) => sum + Number(item.discount) * item.quantity, 0);
    let bill = totalMRP - totalDiscount + 20; // ₹20 platform fee added once

    res.json({
        success: true,
        quantity: item.quantity,
        price: item.price * item.quantity,
        totalMRP,
        totalDiscount,
        bill
    });
});


router.get('/addtocart/:productid', isLoggedIn, async (req,res) => {
    let user = await userModel.findOne({email : req.user.email});
    user.cart.push(req.params.productid);
    await user.save();
    req.flash('success', 'Added to cart');
    res.redirect('/shop');
});



router.get('/logout', isLoggedIn, (req,res) => {
    res.render('/shop');
});
module.exports = router;