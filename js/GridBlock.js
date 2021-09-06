import {Block} from "./Block";
import {dispatch, EVENTS} from "./events";

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
                data-letter="${this.letter}" 
                data-row="${this.row}" 
                data-color="${this.color}">
                ${this.star ? `<span class="star">*</span>` : ''}    
            </span>
        `;

        this.element = tpl;
        return tpl;
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
