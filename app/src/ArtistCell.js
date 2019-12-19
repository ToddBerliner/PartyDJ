import React from "react";

const ArtistCell = props => {

    const { artUrl, name } = props.artist;
    const { onClick } = props;

    const backgroundStyles = {
        backgroundImage: `url(${artUrl})`,
    }

    return (
        <div className={"song-cell-wrap"} onClick={() => {
            onClick(props.artist);
        }}>
            <div className="song-art-cell">
                <div className="song-art-img" style={backgroundStyles} />
            </div>
            <div className="song-details-cell">
                <div className="song-details-wrap">
                    <div className="song-title">{name}</div>
                </div>
            </div>
        </div >
    );
}

export default ArtistCell;