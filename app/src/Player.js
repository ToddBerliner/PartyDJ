import React from "react";
import "./Player.css";
import SongCell from "./SongCell.js";
import { emptyTrack } from "./config";

const Player = props => {

    const {
        progress_ms,
        songsAhead,
        playlist,
        onQueueAdd,
        activeMemberCount } = props;
    let { track } = props;
    if (track === null) {
        track = emptyTrack;
    }

    let duration = track.duration_ms;
    let progress = progress_ms || 0;
    if (duration === 0) {
        progress = 0;
        duration = 1;
    }
    const progressBarStyles = {
        width: (progress * 100 / duration) + '%'
    }
    const playerBgStyles = {
        backgroundImage: `url(${track.artUrl})`
    }

    return (
        // Player UI
        <div className="App PlayerWrap">
            <div className="PlayerBg">
                <div className="PlayerArt" style={playerBgStyles} />
                <div className="Player">
                    <div className="playing-wrap">
                        <div className="playing-title">{track.name}</div>
                        <div className="playing-artist">{track.artist}</div>
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
                                ? `${songsAhead} songs ahead`
                                : ""
                            }</div>
                        </div>
                        <SongCell track={
                            playlist.length > 0
                                ? playlist[0]
                                : emptyTrack
                        } bordered={false} />
                    </div>
                </div>
                <div className="Queue">
                    <div className="section-wrap">
                        <div className="section-header">
                            <div className="section-title">Your Queue</div>
                            <button
                                className="section-callout"
                                onClick={onQueueAdd}>Add</button>
                        </div>
                        {
                            playlist.length > 0
                                ? playlist.map((track, index) => {
                                    if (index > 0) {
                                        return (
                                            <SongCell key={index} track={track} bordered={false} />
                                        );
                                    } else {
                                        return null;
                                    }
                                })
                                : null
                        }
                        <div class="queue-footer">
                            {activeMemberCount} people online
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Player;