import {Engine} from "./Engine.js";
import socket from "./socket.js";
try {
    new Engine();
} catch (err) {
    console.error('Failed to load game. Reset state!', err);
}

window.socket = socket;
