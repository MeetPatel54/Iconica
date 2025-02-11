const mongoose = require('mongoose');

mongoose
.connect("mongodb://127.0.0.1:27017/iconica")
.then(function(){
    console.log("Connected");
})
.catch(function(err){
    console.log("Failed to connect", err);
})

module.exports = mongoose.connection;