const mongoose = require('mongoose');
const config = require('config');
const dbgr = require('debug')("development:mongoose");
mongoose
.connect(`${config.get("MONGODB_URI")}/iconica`)
.then(function(){
    dbgr("Connected");
})
.catch(function(err){
    dbgr("Failed to connect", err);
})

module.exports = mongoose.connection;