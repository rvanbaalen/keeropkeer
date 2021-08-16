import { $ } from './utilities.js';

export const EVENTS = {
    NEW_GAME: 'new-game',
    STATE_RESET: 'state-reset',
    GAME_START: 'start-game',
    RESET_LEVEL: 'reset-level',
    LEVEL_SELECTED: 'level-selected',
    SHOW_SCORE: 'show-score',
    TOGGLE_MODAL: 'toggle-modal'
};
export function dispatch(eventName, eventData) {
    let event = new CustomEvent(eventName, { detail: eventData });
    $('app').dispatchEvent(event);
}
export function listen(eventName, callback) {
    $('app').addEventListener(eventName, callback, false);
}
