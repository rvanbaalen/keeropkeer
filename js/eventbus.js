import { $ } from './utilities.js';

export const EVENTS = {
    NEW_GAME: 'new-game'
};
export function dispatch(eventName, eventData) {
    let event = new CustomEvent(eventName, { detail: eventData });
    $('app').dispatchEvent(event);
}
export function listen(eventName, callback) {
    $('app').addEventListener(eventName, callback, false);
}
