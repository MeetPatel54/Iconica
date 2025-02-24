const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const Address = require('../models/address-model');

const e = require("connect-flash");

router.get("/", (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");
  res.render("index", { error, success, loggedin: false });
});

router.get("/shop", isLoggedIn, async (req, res) => {
  try {
    let { category, sortby } = req.query;
    let filterQuery = {};

    // Filtering Logic
    if (category === 'new') {
        filterQuery = { isNewCollection: true };
    } else if (category === 'discounted') {
        filterQuery = { discount: { $gt: 0 } };
    } // 'all' means no filter (default)

    let sortOptions = {};  // MongoDB sorting object
    if (sortby === 'popular') {
        sortOptions = { popularity: -1 }; // Higher popularity first
    } else if (sortby === 'newest') {
        sortOptions = { createdAt: -1 }; // Newest first
    } else if (sortby === 'price-low-high') {
        sortOptions = { price: 1 }; // Price: Low to High
    } else if (sortby === 'price-high-low') {
        sortOptions = { price: -1 }; // Price: High to Low
    }

    // Fetch products with filtering + sorting applied in MongoDB query
    let products = await productModel.find(filterQuery).sort(sortOptions);

    let success = req.flash("success");
    let error = req.flash("error");

    res.render("shop", { success, error, sortby, category, products });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


router.get("/cart", isLoggedIn, async (req, res) => {
  // Get flash message for success
  let success = req.flash("success");

  // Initialize cart in session if not already initialized
  if (!req.session.cart) {
    req.session.cart = [];
  }

  // Retrieve user data from session
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("cart"); // You can access user from session if logged in

  if (req.session.cart.length === 0) {
    return res.render("cart", { user, bill: 0, success, session: req.session });
  }

  // Calculate the total MRP, total discount, and total bill based on session cart
  let totalMRP = req.session.cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  let totalDiscount = req.session.cart.reduce(
    (sum, item) => sum + Number(item.discount) * item.quantity,
    0
  );

  // Add a platform fee (flat rate)
  let platformFee = 20; // Fixed fee
  let bill = totalMRP - totalDiscount + platformFee;
  console.log(bill);
  // Render the cart page with the data
  res.render("cart", { user, bill, success, session: req.session });
});

router.get("/addtocart/:productid", isLoggedIn, async (req, res) => {
  // Retrieve the product ID from the URL parameters
  let productId = req.params.productid;

  // Initialize the session cart if it doesn't exist
  if (!req.session.cart) {
    req.session.cart = [];
  }

  // Check if the item already exists in the session cart
  let existingItem = req.session.cart.find((item) => item._id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
    req.flash("success", "Item already in cart");
    return res.redirect("/shop");
  } else {
    try {
      // Fetch the product details from the database
      let product = await productModel.findById(productId);

      // If the product is not found, return with an error
      if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/shop");
      }
      const base64Image = product.image.toString("base64");
      // Add the product with its price to the session cart
      req.session.cart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        quantity: 1, // Default quantity is 1
        discount: product.discount || 0, // Assuming discount is stored in the product model
        category: product.category,
        image: base64Image, // Assuming image is stored in the product model
      });

      req.flash("success", "Added to cart");
      return res.redirect("/shop");
    } catch (err) {
      console.error(err);
      req.flash("error", "Error adding product to cart");
      return res.redirect("/shop");
    }
  }
});

// Update Cart Route
router.post("/updatecart", isLoggedIn, async (req, res) => {
  let updatedCart = req.body.cart; // Array of { itemId, quantity }
  // Debugging line

  // Update session cart based on the new quantities
  updatedCart.forEach((item) => {
    // Check if quantity is 0 and remove item from cart if it is
    if (item.quantity === "0") {
      req.session.cart = req.session.cart.filter(
        (cartItem) => cartItem._id !== item.itemId
      );
    } else {
      // Find item in the session cart and update its quantity
      let cartItem = req.session.cart.find(
        (cartItem) => cartItem._id === item.itemId
      );
      if (cartItem) {
        cartItem.quantity = item.quantity; // Update quantity
      }
    }
  });

  // Recalculate the total bill with updated cart
  let totalMRP = req.session.cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  let totalDiscount = req.session.cart.reduce(
    (sum, item) => sum + Number(item.discount) * item.quantity,
    0
  );
  let platformFee = 20; // Only added once, not per item
  let bill = totalMRP - totalDiscount + platformFee;

  // Save the updated cart in session
  req.session.cart = req.session.cart;

  res.json({ success: true, cart: req.session.cart, bill });
  // Send back the updated cart and bill
});

router.get('/profile', isLoggedIn, async (req, res) => {
  let user = req.user;
  res.render('profile',{user});
});

router.post('/api/addresses',isLoggedIn, async (req, res) => {
  let user = req.user;
  console.log(user);
  const userId = req.user._id;
  console.log(userId);
  const { fullName, mobile, pincode, state, city, house, area } = req.body;

  if (!userId) return res.status(400).json({ message: "User ID is required" });

  const newAddress = new Address({ userId, fullName, mobile, pincode, state, city, house, area });
  const savedAddress = await newAddress.save();

  await userModel.findByIdAndUpdate(userId, { $push: { address: savedAddress._id } });

  res.json(savedAddress);
});

router.get('/api/addresses/:userId', isLoggedIn,async (req, res) => {
  const { userId } = req.params;
  const user = await userModel.findById(userId).populate('address');
  res.json(user ? user.address : []);
});

router.delete("/api/delete-address/:id",isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;
      const { id } = req.params;
      await userModel.findByIdAndUpdate(
        userId,
        { $pull: { address: id } }, // Remove address with given ID
        { new: true }
    );

      await Address.findByIdAndDelete(id); // Replace with your DB model
      res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
      res.status(500).json({ error: "Failed to delete address" });
  }
});


router.get("/logout", isLoggedIn, (req, res) => {
  res.render("/shop");
});
module.exports = router;
