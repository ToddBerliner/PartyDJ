import React from "react";
import "./Player.css";
import SongCell from "./SongCell.js";

const Player = props => {
    let duration = props.item.duration_ms;
    let progress = props.progress_ms || 0;
    if (duration === 0) {
        progress = 0;
        duration = 1;
    }
    const progressBarStyles = {
        width: (progress * 100 / duration) + '%'
    }
    const playerBgStyles = {
        backgroundImage: `url(${props.item.album.images[0].url})`
    }

    return (
        // Player UI
        <>
            <div className="PlayerBg" style={playerBgStyles}>
                <div className="Player">
                    <div className="playing-wrap">
                        <div className="playing-title">{props.item.name}</div>
                        <div className="playing-artist">{props.item.artists[0].name}</div>
                    </div>
                    <div className="progress-wrap">
                        <div className="progress-bar" style={progressBarStyles} />
                    </div>
                </div>
            </div>
            <div className="QueueWrap">
                <div className="NextUp">
                    <div className="section-wrap">
                        <div className="section-header">
                            <div className="section-title">Your Next Up</div>
                            <div className="section-callout">{props.songsAhead > 0
                                ? `${props.songsAhead} songs ahead`
                                : ""
                            }</div>
                        </div>
                        <SongCell item={props.playlist[0]} bordered={false} />
                    </div>
                </div>
                <div className="Queue">
                    <div className="section-wrap">
                        <div className="section-header">
                            <div className="section-title">Your Queue</div>
                            <div className="section-callout">Add</div>
                        </div>
                        {props.playlist.map((item, index) => {
                            if (index > 0) {
                                return (
                                    <SongCell key={index} item={item} bordered={false} />
                                );
                            } else {
                                return null;
                            }
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Player;