'use strict';

const spotify = require("./spotify.js");

module.exports.getStationState = (user, state) => {
    if (typeof user === 'undefined') {
        return state;
    }
    // state = state + user.tracks
    const userSpecificState = Object.assign({}, state);
    userSpecificState.playlist = user.playlist;
    return userSpecificState;
}

module.exports.getPlaylist = (users) => {

    const playlist = [];
    const seeds = {};

    // Resursive function
    const gnt = (nextUserId, users, empty = []) => {

        // console.log(`At ${empty.length} empty of ${Object.keys(users).length}`);

        // Stop recursion when all tracks are added to the playlist
        if (empty.length === Object.keys(users).length) {
            // console.log("empty - returning");
            return false;
        }

        // See if userId has a track and return it
        if (users[nextUserId].playlist.length > 0) {
            const track = users[nextUserId].playlist.shift();
            playlist.push(track.uri);
            seeds[nextUserId] = track.uri;
            // ("added track");
        } else {
            // Mark this user empty if not already marked
            if (!empty.includes(nextUserId)) {
                // console.log(`marking ${nextUserId} empty`);
                empty.push(nextUserId);
            }
        }

        // Move on to next user
        nextUserId = users[nextUserId].next;

        // console.log(`at end of first run with ${empty.length} empty of ${Object.keys(users).length}`);
        return gnt(nextUserId, users, empty);
    }

    // If no users, return false
    if (Object.keys(users).length === 0) {
        return false;
    }

    // Always start at the beginning
    gnt(Object.keys(users)[0], users);

    return playlist;

}

module.exports.removeTrack = (users, trackUri) => {
    // console.log(`trying to remove track ${trackUri}`);
    for (let user in users) {
        users[user].playlist = users[user].playlist.filter(track => {
            return trackUri !== track.uri;
        });
    }
};