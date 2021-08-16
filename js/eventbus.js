import { $ } from './utilities.js';

export const EVENTS = {
    GAME_NEW: 'new-game',
    GAME_RESET: 'state-reset',
    GAME_START: 'start-game',
    LEVEL_RESET: 'reset-level',
    LEVEL_SELECTED: 'level-selected',
    SCORE_SHOW: 'show-score',
    MODAL_TOGGLE: 'modal-toggle',
    MODAL_HIDE: 'modal-hide',
    MODAL_SHOW: 'modal-show',
    LOBBY_CREATED: 'lobby-created',
    LOBBY_JOINED: 'lobby-joined'
};
export function dispatch(eventName, eventData) {
    console.log('Fired event: ' + eventName, eventData);
    let event = new CustomEvent(eventName, { detail: eventData });
    $('app').dispatchEvent(event);
}
export function listen(eventName, callback) {
    $('app').addEventListener(eventName, callback, false);
}
export function registerEvents(events = []) {
    events.forEach(event => {
        listen(event.name, event.callback);
    });
}
