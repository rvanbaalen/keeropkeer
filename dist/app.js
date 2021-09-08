/**
 * Shorthand function for document.getElementById()
 * @param id
 * @returns {HTMLElement}
 */
function $(id) {
    return document.getElementById(id);
}

/**
 * Create a random string with given length
 * @param length The length of the string
 * @returns {string}
 */
function randomString(length = 6) {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, length);
}

/**
 * Shorthand function for document.querySelectorAll.forEach
 * @param query
 * @param callback
 */
function forEachQuery(query, callback) {
    Array.prototype.forEach.call(
        document.querySelectorAll(query), callback
    );
}

/**
 * Render template strings into actual node elements
 * @param tpl Template string
 * @returns {Element}
 */
function R(tpl) {
    const tmp = document.createElement('div');
    tmp.innerHTML = tpl;
    return tmp.firstElementChild;
}

var nl = {
    modal: {
        newGame: {
            body: 'Weet je zeker dat je een nieuw spel wil beginnen?'
        }
    },
    label: {
        cancel: 'Annuleren',
        ok: 'OK',
        newGame: 'Nieuw spel',
        bonus: 'bonus',
        columns: 'A-O',
        stars: 'Sterren',
        totals: 'Totaal',
        jokers: 'Jokers',
        startGame: 'Start Spel'
    },
    messages: {
        connecting: 'Bezig met verbinden ...'
    },
    notification: {
        landscapeMode: 'Draai het scherm horizontaal om te beginnen.',
        selectLevel: 'Selecteer een level.',
        playerName: 'Wat is je naam?',
        createLobby: 'Kies een spelcode:',
        creatingLobby: 'Bezig met het aanmaken van de lobby...',
        playerJoined: {
            title: 'Een speler is verbonden',
            message(username = 'onbekend') { return `${username} speelt mee!`; }
        }
    }
};

let lang = 'nl';
document.querySelector('body').classList.add('lang-' + lang);

// Use a switch with predefined dynamic imports so rollup knows whats going on
// let language;
// switch (lang) {
//     case 'nl':
//     default:
//     language = import('./nl.js').default;
// }
// TODO: figure out how to make dynamic imports work in Rollup

const language = nl;

