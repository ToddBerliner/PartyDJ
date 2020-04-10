import React, {Component} from 'react';
class SpotPlayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            token: props.token
        }
    }

    render() {
        return (
            <>
                <script src="https://sdk.scdn.co/spotify-player.js"></script>
            </>
        );
    }
}
export default SpotPlayer;