import { $ } from './utilities.js';

export const EVENTS = {
    GAME_NEW: 'new-game',
    GAME_RESET: 'state-reset',
    GAME_START: 'start-game',
    LEVEL_RESET: 'reset-level',
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

};
export function dispatch(eventName, eventData) {
    console.log('Fired event: ' + eventName, eventData);
    let event = new CustomEvent(eventName, { detail: eventData });
    $('app').dispatchEvent(event);
}
export function listen(eventName, callback) {
    $('app').addEventListener(eventName, callback, false);
}

// Debugging purposes.
window.EVENTS = EVENTS;
window.dispatch = dispatch;
window.listen = listen;
