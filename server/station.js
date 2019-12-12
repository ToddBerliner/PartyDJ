'use strict';

const spotify = require("./spotify.js");

/*
    Flow is
    - client.emit(track) // client sends full track
    - server.users[userId].playlist.push(track) // next emit(stationState) updates client
    - updateSystemTracks() // creates backfill
    
    Users holds user playlists as is
    updatePlaylist
    -- copy users
    -- build playlist (destructive to users copy)
    -- backfill if needed
    -- replace tracks in spotify
    getCurrentlyPlaying
    -- find track in users & delete it (will update user specific state)

*/

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

    // Resursive function
    const gnt = (nextUserId, users, empty = []) => {

        // Stop recursion when all tracks are added to the playlist
        if (empty.length === Object.keys(users).length) {
            return false;
        }

        // See if userId has a track and return it
        if (users[nextUserId].playlist.length > 0) {
            const track = users[nextUserId].playlist.shift();
            playlist.push(track.uri);
        } else {
            // Mark this user empty if not already marked
            if (!empty.includes(nextUserId)) {
                empty.push(nextUserId);
            }
        }

        // Move on to next user
        nextUserId = users[nextUserId].next;

        return gnt(nextUserId, users, empty);
    }

    // If no users empty, return false
    if (Object.keys(users).length === 0) {
        return false;
    }

    // Always start at the beginning
    gnt(Object.keys(users)[0], users);

    return playlist;

}

module.exports.removeTrack = (users, trackUri) => {
    console.log(`trying to remove track ${trackUri}`);
    for (let user in users) {
        users[user].playlist = users[user].playlist.filter(track => {
            return trackUri !== track.uri;
        });
    }
};