const EVENTS = {
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
function dispatch(eventName, eventData) {
    let event = new CustomEvent(eventName, { detail: eventData });
    app.dispatchEvent(event);
}
function listen(eventName, callback, once = false) {
    app.addEventListener(eventName, callback, false);
}

const SOCKET_SERVER = 'https://dry-peak-80209.herokuapp.com/' ;

const io = window.io;
const socket = io(SOCKET_SERVER, { autoConnect: false });

socket.onAny((event, ...args) => {
    //console.log(event, args);
});

function registerModalEvents() {
    listen(EVENTS.MODAL_HIDE, event => {
        const {modalId} = event.detail, element = $(modalId);
        if (element && element.classList.contains('show')) {
            element.classList.remove('show');
        }

        if (element.dataset.selfdestruct) {
            element.remove();
        }
    });
    listen(EVENTS.MODAL_SHOW, event => {
        const {modalId} = event.detail;
        if ($(modalId) && !$(modalId).classList.contains('show')) {
            $(modalId).classList.add('show');
        }
    });
}

class Modals {
    static newGame({modalId = 'newGameModal', message, emit = false} = {}) {
        if (!modalId) {
            modalId = `modal_${randomString(8)}`;
        }

        return createNewModal({
            id: modalId,
            visible: true,
            selfDestruct: true,
            message: message || language.modal.newGame.body,
            buttons: {
                cancel: {
                    id: modalId + 'Cancel',
                    label: language.label.cancel,
                    callback(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        dispatch(EVENTS.MODAL_HIDE, {modalId});
                    }
                },
                ok: {
                    id: modalId + 'Confirm',
                    label: language.label.ok,
                    callback(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        // hide the modal first
                        dispatch(EVENTS.MODAL_HIDE, {modalId});
                        // Reset the game
                        dispatch(EVENTS.GAME_NEW);
                        if (emit) socket.emit('game:new');
                    }
                }
            }
        });
    }
    static showNewGameModal({modalId = 'newGameModal', message, emit = false} = {}) {
        Modals.newGame({modalId, message, emit});
        dispatch(EVENTS.MODAL_SHOW, {modalId});
    }
}


function createNewModal(options) {
    const defaultOptions = {
        id: 'modal-' + randomString(),
        message: 'No modal message is set.',
        buttons: false,
        appendTo: '#app',
        visible: false
    };
    let opts = {...defaultOptions, ...options};

    if (opts.buttons === true) {
        opts.buttons = {
            cancel: {
                id: opts.id + '-cancel',
                label: language.label.cancel
            },
            ok: {
                id: opts.id + '-ok',
                label: language.label.ok
            }
        };
    }

    const modalTemplate = `
        <div class="modal-overlay${opts.visible ? ' show' : ''}" id="${opts.id}"${opts.selfDestruct ? ' data-selfDestruct="true"' : ''}>
            <div class="modal-container">
                ${opts.title ? `
                <div class="modal-title">
                    <h2>${opts.title}</h2>
                </div>
                ` : ``}
                ${opts.body && !opts.message ? opts.body : `
                <div class="modal-body">
                    <p>${opts.message}</p>
                </div>
                `}
                ${opts.buttons ? `
                <div class="modal-button-bar">
                    ${opts.buttons.cancel ? `<a href="#" id="${opts.buttons.cancel.id}" class="button button-cancel">${opts.buttons.cancel.label}</a>` : ``}
                    ${opts.buttons.ok ? `<a href="#" id="${opts.buttons.ok.id}" class="button button-confirm">${opts.buttons.ok.label}</a>` : ``}
                </div>
                ` : ``}
            </div>
        </div>
    `;

    let modal = R(modalTemplate);
    if (opts.buttons.cancel && typeof opts.buttons.cancel.callback === 'function') {
        modal.querySelector('#' + opts.buttons.cancel.id).addEventListener('click', opts.buttons.cancel.callback, false);
    }
    if (opts.buttons.ok && typeof opts.buttons.ok.callback === 'function') {
        modal.querySelector('#' + opts.buttons.ok.id).addEventListener('click', opts.buttons.ok.callback, false);
    }

    $('app').append(modal);

    return modal;
}

class GameStorage {
    static prefix = 'kok_';

    static removeItem(key) {
        return localStorage.removeItem(GameStorage.prefix + key);
    }

    static setItem(key, value = '') {
        return localStorage.setItem(GameStorage.prefix + key, JSON.stringify(value));
    }

    static getItem(key, defaultValue = false) {
        let value = localStorage.getItem(GameStorage.prefix + key);

        if (value === null) {
            return defaultValue;
        }

        return JSON.parse(value);
    }
}

/** Keeps track of raw listeners added to the base elements to avoid duplication */
const ledger = new WeakMap();
function editLedger(wanted, baseElement, callback, setup) {
    var _a, _b;
    if (!wanted && !ledger.has(baseElement)) {
        return false;
    }
    const elementMap = (_a = ledger.get(baseElement)) !== null && _a !== void 0 ? _a : new WeakMap();
    ledger.set(baseElement, elementMap);
    if (!wanted && !ledger.has(baseElement)) {
        return false;
    }
    const setups = (_b = elementMap.get(callback)) !== null && _b !== void 0 ? _b : new Set();
    elementMap.set(callback, setups);
    const existed = setups.has(setup);
    if (wanted) {
        setups.add(setup);
    }
    else {
        setups.delete(setup);
    }
    return existed && wanted;
}
function isEventTarget(elements) {
    return typeof elements.addEventListener === 'function';
}
function safeClosest(event, selector) {
    let target = event.target;
    if (target instanceof Text) {
        target = target.parentElement;
    }
    if (target instanceof Element && event.currentTarget instanceof Element) {
        // `.closest()` may match ancestors of `currentTarget` but we only need its children
        const closest = target.closest(selector);
        if (closest && event.currentTarget.contains(closest)) {
            return closest;
        }
    }
}
// This type isn't exported as a declaration, so it needs to be duplicated above
function delegate(base, selector, type, callback, options) {
    // Handle Selector-based usage
    if (typeof base === 'string') {
        base = document.querySelectorAll(base);
    }
    // Handle Array-like based usage
    if (!isEventTarget(base)) {
        const subscriptions = Array.prototype.map.call(base, (element) => {
            return delegate(element, selector, type, callback, options);
        });
        return {
            destroy() {
                for (const subscription of subscriptions) {
                    subscription.destroy();
                }
            }
        };
    }
    // `document` should never be the base, it's just an easy way to define "global event listeners"
    const baseElement = base instanceof Document ? base.documentElement : base;
    // Handle the regular Element usage
    const capture = Boolean(typeof options === 'object' ? options.capture : options);
    const listenerFn = (event) => {
        const delegateTarget = safeClosest(event, selector);
        if (delegateTarget) {
            event.delegateTarget = delegateTarget;
            callback.call(baseElement, event);
        }
    };
    const setup = JSON.stringify({ selector, type, capture });
    const isAlreadyListening = editLedger(true, baseElement, callback, setup);
    const delegateSubscription = {
        destroy() {
            baseElement.removeEventListener(type, listenerFn, options);
            editLedger(false, baseElement, callback, setup);
        }
    };
    if (!isAlreadyListening) {
        baseElement.addEventListener(type, listenerFn, options);
    }
    return delegateSubscription;
}

class Block {
    template = false;
    state = {};

    constructor({letter, row, color, selected = false, element}) {
        this.template = element;
        this.letter = letter;
        this.row = row;
        this.color = color;
        this.selected = selected;
    }

    /**
     * @returns {string}
     */
    get letter() {
        return this.state?.letter;
    }

    /**
     * @returns {int}
     */
    get row() {
        return this.state?.row;
    }

    /**
     * @returns {string}
     */
    get color() {
        return this.state?.color;
    }

    /**
     * @returns {boolean}
     */
    get selected() {
        return !!this.state?.selected;
    }

    /**
     * @param {string} value
     */
    set letter(value) {
        this.state.letter = value;
    }

    /**
     * @param {int} value
     */
    set row(value) {
        this.state.row = parseInt(value);
    }

    /**
     * @param {string} value
     */
    set color(value) {
        this.state.color = value;
    }

    /**
     * @param {boolean} value
     */
    set selected(value) {
        const currentState = this.state.selected;
        if (value !== currentState) {
            this.state.selected = !!value;
            this.onSelected();
        }
    }

    get selectedClass() {
        return 'selected';
    }

    onSelected() {
        if (this.element && this.selected) {
            // Add class
            this.element.classList.add(this.selectedClass);
        }
        if (this.element && !this.selected) {
            this.element.classList.remove(this.selectedClass);
        }
    }

    /**
     * @param {string} tpl
     */
    set element(tpl) {
        if (typeof tpl === 'string') tpl = R(tpl);
        this.template = tpl;
    }

    /**
     * @returns {Element}
     */
    get element() {
        return this.template;
    }

    /**
     * @returns {string}
     */
    render() {
        // Create the block, add event listeners
        const tpl = `
            <span 
                class="score-block${this.selected ? ' selected' : ''}" 
                data-letter="${this.letter}" 
                data-row="${this.row}" 
                data-color="${this.color}">
            </span>
        `;

        this.element = tpl;
        return tpl;
    }

    /**
     * @param element
     * @returns {Block}
     */
    static getInstance(element) {
        if (typeof element === 'string') element = document.querySelector(element);
        if (element.length > 1) element = element[0];

        const selected = element.classList.contains('selected');
        const {letter, row, color} = element.dataset;
        return new Block({letter, row, color, selected});
    }

    static getByProperties({letter, row}) {
        return document.querySelector(`[data-letter="${letter}"][data-row="${row}"]`);
    }
}

class GridBlock extends Block {
    constructor({letter, row, color, star = false, selected = false, element}) {
        super({letter, row, color, selected, element});
        this.state.star = star;
    }

    render() {
        // Create the block, add event listeners
        const tpl = `
            <span 
                class="score-block${this.selected ? ' selected' : ''}"
                data-type="score-block" 
                data-letter="${this.letter}" 
                data-row="${this.row}" 
                data-color="${this.color}">
                ${this.star ? `<span class="star">*</span>` : ''}    
            </span>
        `;

        this.element = tpl;

        delegate('#app', `[data-type="score-block"][data-letter="${this.letter}"][data-row="${this.row}"]`, 'click', event => {
            this.refresh();
            this.onClick({event});
        });

        return tpl;
    }

    refresh() {
        this.element = document.querySelector(`[data-type="score-block"][data-letter="${this.letter}"][data-row="${this.row}"]`);
    }

    onClick({event}) {
        event.preventDefault();
        event.stopPropagation();

        // Update selected state
        this.selected = !this.selected;

        // Save new block state to game cache
        dispatch(EVENTS.UPDATE_GRID_BLOCK, {gridBlock: this});

        // Check if row is completed
        Grid.setColumnScoreState({letter: this.letter, shouldEmit: true});

        // Check if color is completed
        Grid.setColorScoreState({color: this.color, shouldEmit: true});

        dispatch(EVENTS.SCORE_COLUMN_UPDATE);
        dispatch(EVENTS.SCORE_COLOR_UPDATE);
        //Grid.coloredBlockHandler({block:this.element, event, currentGame: this.currentGame});
    }

    get star() {
        return this.state?.star;
    }

    set star(value) {
        this.state.star = !!value;
    }

    onSelected() {
        super.onSelected();
        if (this.star) {
            dispatch(EVENTS.STAR_SELECTED, {selected: this.selected, block: this});
        }
    }

    /**
     * @param element
     * @returns {GridBlock}
     */
    static getInstance(element) {
        if (typeof element === 'string') element = document.querySelector(element);
        if (element.length > 1) element = element[0];

        const star = !!element.querySelector('span.star');
        const selected = element.classList.contains('selected');
        const {letter, row, color} = element.dataset;
        return new GridBlock({letter, row, color, star, selected, element});
    }
}

class ScoreBlock extends Block {
    static TYPE_COLUMN_SCORE = 'column-score';
    static TYPE_COLOR_SCORE = 'color-score';
    static TYPE_JOKER = 'joker';

    #DEFAULT_VALUE = 0;

    constructor({
                    letter,
                    row,
                    color,
                    selected = false,
                    element,
                    value = 0,
                    type
                }) {
        super({letter, row, color, selected, element});

        this.type = type;
        this.value = value;
    }

    /**
     * @param {number} value
     */
    set value(value) {
        if (isNaN(value)) value = this.#DEFAULT_VALUE;
        this.state.value = value;
    }

    /**
     * @returns {number}
     */
    get value() {
        return this.state?.value || this.#DEFAULT_VALUE;
    }

    /**
     * @param {string} value
     */
    set type(value) {
        this.state.type = value;
    }

    /**
     * @returns {string}
     */
    get type() {
        return this.state?.type;
    }
}

class ColumnScoreBlock extends ScoreBlock {
    static STATE = {
        DEFAULT: 'default',
        ACTIVE: 'active',
        TAKEN: 'taken'
    };

    cache;

    constructor({state = ColumnScoreBlock.STATE.DEFAULT, letter, row = -1, color = 'white', selected = false, element, value = 0, type = ScoreBlock.TYPE_COLUMN_SCORE }) {
        super({ letter, row, color, selected, element, value, type });
        if (!letter || row === -1) {
            throw new Error('Need letter and row for new block instance.');
        }

        // Try to load a cached state.
        let cachedState = this.storage[letter + row];
        state = (cachedState !== ColumnScoreBlock.STATE.DEFAULT) ? cachedState : state;

        this.blockState = state;
    }

    get blockStateKey() {
        return this.letter + this.row;
    }

    set storage(value) {
        GameStorage.setItem('columnScore', value);
        this.cache = value;
    }

    get storage() {
        return (!this.cache) ? GameStorage.getItem('columnScore', {}) : this.cache;
    }

    static clearStorage() {
        GameStorage.removeItem('columnScore');
    }

    set blockState(value) {
        value = (Object.values(ColumnScoreBlock.STATE).indexOf(value) === -1) ? ColumnScoreBlock.STATE.DEFAULT : value;

        this.state.blockState = value;
        if (this.element) {
            Object.values(ColumnScoreBlock.STATE).forEach(className => this.element.classList.remove(className));
            this.element.classList.add(value);
        }

        // Save state.
        let storage = this.storage;
        storage[this.blockStateKey] = value;
        this.storage = storage;
    }

    get blockState() {
        // default, active, or taken
        return this.state?.blockState;
    }

    render() {
        const tpl = `
            <span 
                class="rounded-block column-score" 
                data-letter="${this.letter}" 
                data-row="${this.row}"
                data-type="${this.type}">
                    ${this.value}
            </span>
        `;
        this.element = tpl;

        delegate('#app', `[data-type="${this.type}"][data-letter="${this.letter}"][data-row="${this.row}"]`, 'click', event => {
            this.onClick({event});
        });

        return tpl;
    }

    toggleState() {
        switch (this.blockState) {
            case ColumnScoreBlock.STATE.DEFAULT:
                // Toggle selected
                this.active();
                break;
            case ColumnScoreBlock.STATE.ACTIVE:
                // Toggle to taken
                if (this.row > 0) this.default();
                else this.taken();
                break;
            case ColumnScoreBlock.STATE.TAKEN:
                // Toggle to default
                this.default();
                break;
        }
    }

    isHighScore() {
        return this.row === 0;
    }

    isTaken() {
        return this.blockState === ColumnScoreBlock.STATE.TAKEN;
    }

    isActive() {
        return this.blockState === ColumnScoreBlock.STATE.ACTIVE;
    }

    taken() {
        this.blockState = ColumnScoreBlock.STATE.TAKEN;
    }

    active() {
        this.blockState = ColumnScoreBlock.STATE.ACTIVE;
    }

    default() {
        this.blockState = ColumnScoreBlock.STATE.DEFAULT;
    }

    onClick({event}) {
        event.preventDefault();
        event.stopPropagation();

        this.refresh();
        this.toggleState();
    }

    refresh() {
        this.element = ColumnScoreBlock.getElementByProperties({letter: this.letter, row: this.row});
        this.state.blockState = ColumnScoreBlock.getStateFromClassList(this.element);
    }

    static getStateFromClassList(element) {
        if (element.classList.contains('active')) {
            return ColumnScoreBlock.STATE.ACTIVE;
        }
        if (element.classList.contains('taken')) {
            return ColumnScoreBlock.STATE.TAKEN;
        }

        return ColumnScoreBlock.STATE.DEFAULT;
    }

    static getInstance(element) {
        if (typeof element === 'string') element = document.querySelector(element);
        if (element.length > 1) element = element[0];

        const {letter, row, color} = element.dataset;
        return new ColumnScoreBlock({letter, row, color, element});
    }

    static getElementByProperties({letter, row = 0}) {
        return document.querySelector(`[data-type="${ScoreBlock.TYPE_COLUMN_SCORE}"][data-letter="${letter}"][data-row="${row}"]`);
    }

    /**
     * @param letter
     * @returns {ColumnScoreBlock}
     */
    static getFirstAvailable({letter}) {
        const element = document.querySelector(`[data-type="${ScoreBlock.TYPE_COLUMN_SCORE}"][data-letter="${letter}"]:not(.${ColumnScoreBlock.STATE.ACTIVE}):not(.${ColumnScoreBlock.STATE.TAKEN})`);
        if (element) {
            return ColumnScoreBlock.getInstance(element);
        }

        return false;
    }

    static getAll({letter}) {
        return [...document.querySelectorAll(`[data-type="${ScoreBlock.TYPE_COLUMN_SCORE}"][data-letter="${letter}"]`)].map(el => ColumnScoreBlock.getInstance(el));
    }
}

class ColorScoreBlock extends ColumnScoreBlock {
    constructor({state = ColumnScoreBlock.STATE.DEFAULT, color = 'white', element, value = 0 }) {
        const letter = color, row = parseInt(value), selected = false;
        super({ letter, row, color, selected, element, value: parseInt(value), type: ScoreBlock.TYPE_COLOR_SCORE, state });
        if (!color || value < 0) {
            throw new Error('Need color and value for new ColorScoreBlock instance.');
        }
    }

    render() {
        const tpl = `<span class="score-block final-score${this.blockState !== ColumnScoreBlock.STATE.DEFAULT ? ' ' + this.blockState : ''}" data-color="${this.color}" data-type="${this.type}" data-value="${this.value}"><span>${this.value}</span></span>`;
        this.element = tpl;

        delegate('#app', `[data-type="${this.type}"][data-color="${this.color}"][data-value="${this.value}"]`, 'click', event => {
            this.onClick({event});
        });

        return tpl;
    }

    refresh() {
        this.element = ColorScoreBlock.getElementByProperties({color: this.color, value: this.value});
        this.state.blockState = ColorScoreBlock.getStateFromClassList(this.element);
    }

    isHighScore() {
        return this.value === 5;
    }

    toggleState() {
        const state = this.blockState;
        if (state === ColorScoreBlock.STATE.DEFAULT) {
            this.active();
            return;
        }

        if (state === ColorScoreBlock.STATE.ACTIVE) {
            this.taken();
            return;
        }

        if (state === ColorScoreBlock.STATE.TAKEN) {
            this.default();
            return;
        }

        this.default();
    }

    static getInstance(element) {
        if (typeof element === 'string') element = document.querySelector(element);
        if (element.length > 1) element = element[0];

        const {value, color} = element.dataset;
        return new ColorScoreBlock({color, value, element});
    }

    static getElementByProperties({color, value = 0}) {
        return document.querySelector(`[data-type="${ScoreBlock.TYPE_COLOR_SCORE}"][data-color="${color}"][data-value="${value}"]`);
    }

    static getAll({color, value = 5}) {
        return [...document.querySelectorAll(`[data-type="${ScoreBlock.TYPE_COLOR_SCORE}"][data-value="${value}"][data-color="${color}"]`)].map(el => ColorScoreBlock.getInstance(el));
    }

    /**
     * @param letter
     * @returns {ColumnScoreBlock}
     */
    static getFirstAvailable({color}) {
        const element = document.querySelector(`[data-type="${ScoreBlock.TYPE_COLOR_SCORE}"][data-color="${color}"]:not(.${ColorScoreBlock.STATE.ACTIVE}):not(.${ColorScoreBlock.STATE.TAKEN})`);
        if (element) {
            return ColorScoreBlock.getInstance(element);
        }

        return false;
    }

    set storage(value) {
        GameStorage.setItem('colorScore', value);
    }

    get storage() {
        return GameStorage.getItem('colorScore', {});
    }

    static clearStorage() {
        GameStorage.removeItem('colorScore');
    }
}

class JokerScoreBlock extends ScoreBlock {
    constructor({
        joker,
        row,
        element
    }) {
        const letter = "X",
            color = "green",
            value = 0,
            type = ScoreBlock.TYPE_JOKER,
            selected = joker.selected || false;

        super({letter, row, color, selected, element, value, type});
    }

    render() {
        // Create the block, add event listeners
        const tpl = `<span class="joker${this.selected ? ' used' : ''}" data-type="joker" data-row="${this.row}">!</span>`;
        this.element = tpl;

        delegate('#app', `[data-type="joker"][data-row="${this.row}"]`, 'click', event => {
            this.refresh();
            this.onClick({event});
        });

        return tpl;
    }

    refresh() {
        this.element = document.querySelector(`[data-type="joker"][data-row="${this.row}"]`);
    }

    get selectedClass() {
        return 'used';
    }

    onClick({event}) {
        event.preventDefault();
        event.stopPropagation();

        this.selected = !this.selected;

        dispatch(EVENTS.JOKER_SELECTED, {joker: this});
    }
}

class Grid {
    static setColumnScoreState({letter, shouldEmit = false})  {
        if (Grid.isColumnComplete({letter})) {
            Grid.toggleCompletedColumn({letter, shouldEmit});
        } else {
            // Column is not complete
            Grid.clearColumnScore({letter, shouldEmit});
        }
    }
    static toggleCompletedColumn({letter, shouldEmit = false}) {
        let activateBlock = ColumnScoreBlock
            .getAll({letter})
            .filter(block => block.isActive())
            .length === 0;

        let block = ColumnScoreBlock.getFirstAvailable({letter});
        if (activateBlock && block !== false) {
            block?.active();

            if (block.isHighScore() && shouldEmit) {
                socket.emit('grid:column-complete', {letter});
            }
        }
    }
    static clearColumnScore({letter, shouldEmit = false}) {
        ColumnScoreBlock.getAll({letter})
            .forEach(block => {
                if (block.isActive()) {
                    block.default();
                    if (block.isHighScore() && shouldEmit) {
                        socket.emit('grid:column-clear', {letter});
                    }
                }
            });
    }

    static isColumnComplete({letter}) {
        const columnElement = document.querySelectorAll(`[data-letter="${letter}"]`)[0]?.parentElement;
        const selectedBlocks = columnElement.querySelectorAll('.score-block.selected').length;

        return selectedBlocks === 7;
    }

    static setColorScoreState({color, shouldEmit = false}) {
        if (Grid.isColorComplete({color})) {
            Grid.toggleCompletedColor({color, shouldEmit});
        } else {
            Grid.clearColorScore({color, shouldEmit});
        }
    }
    static isColorComplete({color}) {
        const coloredBlocks = document.querySelectorAll(`[data-color="${color}"][data-type="score-block"]`);
        const selectedBlocks = document.querySelectorAll(`[data-color="${color}"][data-type="score-block"].selected`);

        return coloredBlocks.length === selectedBlocks.length;
    }
    static toggleCompletedColor({color, shouldEmit = false}) {
        let activateBlock = ColorScoreBlock
            .getAll({color})
            .filter(block => block.isActive())
            .length === 0;

        let block = ColorScoreBlock.getFirstAvailable({color});
        if (activateBlock && block !== false) {
            block?.active();

            if (block.isHighScore() && shouldEmit) {
                socket.emit('grid:color-complete', {color});
            }
        }
    }
    static clearColorScore({color, shouldEmit = false}) {
        ColorScoreBlock.getAll({color})
            .forEach(block => {
                if (block.isActive()) {
                    block.default();
                    if (block.isHighScore() && shouldEmit) {
                        socket.emit('grid:color-clear', {color});
                    }
                }
            });
    }
}

class Layout {
    static render() {
        return `
            ${ Layout.renderViewGame() }
            ${ Layout.renderViewLevelSelect() }
        `;
    }

    static applicationWindow(id, content) {
        return `
            <div id="${id}" class="applicationWindow hidden">${content}</div>
        `;
    }

    static renderViewGame() {
        return Layout.applicationWindow('gameView', `
            <div class="gameViewRows">
                <div class="columns">
                    <div class="jokers" id="jokerContainer"></div>
                    <div id="blockGrid"></div>
                    <div class="scoreContainer">
                        <div class="column" id="scoreColumn">
                            <div id="scoreColumn1"></div>
                        </div>
                        <div class="column" id="scoreColumn2"></div>
                    </div>
                </div>
                <div id="gameData">
                    <div>
                        <h2 class="rainbow">Spelers</h2>
                        <ul id="activePlayers" class="blockList playerList"></ul>
                    </div>
                    <a id="newGameButton">Nieuw spel</a>
                </div>
            </div>
       `);
    }

    static renderViewChangeLobby() {
        return Layout.applicationWindow('changeLobby', `
            <div class="gameViewRows">
                <div class="columns">
                    <div class="jokers" id="jokerContainer"></div>
                    <div id="blockGrid"></div>
                    <div class="scoreContainer">
                        <div class="column" id="scoreColumn">
                            <div id="scoreColumn1"></div>
                        </div>
                        <div class="column" id="scoreColumn2"></div>
                    </div>
                </div>
                <div id="gameData">
                    <ul id="activePlayers" class="blockList playerList"></ul>
                    <a id="newGameButton">Nieuw spel</a>
                </div>
            </div>
       `);
    }

    static renderViewLevelSelect() {
        return Layout.applicationWindow('levelSelect', `
            <div id="playerContainer">
                <h2 class="rainbow">Spelers</h2>
                <ul id="players" class="blockList playerList"></ul>
                <h2 class="rainbow">Lobby</h2>
                <a href="#" id="lobbyCode">Cool</a>
            </div>
            <div id="levelContainer">
                <h2 class="rainbow">Selecteer een level</h2>
                <ul id="levels" class="blockList">
                    <li class="level">
                        <a href="#" class="level1" data-level="level1">
                            <img src="/images/level1.png" alt="level1" />
                            <span class="label">Level 1</span>
                        </a>
                    </li>
                    <li class="level">
                        <a href="#" class="level2" data-level="level2">
                            <img src="/images/level2.png" alt="level2" />
                            <span class="label">Level 2</span>
                        </a>
                    </li>
                    <li class="level">
                        <a href="#" class="level3" data-level="level3">
                            <img src="/images/level3.png" alt="level3" />
                            <span class="label">Level 3</span>
                        </a>
                    </li>
                    <li class="level">
                        <a href="#" class="level4" data-level="level4">
                            <img src="/images/level4.png" alt="level4" />
                            <span class="label">Level 4</span>
                        </a>
                    </li>
                </ul>
            </div>
        `);
    }

    static renderPlayer({player}) {
        return `<li class="player" data-player="${player.username}" data-player-id="${player.userId}">${player.username}</li>`;
    }
    static renderPlayerAvatar({url, playerName}) {
        return `<img src="${url}" alt="${playerName}"/><span>${playerName}</span>`;
    }
    static renderJokers({jokers}) {
        $('jokerContainer').innerHTML = jokers
            .map((joker, index) => new JokerScoreBlock({joker, row: index}).render())
            .join('');
    }
    static renderGrid({columns}) {
        const blockGrid = $('blockGrid');
        blockGrid.innerHTML = '';
        columns.forEach(column => {
            blockGrid.append(Layout.renderGridColumn({column}));
            Grid.setColumnScoreState({letter: column.column, shouldEmit: false});
        });
    }
    static renderGridColumn({column}) {
        const letter = column.column;
        return R(`
            <div class="column${column.column === 'H' ? ' highlight' : ''}">
                <span class="rounded-block header" data-letter="${letter}">${letter}</span>
                ${ Layout.renderGridColumnBlocks({blocks: column.grid, column}) }
                ${ Layout.renderColumnScores({column}) }
            </div>
        `);
    }
    static renderGridColumnBlocks({blocks, column}) {
        return blocks.map((block, index) => {
            return new GridBlock({
                letter: column.column,
                row: index,
                color: block.color,
                star: block.star,
                selected: block.selected
            }).render();
        }).join('')
    }
    static renderColumnScores({column}) {
        return `<div class="column-score">${
            column.score.map((scoreObject, row) => {
                const {value, state} = scoreObject, 
                    letter = column.column;
                return new ColumnScoreBlock({ letter, row, value, state }).render();
            }).join('') 
        }</div>`;
    }
}

class Lobby {
    #lobby = false;
    state = false;

    constructor(lobbyData) {
        this.lobby = lobbyData;

        socket.on('player:stats', ({player}) => {
            Lobby.setLobbyCodeDom({code: player.lobbyCode});
        });

        socket.on('lobby:updated', ({lobby}) => {
            this.lobby = lobby;
        });

        socket.once('lobby:joined', ({lobby}) => {
            this.lobby = lobby;
        });

        socket.once('lobby:created', ({lobby}) => {
            this.lobby = lobby;
        });

        socket.on('player:connected', ({player}) => {
            Lobby.addPlayerToLobby(player);
        });

        socket.on('player:disconnected', ({player}) => {
            Lobby.removePlayerFromLobby(player);
        });
    }

    static loadAvatars() {
        forEachQuery('#players .player:not(.avatar), #activePlayers .player:not(.avatar)', player => {
            const playerName = player.innerText;
            const url = new URL(`https://avatars.dicebear.com/api/bottts/${playerName}.svg?mood[]=happy`);
            player.innerHTML = Layout.renderPlayerAvatar({url, playerName});
            player.classList.add('avatar');
        });
    }

    static getPlayerElement(player) {
        return document.querySelectorAll(`[data-player-id="${player.userId}"]`)[0];
    }

    static addPlayerToLobby(player) {
        const playerElement = Lobby.getPlayerElement(player);
        if (!playerElement) {
            forEachQuery('#players, #activePlayers', playerContainer => {
                playerContainer.innerHTML += Layout.renderPlayer({player});
            });
            Lobby.loadAvatars();
        }
    }

    static removePlayerFromLobby(player) {
        forEachQuery('#players, #activePlayers', playerContainer => {
            const playerElement = Lobby.getPlayerElement(player);
            if (playerElement) {
                // Player element exists in the DOM
                playerElement.remove();
            }
        });
    }

    static setPlayers(players) {
        forEachQuery('#players, #activePlayers', playerContainer => {
            playerContainer.innerHTML = '';
        });
        if (players.length > 0) {
            players.forEach(player => {
                Lobby.addPlayerToLobby(player);
            });
        }
    }

    static async joinOrCreate(lobbyCode) {
        if (lobbyCode) {
            // Join lobby
            socket.emit('lobby:join', {lobbyCode});
        } else {
            // Create lobby
            let lobbyCode = prompt(language.notification.createLobby, randomString(4).toUpperCase());
            lobbyCode = lobbyCode.toUpperCase();
            socket.emit('lobby:create', {lobbyCode});
        }

        return new Promise((resolve, reject) => {
            socket.once('lobby:joined', ({lobby}) => {
                resolve(new Lobby(lobby));
            });

            socket.once('lobby:created', ({lobby}) => {
                resolve(new Lobby(lobby));
            });

            setTimeout(() => {
                reject('Lobby creation timeout.');
            }, 10000);
        });
    }

    static setLobbyCodeDom({code}) {
        const lobbyEl = $('lobbyCode');
        if (lobbyEl) {
            lobbyEl.innerText = code;
        }
    }

    static setState(state) {
        socket.emit('lobby:state', {key: 'state', value: state});
    }

    leave() {
        socket.emit('lobby:leave', {lobbyCode: this.code});
    }

    get players() {
        return this.lobby?.players || [];
    }

    get code() {
        return this.lobby?.code;
    }

    static get cachedLobbyCode() {
        return GameStorage.getItem('lobby', false);
    }

    get state() {
        return this.lobby?.state;
    }

    set lobby(newLobby) {
        if (newLobby.code !== this.#lobby.code) {
            // Store the new value in the local storage as well.
            GameStorage.setItem('lobby', newLobby.code);
        }

        Lobby.setLobbyCodeDom({code: newLobby.code});
        if (newLobby.players.length > 0) {
            Lobby.setPlayers(newLobby.players);
        }

        this.#lobby = newLobby;
    }

    get lobby() {
        return this.#lobby;
    }

    get playerNames() {
        return this.players.map(p => p.username).join(', ');
    }
}

const level1 = [
    {
        column: 'A',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'B',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'C',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'D',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'E',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'F',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'G',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'H',
        score: [
            {
                value: 1
            },{
                value: 0
            }
        ],
        grid: [
            {
                color: 'green',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'I',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'J',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'K',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'L',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'M',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'green',
                star: true
            }
        ]
    },
    {
        column: 'N',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'O',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            }
        ]
    }
];
const level2 = [
    {
        column: 'A',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green',
                star: true
            }
        ]
    },
    {
        column: 'B',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'C',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'D',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'E',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'green',
                star: true
            }
        ]
    },
    {
        column: 'F',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'G',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'H',
        score: [
            {
                value: 1
            },{
                value: 0
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'I',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange',
                star: true
            }
        ]
    },
    {
        column: 'J',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'K',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'L',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'M',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'N',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'O',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            }
        ]
    }
];
const level3 = [
    {
        column: 'A',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'B',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'C',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'orange',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'D',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'E',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'F',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'G',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'H',
        score: [
            {
                value: 1
            },{
                value: 0
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'I',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'J',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'K',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'L',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'M',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green',
                star: true
            }
        ]
    },
    {
        column: 'N',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'O',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            }
        ]
    }
];
const level4 = [
    {
        column: 'A',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'orange',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'B',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'C',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'D',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'E',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'F',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'G',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'H',
        score: [
            {
                value: 1
            },{
                value: 0
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'I',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'J',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'K',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'L',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'M',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'red',
                star: true
            }
        ]
    },
    {
        column: 'N',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'O',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            }
        ]
    }
];

