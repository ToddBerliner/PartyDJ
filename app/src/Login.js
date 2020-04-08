import React, { Component } from "react";
import * as $ from "jquery";
import './App.css';
import {
    authEndpoint,
    clientId,
    serverRedirectUri,
    scopes,
    responseType,
    showDialog
} from './config.js';

const hash = window.location.hash
    .substring(1)
    .split("&")
    .reduce(function (initial, item) {
        if (item) {
            var parts = item.split("=");
            initial[parts[0]] = decodeURIComponent(parts[1]);
        }
        return initial;
    }, {});

class Login extends Component {

    constructor() {
        super();
        this.state = {
            token: null,
            devices: []
        }
        this.selectDevice = this.selectDevice.bind(this);
        this.getDevices = this.getDevices.bind(this);
        window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${serverRedirectUri}&scope=${scopes.join("%20")}&response_type=${responseType}&show_dialog=${showDialog}`;
    }

    selectDevice(deviceId) {
        this.props.handleLogin(this.state.token, deviceId);
    }

    getDevices() {
        $.ajax({
            url: "https://api.spotify.com/v1/me/player/devices",
            type: "GET",
            beforeSend: (xhr) => {
                xhr.setRequestHeader("Authorization", "Bearer " + this.state.token);
            },
            success: function (data) {
                if (data) {
                    this.setState({
                        devices: data.devices
                    });
                }
            },
            context: this,
            error: function (xhr, status, error) {
                alert(error);
            }
        });
    }

    componentDidMount() {
        // Check for Spotify token
        let _token = hash.access_token;
        if (_token) {
            this.setState({
                token: _token,
            }, () => {
                this.getDevices();
            });
        }
    }

    render() {
        return this.state.token
            ? (<DeviceSelect
                devices={this.state.devices}
                selectDevice={this.selectDevice}
            />)
            : (<LoginBtn />);
    }
}

const LoginBtn = () => {
    return (
        <div className="App Login">
            <a
                className="btn btn--loginApp-link"
                href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${serverRedirectUri}&scope=${scopes.join("%20")}&response_type=${responseType}&show_dialog=${showDialog}`}
            >

                Login to Spotify
             </a>
        </div>
    );
}

const DeviceSelect = ({ devices, selectDevice }) => {
    const deviceItems = devices.map((device, index) => {
        return (
            <button
                className="btn btn--loginApp-link device"
                key={index}
                onClick={() => {
                    selectDevice(device.id);
                }} >{device.name} {device.type}</button>
        );
    })
    return (
        <div className="App Login">
            <div className="section-title">Select a Device</div>
            {deviceItems}
        </div>
    );
}


export default Login;