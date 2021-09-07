import {R} from "./utilities";
import {dispatch, EVENTS} from "./events";

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

    onSelected() {
        if (this.element && this.selected) {
            // Add class
            this.element.classList.add('selected');
            // Send generic block selected event
            dispatch(EVENTS.BLOCK_SELECTED, {block: this});
        }
        if (this.element && !this.selected) {
            this.element.classList.remove('selected');
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