class Level {
    selectedLevel = false;
    static levelMap = {
        level1,
        level2,
        level3,
        level4
    };

    constructor() {
        socket.on('level:selected', ({selectedLevel}) => {
            this.level = selectedLevel;
        });

        this.registerEventHandlers();
    }

    static selectInDom(level) {
        const levelElement = document.querySelectorAll('#levels .level a.' + level)[0];

        // Clear state
        forEachQuery('#levels .level a', lvl => {
            lvl.classList.remove('selected');
            document.getElementById('startGame')?.remove();
        });

        if (levelElement) {
            // Set new state if element exists.
            levelElement.classList.toggle('selected');
            levelElement.innerHTML += `<span id="startGame">${language.label.startGame} &rarr;</span>`;
        }
    }

    registerEventHandlers() {
        const levels = document.querySelectorAll('li.level > a');
        Array.prototype.forEach.call(levels, (level) => {
            level.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                const selectedLevel = level.dataset.level;
                if (level.classList.contains('selected')) {
                    // Start the game!
                    socket.emit('game:start');
                } else {
                    this.level = selectedLevel;
                    socket.emit('level:select', {selectedLevel});
                }
            }, false);
        });
    }

    reset() {
        this.level = false;
    }

    getGrid() {
        return Level.levelMap[this.level];
    }

    set level(level) {
        if (level === false) {
            GameStorage.removeItem('level');
            this.selectedLevel = level;
            return;
        }

        if (level !== this.selectedLevel) {
            // Level has changed
            this.selectedLevel = level;
            dispatch(EVENTS.GAME_CREATE_STATE);
            Level.selectInDom(level);
        }

        GameStorage.setItem('level', this.selectedLevel);
    }

    get level() {
        let level = this.selectedLevel;
        if (!level) {
            level = GameStorage.getItem('level');
        }

        return level;
    }
}

