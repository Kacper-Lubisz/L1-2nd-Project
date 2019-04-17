const express = require('express');
const path = require('path');
const logger = require('morgan');
const fileUpload = require('express-fileupload');

const app = express();

// view engine setup

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
    limits: {fileSize: 50 * 1024 * 1024},
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

app.use('/assignments', require('./routes/assignments'));
app.use('/notifications', require('./routes/notifications'));
app.use('/reviews', require('./routes/reviews'));
app.use('/users', require('./routes/users'));
app.use('/submission', require('./routes/submission'));
app.use('/work', require('./routes/work'));

// this last middleware either returns the index page for some paths or throws a 404
app.use("*", require('./routes/indexs'));

// error handler
app.use(function (err, req, res, next) {
    console.log("we have git an error");
    // render the error page
    res.status(err.status || 500);
    if (req.app.get('env') === 'development') {
        res.json(err);
        console.error(err);
    } else {
        res.end("Server Error " + err.status);
    }

});

module.exports = app;