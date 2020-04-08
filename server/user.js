'use strict';
const mysql = require('mysql');
const spotify = require("./spotify.js");
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'all0nall0n',
    database: 'partydj'
});

module.exports = {
    getUserId: async function (code) {
        console.log(`-- start tokenSwap --`);
        let tokens = await spotify.tokenSwap(code);
        console.log(`-- end tokenSwap --`);
        if (tokens) {
            console.log(`-- start getUser`);
            let spotifyUserId = await spotify.getUser(tokens.accessToken);
            console.log(`-- end getUser: ${spotifyUserId} --`);
            if (spotifyUserId) {
                console.log(`-- start createOrUpdate --`);
                let userId = await this.createOrUpdate({
                    ...tokens,
                    spotifyUserId
                });
                if (userId) {
                    return userId;
                }
            }
        }
        console.log(`>> FU <<`);
        return false;
    },
    createOrUpdate: function (spotData) {
        return new Promise(resolve => {
            connection.connect();
            let {spotifyUserId, accessToken, refreshToken} = spotData;
            let query = `
                INSERT INTO users (spotify_id, token, refresh_token)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE token = ?, refresh_token = ?;
            `;
            connection.query(query, [
                spotifyUserId,
                accessToken,
                refreshToken,
                accessToken,
                refreshToken
            ], (err, results) => {
                if (err) {
                    resolve(false);
                }
            });
            let selectQuery = `
                SELECT id FROM users WHERE spotify_id = ?
            `;
            connection.query(selectQuery, [
                spotifyUserId
            ], (err, results) => {
                connection.end();
                if (err) {
                    console.log(`---- error query 2`);
                    resolve(false);
                } else {
                    console.log(`---- results query 2`);
                    resolve(results[0].id);
                }
            });
        })
    }
}