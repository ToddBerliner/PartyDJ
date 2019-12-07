import React from "react";

const SongCell = props => {

    const { artUrl, name, artist } = props.track;
    const { bordered } = props.bordered ? 'bordered' : '';

    const backgroundStyles = {
        backgroundImage: `url(${artUrl})`,
    }

    return (
        <div className={`song-cell-wrap ${bordered}`}>
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

export default SongCell;