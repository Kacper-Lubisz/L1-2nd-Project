const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');

const app = express();

// view engine setup

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/assessment', require('./routes/assignments'));
app.use('/notifications', require('./routes/notifications'));
app.use('/reviews', require('./routes/reviews'));
app.use('/users', require('./routes/users'));


// catch 404, handles it by returning the index page
app.use(function (req, res, next) {
    res.sendFile(path.join(__dirname, '/public', 'index.html'));
});

// error handler
app.use(function (err, req, res, next) {
    // render the error page
    res.status(err.status || 500);
    if (req.app.get('env') === 'development') {
        res.end(JSON.stringify(err));
    } else {
        res.end("Server Error " + err.status);
    }

});

module.exports = app;