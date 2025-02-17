const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');
const expressSession = require('express-session');
const flash = require('connect-flash');

require("dotenv").config();

const ownersRouter = require('./routes/ownersRouter');
const usersRouter = require('./routes/usersRouter');
const productsRouter = require('./routes/productsRouter');
const indexRouter = require('./routes/index');

const db = require('./config/mongoose-connection');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    expressSession({
        secret: process.env.EXPRESS_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 48 * 60 * 60 * 1000 // 48 hours in milliseconds
        }
    })
);
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use('/users', usersRouter);
app.use('/owners', ownersRouter);
app.use('/products', productsRouter);
app.use('/' , indexRouter);



app.listen(3000, (err, res)=>{
    if(err) console.log(err);
    else console.log("Server is running on http://localhost:3000");
})
