import { $ } from './utilities.js';

export const EVENTS = {
    GAME_CONNECTED: 'game-connected',
    GAME_NEW: 'game-new',
    GAME_START: 'game-start',
    GAME_CONTINUE: 'game-continue',
    GAME_CREATE_STATE: 'game-create-state',
    LEVEL_SELECT: 'level-select',
    LEVEL_LOADED: 'level-loaded',
    SCORE_RELOAD: 'score-reload',
    SCORE_TOTAL_TOGGLE: 'score-total-toggle',
    MODAL_TOGGLE: 'modal-toggle',
    MODAL_HIDE: 'modal-hide',
    MODAL_SHOW: 'modal-show',
    LOBBY_READY: 'lobby-ready',
    LOBBY_JOIN: 'lobby-join',
    LOBBY_JOIN_FAILED: 'lobby-join-failed',
    LOBBY_JOINED: 'lobby-joined',
    LOBBY_CREATED: 'lobby-created',
    LOBBY_DELETED: 'lobby-deleted',
    PLAYER_REGISTERED: 'player-registered',
    PLAYER_REGISTRATION_FAILED: 'player-registration-failed',
    PLAYER_DELETED: 'player-deleted',
    GRID_BLOCK_SELECTED: 'grid-block-selected',
    GRID_COLUMN_COMPLETE: 'grid-column-complete',
    ENGINE_GRID_RENDER_COMPLETE: 'grid-render-complete',
    JOKER_SELECTED: 'joker-selected',
    STAR_SELECTED: 'star-selected',
    RENDER_JOKER_SCORE: 'render-joker-score',
    RENDER_BONUS_SCORE: 'render-bonus-score',
    RENDER_COLUMN_SCORE: 'render-column-score',
    RENDER_STAR_SCORE: 'render-star-score',
    RENDER_TOTAL_SCORE: 'render-total-score',
    RENDER_LEVEL: 'render-level',
    RENDER_SCORES: 'render-scores',
    LOADING: 'loading',
    LOADING_DONE: 'loading-done',
    PLAYER_JOINED: 'player-joined',
    LEVEL_SELECT_DOM: 'level-select-dom',

};

const app = $('app');
const register = {};

export function dispatch(eventName, eventData) {
    console.info('Fired event: ' + eventName, eventData);
    let event = new CustomEvent(eventName, { detail: eventData });
    app.dispatchEvent(event);

    if (register[eventName]?.once) {
        console.log('remove listener for ', eventName);
        app.removeEventListener(eventName, register[eventName].callback, false);
    }
}
export function listen(eventName, callback, once = false) {
    app.addEventListener(eventName, callback, false);

    if (once) {
        register[eventName] = {once: true, callback};
    }
}
export function listenOnce(eventName, callback) {
    return listen(eventName, callback, true);
}


// Debugging purposes.
window.EVENTS = EVENTS;
window.dispatch = dispatch;
window.listen = listen;
