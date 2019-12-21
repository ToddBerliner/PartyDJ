import React, { Component } from 'react';
import SongCell from "./SongCell";
import ArtistCell from "./ArtistCell";
import AlbumCell from "./AlbumCell";
import playlist from "./scratch/playlistData";

const Form = props => {
    const { handleSubmit, handleChange, search, type, handleType, handleClear } = props;
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
                <div className="search-wrap">
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-input"
                        name="search"
                        value={search}
                        onChange={handleChange} />
                    <button
                        type="button"
                        disabled={search === ""}
                        className="search-clear"
                        onClick={handleClear}>X</button>
                </div>
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
        return (<div className="search-loading no-data">No results</div>);
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
            artists: [],
            selectedItem: null,
            detailLoading: false,
            detailTracks: []
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleSearchResults = this.handleSearchResults.bind(this);
        this.handleSearchDetailResults = this.handleSearchDetailResults.bind(this);
        this.handleClear = this.handleClear.bind(this);

        this.handleType = this.handleType.bind(this);
        this.handleArtistClick = this.handleArtistClick.bind(this);
        this.handleAlbumClick = this.handleAlbumClick.bind(this);
        this.handleDetailClose = this.handleDetailClose.bind(this);
    }

    componentDidMount() {
        this.props.socket.on("search", this.handleSearchResults);
        this.props.socket.on("albumTracks", this.handleSearchDetailResults);
        this.props.socket.on("artistTracks", this.handleSearchDetailResults);
    }

    handleClear() {
        this.setState({
            loading: false,
            tracks: [],
            albums: [],
            artists: [],
            selectedItem: null,
            detailLoading: false,
            detailTracks: [],
            search: ""
        });
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

    handleSearchDetailResults(searchResults) {
        if (searchResults.length > 0) {
            const { artUrl, name } = this.state.selectedItem;
            for (let key in searchResults) {
                searchResults[key].artUrl = artUrl;
                searchResults[key].albumName = name;
            }
        }
        this.setState({
            detailLoading: false,
            detailTracks: searchResults
        });
    }

    handleDetailClose() {
        this.setState({
            selectedItem: null,
            detailTracks: []
        });
    }

    handleChange(event) {
        this.setState({ search: event.target.value });
    }

    handleSubmit(event) {
        if (this.state.search !== '') {
            this.setState({
                loading: true,
                tracks: [],
                albums: [],
                artists: [],
                selectedItem: null,
                detailLoading: false,
                detailTracks: []
            });
            this.props.socket.emit("search", {
                query: this.state.search,
                type: this.state.type
            });
            event.preventDefault();
        }
    }

    handleArtistClick(artist) {
        document.getElementsByClassName("search-results")[0].scrollTop = 0;
        this.setState({
            detailLoading: true,
            selectedItem: artist
        });
        this.props.socket.emit("artistTopTracks", artist.uri);
    }

    handleAlbumClick(album) {
        document.getElementsByClassName("search-results")[0].scrollTop = 0;
        this.setState({
            detailLoading: true,
            selectedItem: album
        });
        this.props.socket.emit("albumTracks", album.uri);
    }

    handleType(type) {
        this.setState({ type, selectedItem: null });
    }

    render() {
        const {
            search,
            type,
            loading,
            tracks,
            albums,
            artists,
            selectedItem,
            detailLoading,
            detailTracks } = this.state;
        const { isSearching, onClick, onAddToQueue } = this.props;
        const closedClass = isSearching ? '' : 'closed';
        const detailClosedClass = selectedItem === null
            ? 'closed'
            : '';

        // Set data for main search results
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

        // Build main search results
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
                    handleClear={this.handleClear}
                    search={search}
                    handleType={this.handleType}
                    type={type} />
                <div className="search-results">
                    {
                        loading
                            ? <div className="search-loading">Loading...</div>
                            : searchResults
                    }
                    <div className={`search-results-detail ${detailClosedClass}`}>
                        <button
                            className="detail-close"
                            type="button"
                            onClick={this.handleDetailClose}>&lt; BACK</button>
                        <div className="search-loading">
                            {
                                selectedItem === null
                                    ? ''
                                    : selectedItem.name
                            }
                        </div>
                        <div className={detailLoading ? "search-loading" : ""}>
                            {
                                detailLoading
                                    ? "Loading..."
                                    : <SearchResults
                                        data={detailTracks}
                                        clickHandler={(track) => onAddToQueue(track)}
                                        type='track' />
                            }
                        </div>
                    </div>
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