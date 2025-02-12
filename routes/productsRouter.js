const express = require('express');
const router = express.Router();

router.get('/create', (req,res)=>{
    res.send("Hey It's working");
});

module.exports = router;