class Score {
    static JOKER_VALUE = 1;
    static STAR_VALUE = -2;
    Game;

    constructor({Game}) {
        this.Game = Game;

        if (!Game.initialized) {
            listen(EVENTS.JOKER_SELECTED, () => {
                this.renderScores({scores: {jokers: this.jokerScore}});
            });
            listen(EVENTS.STAR_SELECTED, () => {
                this.renderScores({scores: {stars: this.starScore}});
            });
            listen(EVENTS.SCORE_RELOAD, () => {
                this.renderScores({
                    scores: {
                        bonus: this.bonusScore,
                        columns: this.columnScore,
                        jokers: this.jokerScore,
                        stars: this.starScore,
                        total: this.total
                    }
                });
            });

            listen(EVENTS.SCORE_TOTAL_TOGGLE, () => this.toggleTotalScore());

            listen(EVENTS.SCORE_COLUMN_UPDATE, () => {
                this.renderColumnScore(this.columnScore);
            });
            listen(EVENTS.SCORE_COLOR_UPDATE, () => {
                this.renderBonusScore(this.bonusScore);
            });
        }

        socket.on('grid:column-completed', ({letter}) => {
            ColumnScoreBlock
                .getAll({letter})
                .filter(block => block.isHighScore() && !block.active())
                .forEach(block => block.taken());
        });
        socket.on('grid:column-cleared', ({letter}) => {
            ColumnScoreBlock
                .getAll({letter})
                .filter(block => block.isTaken())
                .forEach(block => block.default());
        });
        socket.on('grid:color-completed', ({color}) => {
            ColorScoreBlock
                .getAll({color})
                .filter(block => block.isHighScore() && !block.active())
                .forEach(block => block.taken());
        });
        socket.on('grid:color-cleared', ({color}) => {
            ColorScoreBlock
                .getAll({color})
                .filter(block => block.isTaken())
                .forEach(block => block.default());
        });
    }

