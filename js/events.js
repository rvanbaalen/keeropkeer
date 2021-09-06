import { $ } from './utilities.js';

export const EVENTS = {
    GAME_NEW: 'game-new',
    GAME_START: 'game-start',
    GAME_CREATE_STATE: 'game-create-state',
    SCORE_RELOAD: 'score-reload',
    SCORE_TOTAL_TOGGLE: 'score-total-toggle',
    MODAL_TOGGLE: 'modal-toggle',
    MODAL_HIDE: 'modal-hide',
    MODAL_SHOW: 'modal-show',
    GRID_RENDER_COMPLETE: 'grid-render-complete',
    JOKER_SELECTED: 'joker-selected',
    STAR_SELECTED: 'star-selected',
    RENDER_TOTAL_SCORE: 'render-total-score',
    RENDER_LEVEL: 'render-level',
    LOADING: 'loading',
    SCORE_TOGGLE_COLUMN: 'score-toggle-column',
    NAVIGATE_FROM: 'navigate-from',
    NAVIGATE_TO: 'navigate-to',
    NAVIGATE: 'navigate',
    NAVIGATE_BACK: 'navigate-back',
    SCORE_COLUMN_CLAIM: 'score-column-claim',
    GRID_COLUMN_COMPLETE: 'grid-column-complete',
    BLOCK_SELECTED: 'block-selected'
};

const app = $('app');
const register = {};

export function dispatch(eventName, eventData) {
    let event = new CustomEvent(eventName, { detail: eventData });
    app.dispatchEvent(event);

    if (register[eventName]?.once) {
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
