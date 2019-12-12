'use strict';

const axios = require("axios");

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
