const mongoose = require('mongoose');
const dbgr = require('debug')("development:mongoose");
mongoose
.connect("mongodb://127.0.0.1:27017/iconica")
.then(function(){
    dbgr("Connected");
})
.catch(function(err){
    dbgr("Failed to connect", err);
})

module.exports = mongoose.connection;