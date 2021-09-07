import {Block} from "./Block";
import delegate from "delegate-it";
import {GameStorage} from "./GameStorage";
import socket from "./socket";

export class ScoreBlock extends Block {
    static TYPE_COLUMN_SCORE = 'column-score';
    static TYPE_COLOR_SCORE = 'color-score';

    #DEFAULT_VALUE = 0;

    constructor({
        letter,
        row,
        color,
        selected = false,
        element,
        value = 0,
        type,
        claimedBy = []
    }) {
        super({letter, row, color, selected, element});

        this.type = type;
        this.value = value;
        this.claimedBy = claimedBy;
    }

    /**
     * @param {Array|Object} value
     */
    set claimedBy(value) {
        if (!Array.isArray(value)) value = [value];
        this.state.claimedBy = value;
    }

    /**
     * @returns {Array}
     */
    get claimedBy() {
        return this.state?.claimedBy;
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

    constructor({state = ColumnScoreBlock.STATE.DEFAULT, letter, row = -1, color = 'white', selected = false, element, value = 0, claimedBy = [] }) {
        super({ letter, row, color, selected, element, value, type: ScoreBlock.TYPE_COLUMN_SCORE, claimedBy });
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

        console.log('Set storage', this.cache);
    }

    get storage() {
        if (!this.cache) {
            this.cache = GameStorage.getItem('columnScore', {});
        }

        console.log('Get from cache', this.cache);
        return this.cache;
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
    constructor({
        letter,
        row,
        color,
        selected = false,
        element,
        value = 0,
        claimedBy = []
    }) {
        super({
            letter,
            row,
            color,
            selected,
            element,
            value,
            type: ScoreBlock.TYPE_COLOR_SCORE,
            claimedBy
        });
    }
}
