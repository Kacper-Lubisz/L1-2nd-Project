const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/views'));
app.use('/assessment', require('./routes/assignments'));
app.use('/critique', require('./routes/critiques'));
app.use('/notifications', require('./routes/notifications'));
app.use('/reviews', require('./routes/reviews'));
app.use('/users', require('./routes/users'));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // render the error page
    res.status(err.status || 500);
    res.render('errorPage' , {
        message: err.message,
        error: req.app.get('env') === 'development' ? err : {} // set locals, only providing error in development
    });
});

module.exports = app;