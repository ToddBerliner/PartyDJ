export const authEndpoint = "https://accounts.spotify.com/authorize";

export const clientId = "5624ad43c59e452fa3878109bb0f7783";
export const endpoint = process.env.REACT_APP_ENDPOINT;
export const redirectUri = process.env.REACT_APP_REDIRECT_URI;
export const serverRedirectUri = process.env.REACT_APP_REDIRECT_URI;
export const scopes = [
    "user-top-read",
    "user-library-read",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played",
    "user-modify-playback-state",
    "playlist-read-private",
    "playlist-modify-public",
    "playlist-modify-private"
];

export const emptyTrack = {
    uri: "",
    artUrl: "",
    name: "",
    albumName: "",
    artist: "",
    duration_ms: 0
};

export const track = {
    uri: "spotify:track:6g2f9QpC5Q10MLs9hRCoQ9",
    artUrl: "https://i.scdn.co/image/ab67616d0000b273414b87a6254c0d6e2943d928",
    name: "In The Middle - Miktek Remix",
    albumName: "Star Walk (Remastered 2019)",
    artist: "AstroPilot",
    duration_ms: 567000
}

export const responseType = "code";

export const showDialog = "false";