    renderScores({scores}) {
        if (typeof scores.bonus !== 'undefined') {
            this.renderBonusScore(scores.bonus);
        }
        if (typeof scores.columns !== 'undefined') {
            this.renderColumnScore(scores.columns);
        }
        if (typeof scores.jokers !== 'undefined') {
            this.renderJokerScore(scores.jokers);
        }
        if (typeof scores.stars !== 'undefined') {
            this.renderStarScore(scores.stars);
        }
    }

    get total() {
        return this.bonusScore + this.columnScore + this.jokerScore + this.starScore;
    }

    get columnScore() {
        let activeColumns = document.querySelectorAll('span.column-score.active');
        let totalValue = 0;
        Array.prototype.forEach.call(activeColumns, (activeColumn) => {
            let value = parseInt(activeColumn.innerText);
            totalValue += value;
        });

        return totalValue;
    }

    get jokerScore() {
        let jokers = document.getElementsByClassName('joker');
        let totalJokers = jokers.length;
        let usedJokers = 0;
        Array.prototype.forEach.call(jokers, (joker) => {
            if (joker.classList.contains('used')) {
                usedJokers++;
            }
        });

        return (totalJokers - usedJokers) * Score.JOKER_VALUE;
    }

    get bonusScore() {
        let bonuses = document.querySelectorAll('.final-score.active span');
        let bonusTotal = 0;
        Array.prototype.forEach.call(bonuses, (bonus) => {
            bonusTotal += parseInt(bonus.innerText);
        });

        return bonusTotal;
    }

