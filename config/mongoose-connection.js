const mongoose = require('mongoose');
const config = require('config');
const dbgr = require('debug')("development:mongoose");
mongoose
.connect(process.env.MONGODB_URI)
.then(function(){
    dbgr("Connected");
})
.catch(function(err){
    dbgr("Failed to connect", err);
})

module.exports = mongoose.connection;