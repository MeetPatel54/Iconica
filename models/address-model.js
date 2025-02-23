const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    fullName: String,
    mobile: String,
    pincode: String,
    state: String,
    city: String,
    house: String,
    area: String
});

module.exports = mongoose.model("address", addressSchema);
