import React from "react";

const SongCell = props => {

    const { artUrl, name, artist, albumName } = props.track;
    let { onClick } = props;
    if (!onClick) {
        onClick = () => { }
    }

    const backgroundStyles = {
        backgroundImage: `url(${artUrl})`,
    }

    return (
        <div className={"song-cell-wrap"} onClick={() => {
            onClick(props.track);
        }}>
            <div className="song-art-cell">
                <div className="song-art-img" style={backgroundStyles} />
            </div>
            <div className="song-details-cell">
                <div className="song-details-wrap">
                    <div className="song-title">{name}</div>
                    <div className="song-artist">
                        {artist} &middot;
                        <span className="song-album"> {albumName}</span>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default SongCell;