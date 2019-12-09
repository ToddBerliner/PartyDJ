'use strict';

const axios = require("axios");

module.exports.extractTrack = playerData => {

    const track = playerData.item;
    let artUrl = "";
    let artist = null;
    try {
        artUrl = track.album.images[0].url;
        artist = track.artists[0].name;
    } catch (err) { }

    return {
        uri: track.uri,
        artUrl: artUrl,
        name: track.name,
        albumName: track.album.name,
        artist: artist,
        duration_ms: track.duration_ms
    }
}

module.exports.playPlaylist = (token, deviceId) => {
    axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
            "context_uri": "spotify:playlist:40A1SdohDLvoG4iitBuqns",
            "offset": {
                "position": 0
            },
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