    get starScore() {
        const activeStars = document.querySelectorAll('span.selected span.star').length;
        const totalStars = document.querySelectorAll('span.star').length;

        return (totalStars - activeStars) * Score.STAR_VALUE;
    }

    toggleTotalScore() {
        const element = $('totalScore');
        if (element.classList.contains('hide')) {
            element.classList.remove('hide');
            this.renderTotalScore();
        } else {
            element.innerText = '';
            element.classList.add('hide');
        }
    }

    renderBonusScore(value) {
        $('bonusTotal').innerText = value;
        this.renderTotalScore();
    }

    renderColumnScore(value) {
        $('columnsTotal').innerText = value;
        this.renderTotalScore();
    }

    renderJokerScore(value) {
        $('jokerTotal').innerText = value;
        this.renderTotalScore();
    }

    renderStarScore(value) {
        $('starsTotal').innerText = value;
        this.renderTotalScore();
    }

    renderTotalScore() {
        const el = $('totalScore');
        if (!el.classList.contains('hide')) {
            el.innerText = this.total;
        }
    }
}

class Notify {
    static TRANSITION_DELAY = 200;
    constructor() {

    }

    static hide(opts) {
        const {id, timeout = 400} = opts;
        if (!$(id)) {
            return;
        }

        $(id).classList.remove('show');
        setTimeout(() => {
            const element = $(id);
            if (element) {
                element.remove();
            }
        }, timeout);
    }

