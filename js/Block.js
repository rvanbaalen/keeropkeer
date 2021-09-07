import {R} from "./utilities";
import {dispatch, EVENTS} from "./events";
import delegate from "delegate-it";
import {Grid} from "./Grid";
import {GameStorage} from "./GameStorage";

export class Block {
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
            // Send generic block selected event
            dispatch(EVENTS.BLOCK_SELECTED, {block: this});
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

export class GridBlock extends Block {
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

        dispatch(EVENTS.SCORE_COLUMN_UPDATE);
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

export class ScoreBlock extends Block {
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

export class ColumnScoreBlock extends ScoreBlock {
    static STATE = {
        DEFAULT: 'default',
        ACTIVE: 'active',
        TAKEN: 'taken'
    };

    cache;

    constructor({state = ColumnScoreBlock.STATE.DEFAULT, letter, row = -1, color = 'white', selected = false, element, value = 0 }) {
        super({ letter, row, color, selected, element, value, type: ScoreBlock.TYPE_COLUMN_SCORE });
        if (!letter || row === -1) {
            throw new Error('Need letter and row for new block instance.');
        }

        // Try to load a cached state.
        let cachedState = this.storage[letter + row];
        state = (cachedState !== ColumnScoreBlock.STATE.DEFAULT) ? cachedState : state;

        this.blockState = state;
    }

    set storage(value) {
        GameStorage.setItem('columnScore', value);
        this.cache = value;
    }

    get storage() {
        return (!this.cache) ? GameStorage.getItem('columnScore', {}) : this.cache;
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
        storage[this.letter + this.row] = value;
        this.storage = storage;
    }

    get blockState() {
        // default, active, or taken
        return this.state?.blockState;
    }

    render() {
        const tpl = `
            <span 
                class="rounded-block column-score${this.blockState !== ColumnScoreBlock.STATE.DEFAULT ? ' ' + this.blockState : ''}" 
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
        const {letter, type, row} = this;
        this.element = ColumnScoreBlock.getElementByProperties({letter, type, row});

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

export class ColorScoreBlock extends ScoreBlock {
    constructor({ letter, row, color, selected = false, element, value = 0 }) {
        super({ letter, row, color, selected, element, value, type: ScoreBlock.TYPE_COLOR_SCORE });
    }
}

export class JokerScoreBlock extends ScoreBlock {
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
        const tpl = `<span class="joker${this.selected ? ' used' : ''}" data-type="joker" data-row="${this.row}">!</span>`;;

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

        //currentGame.updateJokerState(index, selected);
        dispatch(EVENTS.JOKER_SELECTED, {joker: this});

        // Grid.jokerHandler({joker:this, index, event});
        //
        // event.preventDefault();
        // event.stopPropagation();
        //
        // // Update selected state
        // this.selected = !this.selected;
        //
        // // Save new block state to game cache
        // dispatch(EVENTS.UPDATE_GRID_BLOCK, {gridBlock: this});
        //
        // // Check if row is completed
        // Grid.setColumnScoreState({letter: this.letter, shouldEmit: true});
        //
        // dispatch(EVENTS.SCORE_COLUMN_UPDATE);
        // //Grid.coloredBlockHandler({block:this.element, event, currentGame: this.currentGame});
    }
}
