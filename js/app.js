import {Engine} from "./Engine.js";
try {
    new Engine();
} catch (err) {
    console.error('Failed to load game. Reset state!', err);
}
