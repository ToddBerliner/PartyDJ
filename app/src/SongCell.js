import React, { Component } from 'react';

class SongCell extends Component {

    constructor(props) {
        super(props);
        this.state = {
            checked: props.checked,
            track: props.track,
            onClick: props.onClick
        };
        this.selectTrack = this.selectTrack.bind(this);
    }

    selectTrack(track) {
        this.state.onClick(track);
        this.setState({
            checked: true
        });
    }

    render() {

        let { checked, track } = this.state;
        const { artUrl, name, artist, albumName } = track;

        const backgroundStyles = {
            backgroundImage: `url(${artUrl})`,
        };

        return (
            <div className={"song-cell-wrap"} onClick={
                checked
                    ? () => {}
                    : () => {
                        this.selectTrack(track);
                    }
            }>
                <div className="song-art-cell">
                    <div className="song-art-img" style={backgroundStyles}>
                        {checked &&
                        <>
                            <div className="song-art-img-checked" />
                            <span className="material-icons song-art-check">check_circle</span>
                        </>
                        }
                    </div>
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
}

export default SongCell;