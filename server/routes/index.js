const express = require("express");
const router = express.Router();
const axios = require('axios');
const spotify = require("../spotify.js");
const user = require("../user.js");
const querystring = require('querystring');

router.get("/", (req, res) => {
    res.send({response: "I am alive"}).status(200);
});

router.get("/spotify", (req, res) => {
    // Check for code
    // TODO: handle authorization_denied
    const code = req.query.code;
    if (code) {
        console.log(`-------> Calling user.getSpotifyUser`);
        user.getUserId(code)
            .then(userId => {
                if (userId) {
                    res.redirect('http://10.0.0.80:3000');
                } else {
                    res.redirect('http://10.0.0.80:3000/login');
                }
            });

    }
});

module.exports = router;