    static removePrevious() {
        let activeNotifications = document.querySelectorAll('.notification.show').length;

        if (activeNotifications > 0) {
            // Get rid of active notifications first
            let timeout = 200;
            forEachQuery('.notification.show', notification => {
                Notify.hide({id: notification.id, timeout});
                timeout += 200;
            });
        }

        return activeNotifications;
    }

    static show(opts) {
        const delay = Notify.removePrevious();
        const execute = (opts) => {
            if (typeof opts === 'string') {
                opts = {title: opts};
            }

            let {
                message,
                title = 'No message specified.',
                timeout = 4000,
                autoHide = false
            } = opts;

            const notification = Notify.createTemplate(message, title);

            $('app').append(notification);
            setTimeout(() => {
                $(notification.id).classList.toggle('show');
            }, 1);

            if (autoHide) {
                setTimeout(() => {
                    Notify.hide({id: notification.id});
                }, timeout);
            }
        };

        if (delay > 0) {
            setTimeout(() => {
                execute(opts);
            }, (delay * 200) + 200);
        } else {
            execute(opts);
        }
    }

    static createTemplate(message, title = false) {
        const notificationId = 'notification_' + randomString(5);
        const template = `
            <div class="notification" id="${notificationId}">
                ${title ? `
                <h2>${title}</h2>
                ` : ``}
                ${message ? `
                <p>${message}</p>
                ` : ``}
            </div>
        `;

        return R(template);
    }
}

class Session {
    constructor() {
    }

    static get cachedId() {
        return GameStorage.getItem('sessionId');
    }

    static set cachedId(newValue) {
        return GameStorage.setItem('sessionId', newValue);
    }
}

class Player {
    #cachedPlayer = false;

    constructor() {
        const sessionId = Session.cachedId;
        if (sessionId !== false) {
            socket.auth = {
                sessionId,
                username: Player.cachedName
            };
            socket.connect();
        } else {
            // No player exists. Create a new one.
            this.createPlayer();
        }

        socket.once('player:created', ({player}) => {
            this.player = player;
        });

        socket.on('player:updated', ({player}) => {
            this.player = player;
        });

        socket.on('player:connected', ({player}) => {
            Notify.show({
                title: language.notification.playerJoined.title,
                message: language.notification.playerJoined.message(player.username),
                autoHide: true
            });
        });
    }

    static setPlayerNameDom({player}) {
        const playerEl = $('playerName');
        if (playerEl) {
            playerEl.innerText = player.username;
        }
    }

    createPlayer() {
        const username = prompt(language.notification.playerName);
        this.player = {username};
        this.connectPlayer(this.player);
    }

    connectPlayer(player) {
        socket.auth = player;
        socket.connect();
    }

    delete() {
        return GameStorage.removeItem('player');
    }

    set player(value) {
        if (!value.username) {
            throw new Error('Invalid player object. No username.');
        }

        this.#cachedPlayer = value;
        GameStorage.setItem('player', value.username);
        Player.setPlayerNameDom(value.username);
    }

    get player() {
        return this.#cachedPlayer;
    }

    static get cachedName() {
        return GameStorage.getItem('player');
    }

    get name() {
        return this.#cachedPlayer.username;
    }

    get id() {
        return this.#cachedPlayer?.id || randomString(6).toLowerCase();
    }
}

class Router {
    currentView;
    previousView = [];
    silent = false;
    constructor() {
        this.currentView = document.querySelectorAll('.applicationWindow:not(.hidden)')[0];

        listen(EVENTS.NAVIGATE_BACK, () => {
            const page = this.previousView.pop(), silent = true;
            if ($(page)) {
                this.navigate({page, silent});
            }
        });

        listen(EVENTS.NAVIGATE, (event) => {
            const {page} = event.detail;
            if ($(page)) {
                this.navigate({page});
            }
        });
    }

    hideCurrent() {
        if (this.currentView) {
            if (!this.silent) this.previousView = this.currentView;
            this.currentView.classList.add('hidden');
        }
    }

    navigate({page, silent}) {
        this.silent = silent || false;
        if (this.currentView?.id === page) return;
        this.hideCurrent();
        this.currentView = $(page);
        this.currentView.classList.remove('hidden');
        this.silent = false;
    }

    static navigateTo(page) {
        dispatch(EVENTS.NAVIGATE, {page});
    }

    static back() {
        dispatch(EVENTS.NAVIGATE_BACK);
    }
}

