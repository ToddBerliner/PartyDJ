import React, { Component } from 'react';
import SongCell from "./SongCell";
import ArtistCell from "./ArtistCell";
import AlbumCell from "./AlbumCell";
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
    --- getArtistTopTracks

    - artist
    -- top tracks
    --- tracks
    -- albums
    --- tracks

    - albums
    -- tracks

    pane: level
    title: Tracks | Albums | Artists | Album Title | Artist Name | Artist Name, Album Title

    <TracksPane>
    <ArtistPane>
    <AlbumPane>
*/

const Form = props => {
    const { handleSubmit, handleChange, search, type, handleType } = props;
    return (
        <form
            onSubmit={handleSubmit}
            className="search-input-wrap">
            <div className="search-nav">
                <div
                    className={`search-item 
                        ${type === 'track' ? "search-active" : ""}`
                    }
                    onClick={() => handleType('track')}>Tracks</div>
                <div
                    className={`search-item 
                        ${type === 'artist' ? "search-active" : ""}`
                    }
                    onClick={() => handleType('artist')}>Artists</div>
                <div
                    className={`search-item 
                        ${type === 'album' ? "search-active" : ""}`
                    }
                    onClick={() => handleType('album')}>Albums</div>
            </div>
            <div className="search-inputs">
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
            </div>
        </form>
    );
}

const SearchResults = props => {
    const { data, clickHandler, type } = props;
    if (data.length === 0) {
        return (<div className="no-data">No results</div>);
    }
    let results = [];
    for (let [index, item] of data.entries()) {
        switch (type) {
            case 'artist':
                results.push(<ArtistCell
                    key={index}
                    artist={item}
                    onClick={() => clickHandler(item)} />);
                break;
            case 'album':
                results.push(<AlbumCell
                    key={index}
                    album={item}
                    onClick={() => clickHandler(item)} />);
                break
            default:
                results.push(<SongCell
                    key={index}
                    track={item}
                    onClick={() => clickHandler(item)} />);
        }
    }
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
        this.handleSearchResults = this.handleSearchResults.bind(this);
        this.handleType = this.handleType.bind(this);
        this.handleArtistClick = this.handleArtistClick.bind(this);
        this.handleAlbumClick = this.handleAlbumClick.bind(this);
    }

    componentDidMount() {
        this.props.socket.on("search", this.handleSearchResults);
    }

    handleSearchResults(searchResults) {
        // TODO: need to consider how to know if we're in a drill down search
        const { type } = this.state;
        switch (type) {
            case 'album':
                this.setState({
                    albums: searchResults,
                    loading: false
                });
                break;
            case 'artist':
                this.setState({
                    artists: searchResults,
                    loading: false
                });
                break;
            default:
                this.setState({
                    tracks: searchResults,
                    loading: false
                });
        }
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

    handleArtistClick(artist) {
        console.log(`clicked artist: ${artist.name}`);
    }

    handleAlbumClick(album) {
        console.log(`clicked album: ${album.name}`);
    }

    handleType(type) {
        this.setState({ type });
    }

    render() {
        const { search, type, loading, tracks, albums, artists } = this.state;
        const { isSearching, onClick, onAddToQueue } = this.props;
        const closedClass = isSearching ? '' : 'closed';

        let data = [];
        switch (type) {
            case 'track':
                data = tracks;
                break;
            case 'album':
                data = albums;
                break;
            case 'artist':
                data = artists;
                break;
            default:
                data = [];
        }

        let searchResults = null;
        switch (type) {
            case 'artist':
                searchResults = <SearchResults
                    data={data}
                    clickHandler={(artist) => this.handleArtistClick(artist)}
                    type={type} />
                break;
            case 'album':
                searchResults = <SearchResults
                    data={data}
                    clickHandler={(album) => this.handleAlbumClick(album)}
                    type={type} />
                break;
            default:
                searchResults = <SearchResults
                    data={data}
                    clickHandler={(track) => onAddToQueue(track)}
                    type={type} />
        }

        return (
            <div className={"Search " + closedClass}>
                <Form
                    handleSubmit={this.handleSubmit}
                    handleChange={this.handleChange}
                    search={search}
                    handleType={this.handleType}
                    type={type} />
                <div className="search-results">
                    {
                        loading
                            ? <div className="search-loading">Loading...</div>
                            : searchResults
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