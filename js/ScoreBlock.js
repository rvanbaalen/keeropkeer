import {Block} from "./Block";
import delegate from "delegate-it";

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
    constructor({state, letter, row, color, selected = false, element, value = 0, claimedBy = [] }) {
        super({ letter, row, color, selected, element, value, type: ScoreBlock.TYPE_COLUMN_SCORE, claimedBy });

        this.blockState = state || 'default';
    }

    set blockState(value) {
        const values = ['default', 'active', 'taken'];
        value = (values.indexOf(value) === -1) ? 'default' : value;

        this.state.blockState = value;
        if (this.element) {
            values.forEach(className => this.element.classList.remove(className));
            this.element.classList.add(value);
        }
    }

    get blockState() {
        // default, active, or taken
        return this.state?.blockState;
    }

    render() {
        const tpl = `
            <span 
                class="rounded-block column-score${this.blockState !== 'default' ? ' ' + this.blockState : ''}" 
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

    onClick({event}) {
        event.preventDefault();
        event.stopPropagation();

        const {letter, type, row} = this;
        this.element = ColumnScoreBlock.getByProperties({letter, type, row});

        switch (this.blockState) {
            case 'default':
                // Toggle selected
                this.blockState = 'active';
                break;
            case 'active':
                // Toggle to taken
                this.blockState = 'taken';
                break;
            case 'taken':
                // Toggle to default
                this.blockState = 'default';
                break;
        }
    }

    static getByProperties({letter, type, row}) {
        return document.querySelector(`[data-type="${type}"][data-letter="${letter}"][data-row="${row}"]`);
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
