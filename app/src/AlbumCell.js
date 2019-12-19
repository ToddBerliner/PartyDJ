import React from "react";

const AlbumCell = props => {

    const { artUrl, name, artist } = props.album;
    const { onClick } = props;

    const backgroundStyles = {
        backgroundImage: `url(${artUrl})`,
    }

    return (
        <div className={"song-cell-wrap"} onClick={() => {
            onClick(props.album);
        }}>
            <div className="song-art-cell">
                <div className="song-art-img" style={backgroundStyles} />
            </div>
            <div className="song-details-cell">
                <div className="song-details-wrap">
                    <div className="song-title">{name}</div>
                    <div className="song-artist">{artist}</div>
                </div>
            </div>
        </div >
    );
}

export default AlbumCell;