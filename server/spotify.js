'use strict';

const axios = require("axios");
const querystring = require("querystring");

const spotifyConfig = {
    clientId: "5624ad43c59e452fa3878109bb0f7783",
    clientSecret: "dad234b4a3fe4d93b62fc2543f45b887"
}

module.exports.spotifyConfig = spotifyConfig;

module.exports.extractId = uri => {
    return [...uri.split(":")].pop();
}

module.exports.getRecommendations = (token, trackIds, handler) => {
    axios.get(`https://api.spotify.com/v1/recommendations?seed_tracks=${trackIds.slice(0, 5).join(",")}&limit=50`,
        {
            headers: { "Authorization": "Bearer " + token }
        })
        .then(response => {
            handler(response);
        })
        .catch(err => { console.log(err); return false });
}

module.exports.getAppToken = async function (spotifyAuth, handler = null) {
    const base64data = new Buffer.from(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`).toString('base64');
    const config = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64data}`
        }
    };
    const data = querystring.stringify({ grant_type: 'client_credentials' });
    await axios.post("https://accounts.spotify.com/api/token", data, config)
        .then(response => {
            if (response.status === 200
                && response.data
                && response.data.access_token) {
                spotifyAuth.appToken = response.data.access_token;
                console.log(`Set app token: ${spotifyAuth.appToken}`);
                if (handler !== null) {
                    handler(spotifyAuth.appToken);
                }
            }
        })
        .catch(err => {
            console.log(`Status of getAppToken: ${err}`);
        });
}

module.exports.search = (spotifyAuth, userId, query, type, handler) => {
    axios.get(`https://api.spotify.com/v1/search?q=${query}&type=${type}&limit=50`,
        {
            headers: { "Authorization": "Bearer " + spotifyAuth.appToken }
        })
        .then(response => {
            handler(userId, response, type);
        })
        .catch(err => {
            if (err.response.status === 401) {
                // Auth again and run search
                this.getAppToken(spotifyAuth, () => {
                    this.search(spotifyAuth, userId, query, type, handler);
                });
            }
        });
}

module.exports.getUser = token => {
    // console.log(`>> Getting user for token: ${token}`);
    console.log(`returning promise`);
    return axios.get(`https://api.spotify.com/v1/me`,
        {
            headers: { "Authorization": "Bearer " + token }
        })
        .then(response => {
            console.log(`resolving promise`);
            return Promise.resolve(response.data.id);
        })
        .catch(err => {
            console.log(`resolving promise err`);
            return Promise.resolve(false)
        });
}

/**
 * Swaps the code for user tokens.
 *
 * @param code
 * @returns {Promise<AxiosResponse<T>>}
 */
module.exports.tokenSwap = (code) => {
    const config = {};
    const data = querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://10.0.0.80:4000/spotify',
        client_id: spotifyConfig.clientId,
        client_secret: spotifyConfig.clientSecret
    });
    return axios.post('https://accounts.spotify.com/api/token',
        data, config)
        .then(spotRes => {
            return Promise.resolve({
                accessToken: spotRes.data.access_token,
                refreshToken: spotRes.data.refresh_token
            });
        }).catch(err => {
            console.log(`resolving promise err`);
            return Promise.resolve(false);
        });
}

module.exports.fetchAlbumTracks = (token, userId, albumId, handler) => {
    axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`,
        {
            headers: { "Authorization": "Bearer " + token }
        })
        .then(response => {
            handler(userId, response, "albumTracks");
        })
        .catch(err => { console.log(err); return false });
}

module.exports.fetchArtistAlbums = (token, userId, artistId, handler) => {
    axios.get(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=50`,
        {
            headers: { "Authorization": "Bearer " + token }
        }
    )
        .then(response => {
            handler(userId, response, "artistAlbums");
        })
        .catch(err => { console.log(err) });
}

module.exports.fetchArtistTopTracks = (token, userId, artistId, handler) => {
    axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=US`,
        {
            headers: { "Authorization": "Bearer " + token }
        }
    )
        .then(response => {
            handler(userId, response, "artistTracks");
        })
        .catch(err => { console.log(err) });
}

module.exports.extractAlbum = album => {
    if (album === null) {
        return false;
    }
    let artUrl = "";
    let artist = "";
    try {
        artUrl = album.images[0].url;
        artist = album.artists[0].name;
    } catch (err) { console.log(err, album); return false }
    return {
        uri: album.uri,
        artUrl,
        artist,
        name: album.name
    }
}

module.exports.extractArtist = artist => {
    if (artist === null) {
        return false;
    }

    let artUrl = "";
    try {
        artUrl = artist.images[0].url;
    } catch (err) { console.log(err); return false }

    return {
        uri: artist.uri,
        name: artist.name,
        artUrl
    }
};

module.exports.extractTrack = track => {

    if (track === null) {
        return false;
    }

    let artUrl = "";
    let artist = null;
    let albumName = "";
    if (track.album) {
        try {
            artUrl = track.album.images[0].url;
            albumName = track.album.name;
        } catch (err) { }
    }
    try {
        artist = track.artists[0].name;
    } catch (err) { console.log(err); return false }
    return {
        uri: track.uri,
        artUrl: artUrl,
        name: track.name,
        albumName: albumName,
        artist: artist,
        duration_ms: track.duration_ms
    }
};

module.exports.updatePlaylist = (token, playlistId, trackUris = []) => {
    console.log(`  --> updating playlist with ${trackUris.length} tracks`);
    axios.put(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
            "uris": trackUris
        }, {
            headers: { "Authorization": "Bearer " + token }
        })
        .catch(err => { console.log(err) });
};

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
};

module.exports.playTrack = (token, deviceId, trackUri) => {
    axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
            "uris": [trackUri],
            "position_ms": 0
        }, {
            headers: { "Authorization": "Bearer " + token }
        })
        .catch(err => { console.log(err) });
};

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
};


