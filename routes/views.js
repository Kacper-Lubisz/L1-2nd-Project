const express = require('express');
const fs = require('fs');

const router = express.Router();

// GET home page
router.get('/', function (req, res, next) {
    res.render('index', {
        // by default we serve index page which contains a loading spinner
        // this is then replaced by the page through an ajax request
        title: 'DurPeer',
        logo: "/images/logo.png"
    });
});

// This block makes it so that all views(views folder) are served
fs.readdir("./views/", function (err, items) {
    if (err !== null) {
        throw Error("Failed to read views folder");
    }

    items.filter((file) => file.endsWith(".pug"))
        .map((file) => file.substr(0, file.length - 4))
        .forEach(function (file) {
            router.get("/" + file + ".html", function (req, res, next) {
                res.render(file);
            });
        });
});

module.exports = router;