class Game {
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];
    static TOTAL_JOKERS = 8;

    initialized = false;

    Lobby;
    Level;
    Score;
    Player;

    #cachedState = false;
    constructor() {
        // Create player and connect to socket
        this.Player = new Player();

        socket.on('game:start', () => {
            dispatch(EVENTS.GAME_START);
        });

        socket.on('connect', () => {
            this.initialize();
        });

        listen(EVENTS.GAME_CREATE_STATE, () => {
            this.state = this.createState();
        });
        listen(EVENTS.GAME_NEW, () => {
            this.new();
        });
        listen(EVENTS.GAME_START, () => {
            // Level is loaded, state is created, now we need to go
            // ahead and render the game
            this.continue();
        });
        listen(EVENTS.UPDATE_GRID_BLOCK, (event) => {
            const {gridBlock} = event.detail;
            this.updateBlockState({gridBlock});
        });
        listen(EVENTS.JOKER_SELECTED, (event) => {
            const {joker} = event.detail;
            this.updateJokerState({joker});
        });
    }

    initialize() {
        /*
        Do we have a local state?
        - Yes
        --- Load the current level
        --- Load the current state
        --- Continue where we left off
        - No
        --- Display level selector
        --- Let user set sync game optionally
         */

        // Create new Lobby first
        Lobby.joinOrCreate(Lobby.cachedLobbyCode)
            .then(LobbyInstance => {
                this.Lobby = LobbyInstance;
                // Select new level
                this.Level = new Level({Lobby: LobbyInstance, Game: this});
                this.Score = new Score({Game: this});

                // All ready now, start the game
                this.start();
                this.initialized = true;
            })
            .catch(err => {
                console.error('Failed to create lobby', err);
                this.initialized = false;
            });
    }

    start() {
        if (!this.state) {
            // No state, select a level first.
            Router.navigateTo('levelSelect');
        } else {
            this.continue();
        }
    }

    new() {
        // Reset state, continue game
        this.resetState();
        // Continue rendering the newly created level
        this.start();
    }

    continue() {
        // Load state from localstorage and trigger events to render level
        Router.navigateTo('gameView');
        dispatch(EVENTS.RENDER_LEVEL);
    }

    resetState() {
        this.Level.reset();
        this.state = false;
        GameStorage.removeItem('columnScore');
        GameStorage.removeItem('colorScore');
    }

    createState() {
        let state = {
            grid: this.Level.getGrid(),
            jokers: [],
            colorScores: {}
        }, i;
        for (i = 0; i < Game.TOTAL_JOKERS; i++) {
            state.jokers.push({selected: false});
        }

        return state;
    }

    get state() {
        // If there is no locally cached state value, try to load one from the
        // localStorage and return false if none exist.
        if (!this.#cachedState) {
            this.#cachedState = GameStorage.getItem('state', false);
        }

        return this.#cachedState;
    }

    set state(value) {
        this.#cachedState = value;
        if (!value) {
            GameStorage.removeItem('state');
        } else {
            GameStorage.setItem('state', value);
        }
    }

    /**
     * @param {GridBlock} gridBlock
     */
    updateBlockState({gridBlock}) {
        let currentState = this.state;
        let updateState = false;
        currentState.grid.forEach((stateColumn, stateIndex) => {
            if (stateColumn.column === gridBlock.letter) {
                currentState.grid[stateIndex].grid[gridBlock.row]['selected'] = gridBlock.selected;
                updateState = true;
            }
        });

        if (updateState) {
            this.state = currentState;
        }
    }

    /**
     *
     * @param {JokerScoreBlock} joker
     */
    updateJokerState({joker}) {
        let currentState = this.state;
        let found = false;
        currentState.jokers.forEach((stateJoker, index) => {
            if (index === joker.row) {
                stateJoker.selected = joker.selected;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
        }
    }
}

class Engine {
    currentGame = false;
    router;
    version;
    constructor() {
        $('app').innerHTML += Layout.render();
        this.router = new Router();

        registerModalEvents();

        this.currentGame = new Game();
        this.parseOrientationOverlay();
        this.parseGenericLoading();

        $('connecting-message').innerText = language.messages.connecting;

        listen(EVENTS.RENDER_LEVEL, () => {
            this.render();
        });

        socket.on('version', version => {
            GameStorage.setItem('version', version);
        });

        socket.on('session', ({sessionId}) => {
            Session.cachedId = sessionId;
        });

        socket.on('connect', () => {
            document.body.classList.add('connected');
        });
        socket.on('disconnect', () => {
            document.body.classList.remove('connected');

            // Clear player list. They'll reappear once they reconnect
            Lobby.setPlayers([]);
        });
        socket.on('game:confirm-new', ({player}) => {
            Modals.showNewGameModal({
                message: `Speler ${player.username} start een nieuw spel. Wil jij ook opnieuw beginnen?`,
                emit: false
            });
        });

        $('newGameButton').addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            Modals.showNewGameModal({emit: true});
        }, false);
    }


    parseOrientationOverlay() {
        createNewModal({
            id: 'orientationModal',
            message: language.notification.landscapeMode
        });
    }

    parseGenericLoading() {
        createNewModal({
            visible: false,
            id: 'genericLoading',
            message: 'Aan het laden.. een moment geduld.'
        });
    }

    parseColumnGrid(state) {
        Layout.renderGrid({columns: state.grid});
    }

    parseJokerColumn(state) {
        Layout.renderJokers({jokers: state.jokers});
    }

    parseScoreColumns() {
        $('scoreColumn1').innerHTML = Game.COLORS.map(color => {
            return new ColorScoreBlock({value: 5, color}).render();
        }).join('');

        $('scoreColumn2').innerHTML = Game.COLORS.map(color => {
            return new ColorScoreBlock({value: 3, color}).render();
        }).join('');

        Game.COLORS.map(color => {
            Grid.setColorScoreState({color});
        });
    }

    parseGrid() {
        const {state} = this.currentGame;
        this.parseColumnGrid(state);
        this.parseJokerColumn(this.currentGame.state);
        this.parseScoreColumns(this.currentGame.state);
    }

    parseTotalScores() {
        if ($('totalScores')) {
            return;
        }

        const totalScoresTemplate = `
            <div id="totalScores">
                <div class="totals" id="bonus"><label class="rainbow">${language.label.bonus}</label><span class="label">=</span><span id="bonusTotal" class="totalValue">15</span></div>
                <div class="totals" id="columns"><label>${language.label.columns}</label><span class="label">+</span><span id="columnsTotal" class="totalValue"></span></div>
                <div class="totals" id="jokers"><label>${language.label.jokers}</label><span class="label">+</span><span id="jokerTotal" class="totalValue"></span></div>
                <div class="totals" id="stars"><label>${language.label.stars}</label><span class="label">-</span><span id="starsTotal" class="totalValue"></span></div>
                <div class="totals" id="totals">
                    <label>${language.label.totals}</label><span class="label">&nbsp;</span><span id="totalScore" class="totalValue hide"></span>
                </div>
            </div>
        `;

        $('scoreColumn').innerHTML += totalScoresTemplate;

        $('totals').addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            dispatch(EVENTS.SCORE_TOTAL_TOGGLE);
        }, false);
    }

    render() {
        this.parseGrid();
        this.parseTotalScores();

        dispatch(EVENTS.SCORE_RELOAD);
    }
}

try {
    window.engine = new Engine();
} catch (err) {
    console.error('Failed to load game. Reset state!', err);
}

window.Block = Block;
