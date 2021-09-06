import {Engine} from "./Engine.js";
import {Block} from "./Block";

try {
    window.engine = new Engine();
} catch (err) {
    console.error('Failed to load game. Reset state!', err);
}

window.Block = Block;
