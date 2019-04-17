const config = require("../config/config");
const path = require('path');
const createError = require('http-errors');

// Load all the regular expressions
const validRE = config.indexPathsRE.map((stringRE) => new RegExp(stringRE));

/**
 * This middle ware allows for returning the index page for filepaths other then the ones that by default point to the
 * index file ('/', '/index.html').  This is because these pages are all drawn from the the index.html file (by checking
 * the url and loading the appropriate template).
 * @param req The express request
 * @param res The express response
 * @param next The next piece of middleware
 */
module.exports = function (req, res, next) {
    const match = validRE.find((re) => re.test(req.path));

    if (match !== undefined) {
        res.sendFile(path.join(__dirname, '../public', 'index.html'));
        res.end();
    } else {
        next(createError(404));
    }
};