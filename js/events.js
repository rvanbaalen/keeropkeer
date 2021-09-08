import { $ } from './utilities.js';

export const EVENTS = {
    GAME_NEW: 'game-new',
    GAME_START: 'game-start',
    GAME_CREATE_STATE: 'game-create-state',
    SCORE_RELOAD: 'score-reload',
    SCORE_TOTAL_TOGGLE: 'score-total-toggle',
    MODAL_HIDE: 'modal-hide',
    MODAL_SHOW: 'modal-show',
    JOKER_SELECTED: 'joker-selected',
    STAR_SELECTED: 'star-selected',
    RENDER_LEVEL: 'render-level',
    NAVIGATE: 'navigate',
    NAVIGATE_BACK: 'navigate-back',
    SCORE_COLUMN_UPDATE: 'score-column-update',
    SCORE_COLOR_UPDATE: 'score-color-update',
    UPDATE_GRID_BLOCK: 'update-grid-block'
};

const app = $('app');
export function dispatch(eventName, eventData) {
    let event = new CustomEvent(eventName, { detail: eventData });
    app.dispatchEvent(event);
}
export function listen(eventName, callback, once = false) {
    app.addEventListener(eventName, callback, false);
}
