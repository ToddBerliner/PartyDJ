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

const Form = props => {
    const { handleSubmit, handleChange, search } = props;
    return (
        <form
            onSubmit={handleSubmit}
            className="search-input-wrap">
            <input
                type="text"
                placeholder="Search"
                className="search-input"
                name="search"
                value={search}
                onChange={handleChange} />
            <input
                type="submit"
                className="search-button"
                value="Go" />
        </form>
    );
}

const SearchResults = props => {
    const { data, clickHandler } = props;
    if (data.length === 0) {
        return (<div className="no-data">No results</div>);
    }
    let results = [];
    // TODO: handle type hear to render correct search type (tracks, albums, artists)
    // The drill downs should use different "panes" to allow pushing and popping 
    data.map((track, index) => {
        results.push(<SongCell
            key={index}
            track={track}
            onClick={() => clickHandler(track)} />);
    });
    return results;
}

class Search extends Component {
    constructor(props) {
        super(props);
        this.state = {
            search: '',
            loading: false,
            type: 'track',
            tracks: [],
            albums: [],
            artists: []
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        this.props.socket.on("search", searchResults => {
            console.log("Got results:");
            console.log(searchResults);
        });
    }

    handleChange(event) {
        this.setState({ search: event.target.value });
    }

    handleSubmit(event) {
        if (this.state.search !== '') {
            this.setState({ loading: true });
            this.props.socket.emit("search", {
                query: this.state.search,
                type: this.state.type
            });
            event.preventDefault();
        }
    }

    render() {
        const { search, type, loading, tracks } = this.state;
        const { isSearching, onClick, onAddToQueue } = this.props;
        const closedClass = isSearching ? '' : 'closed';

        let data = [];
        switch (type) {
            case 'track':
                data = tracks;
                break;
            default:
                data = [];
        }

        return (
            <div className={"Search " + closedClass}>
                <Form
                    handleSubmit={this.handleSubmit}
                    handleChange={this.handleChange}
                    search={search} />
                <div className="search-results">
                    {
                        loading
                            ? <div className="search-loading">Loading...</div>
                            : <SearchResults
                                data={data}
                                clickHandler={(track) => onAddToQueue(track)} />
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