const axios = require("axios");

module.exports.extractTrack = playerData => {

    const track = playerData.item;
    let artUrl = "";
    try {
        artUrl = track.album.images[0].url;
    } catch (err) { }

    return {
        id: track.id,
        artUrl: artUrl,
        name: track.name,
        albumName: track.album.name,
        artist: track.artists[0].name,
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
