export const authEndpoint = "https://accounts.spotify.com/authorize";

export const clientId = "5624ad43c59e452fa3878109bb0f7783";
export const redirectUri = "http://localhost:3000/login";
export const scopes = [
    "user-top-read",
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-read-recently-played",
    "user-modify-playback-state",
    "playlist-read-private",
    "user-library-read",
    "user-top-read"
];
export const deviceId = "de3815c44805edf38db1b732b806e182471712d1";
export const emptyItem = {
    album: {
        images: [{ url: "" }],
        name: ""
    },
    name: "",
    artists: [{ name: "" }],
    duration_ms: 0,
};