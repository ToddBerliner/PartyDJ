import React from "react";

const SongCell = props => {

    const item = props.item || {
        album: {
            images: [{ url: "" }],
            name: ""
        },
        name: "",
        artists: [{ name: "" }],
        duration_ms: 0,
    };

    const backgroundStyles = {
        backgroundImage: `url(${item.album.images[0].url})`,
    }

    const bordered = props.bordered ? 'bordered' : '';
    return (
        <div className={`song-cell-wrap ${bordered}`}>
            <div className="song-art-cell">
                <div className="song-art-img" style={backgroundStyles} />
            </div>
            <div className="song-details-cell">
                <div className="song-details-wrap">
                    <div className="song-title">{item.name}</div>
                    <div className="song-artist">{item.artists[0].name}</div>
                </div>
            </div>
        </div >
    );
}

export default SongCell;