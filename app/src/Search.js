import React, { Component } from 'react';
import SongCell from "./SongCell";
import tracks from "./scratch/playlistData.js";

/*
    Search: By Track | By Artist | By Album
    - enter search, io.emit("search", {
        query: 'string',
        type: 'track|artist|album'
    })
    - display results
    -- track -> tap -> io.emit("add song")
    -- artist, album -> tap -> io.emit("get artist|album")
    --- getAlbumTracks
    --- getArtistAlbums -> getAlbumTracks
*/

class Search extends Component {
    constructor(props) {
        super(props);
        const _tracks = [...tracks];
        _tracks.push(...tracks);
        _tracks.push(...tracks);
        this.state = {
            tracks: _tracks,
            albums: [],
            artists: [],
            search: ''
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ search: event.target.value });
    }

    handleSubmit(event) {
        console.log(`searching: ${this.state.search}`);
        event.preventDefault();
    }

    render() {
        const { tracks } = this.state;
        const { isSearching, onClick, onAddToQueue } = this.props;
        const closedClass = isSearching ? '' : 'closed';
        return (
            <div className={"Search " + closedClass}>
                <form
                    onSubmit={this.handleSubmit}
                    className="search-input-wrap">
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-input"
                        name="search"
                        value={this.state.search}
                        onChange={this.handleChange} />
                    <input
                        type="submit"
                        className="search-button"
                        value="Go" />
                </form>
                <div className="search-results">
                    {
                        tracks.length > 0
                            ? tracks.map((track, index) => {
                                return (
                                    <SongCell
                                        key={index}
                                        track={track}
                                        onClick={() => onAddToQueue(track)} />
                                );
                            })
                            : null
                    }
                </div>
                <div className="search-closer">
                    <button
                        onClick={onClick}
                        className="search-done">
                        DONE
                    </button>
                </div>
            </div>
        );
    }
}

export default Search;