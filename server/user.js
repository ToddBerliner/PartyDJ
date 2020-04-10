'use strict';
const mysql = require('mysql');
const spotify = require("./spotify.js");
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'all0nall0n',
    database: 'partydj'
});

module.exports = {
    getRefreshTokenByUserId: function(userId) {
        return new Promise(resolve => {
            pool.query("SELECT refresh_token FROM users where id = ?", [userId], (err, results) => {
                if (err) resolve(false);
                resolve(results[0].refresh_token);
            })
        });
    },
    getUserId: async function (code) {
        let tokens = await spotify.tokenSwap(code);
        if (tokens) {
            let spotifyUserId = await spotify.getUser(tokens.accessToken);
            if (spotifyUserId) {
                let userId = await this.createOrUpdate({
                    ...tokens,
                    spotifyUserId
                });
                if (userId) {
                    return userId;
                }
            }
        }
        return false;
    },
    createOrUpdate: function (spotData) {
        return new Promise(resolve => {
            let {spotifyUserId, accessToken, refreshToken} = spotData;
            let query = `
                INSERT INTO users (spotify_id, token, refresh_token)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE token = ?, refresh_token = ?;
            `;
            pool.query(query, [
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
                SELECT * FROM users WHERE spotify_id = ?
            `;
            pool.query(selectQuery, [
                spotifyUserId
            ], (err, results) => {
                if (err) {
                    console.log(`---- error query 2`);
                    resolve(false);
                } else {
                    console.log(`---- results query 2`);
                    resolve(results[0]);
                }
            });
        })
    }
}