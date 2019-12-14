'use strict';

const axios = require("axios");
const querystring = require("querystring");

module.exports.getAppToken = spotifyAuth => {
    const base64data = new Buffer("5624ad43c59e452fa3878109bb0f7783:dad234b4a3fe4d93b62fc2543f45b887").toString('base64');
    const config = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64data}`
        }
    };
    const data = querystring.stringify({ grant_type: 'client_credentials' });
    axios.post("https://accounts.spotify.com/api/token", data, config)
        .then(response => {
            if (response.status === 200
                && response.data
                && response.data.access_token) {
                spotifyAuth.appToken = response.data.access_token;
                console.log(`Set app token: ${spotifyAuth.appToken}`);
            }
        })
        .catch(err => {
            console.log(err);
        });
}

module.exports.search = (userId, query, type, handler) => { }

module.exports.fetchAlbumTracks = (token, userId, albumId, handler) => {
    axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks`,
        {
            headers: { "Authorization": "Bearer " + token }
        }
    )
        .then(response => {
            handler(userId, response);
        })
        .catch(err => { console.log(err) });
}

module.exports.fetchArtist = (userId, artistId, handler) => { }

module.exports.extractTrack = track => {

    if (track === null) {
        return false;
    }

    let artUrl = "";
    let artist = null;
    try {
        artUrl = track.album.images[0].url;
        artist = track.artists[0].name;
        return {
            uri: track.uri,
            artUrl: artUrl,
            name: track.name,
            albumName: track.album.name,
            artist: artist,
            duration_ms: track.duration_ms
        }
    } catch (err) {
        return false;
    }
}

module.exports.updatePlaylist = (token, playlistId, trackUris = []) => {
    console.log(`  --> updating playlist with ${trackUris.length} tracks`);
    axios.put(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
            "uris": trackUris
        }, {
            headers: { "Authorization": "Bearer " + token }
        })
        .catch(err => { console.log(err) });
}

module.exports.playPlaylist = (token, deviceId, playlistUri) => {
    axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
            "context_uri": playlistUri,
            "offset": {
                "position": 0
            },
            "position_ms": 0
        }, {
            headers: { "Authorization": "Bearer " + token }
        })
        .catch(err => { console.log(err) });
}

module.exports.playTrack = (token, deviceId, trackUri) => {
    axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
            "uris": [trackUri],
            "position_ms": 0
        }, {
            headers: { "Authorization": "Bearer " + token }
        })
        .catch(err => { console.log(err) });
}

module.exports.getCurrentlyPlaying = (token, handler) => {
    axios.get("https://api.spotify.com/v1/me/player",
        {
            headers: { "Authorization": "Bearer " + token }
        }
    )
        .then(response => {
            handler(response);
        })
        .catch(err => { console.log(err) });
}
