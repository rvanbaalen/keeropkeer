import {dispatch, EVENTS} from "./events";
import socket from "./socket";
import {GridBlock} from "./GridBlock";

export class Grid {
    static coloredBlockHandler({event, block, currentGame}) {
        event.preventDefault();
        event.stopPropagation();

        let gridBlock = GridBlock.getInstance(block);
        gridBlock.selected = !gridBlock.selected;

        // let selected = !block.classList.contains('selected');
        currentGame.updateBlockState({gridBlock});

        // if (block.querySelectorAll('.star').length > 0) {
        //     // Has a star, update star score.
        //     dispatch(EVENTS.STAR_SELECTED, {selected, block});
        // }
        //
        // const letter = block.dataset.column;
        // if (Grid.isColumnComplete({letter})) {
        //     console.log('grid complete', letter);
        //     const scoreElement = (high) => document.querySelector(`.column-score[data-column="${letter}"][data-row="${high ? 0 : 1}"]`);
        //     const highScore = !scoreElement(true).classList.contains('taken');
        //     if (highScore) {
        //         scoreElement(true).classList.add('active');
        //     } else {
        //         scoreElement(false).classList.add('active');
        //     }
        //     socket.emit('grid:column-complete', {columnLetter: letter, highScore});
        //     dispatch(EVENTS.GRID_COLUMN_COMPLETE, {letter});
        // }
    }

    static jokerHandler({joker, currentGame, index, event}) {
        event.preventDefault();
        event.stopPropagation();

        let selected = !joker.classList.contains('used');
        currentGame.updateJokerState(index, selected);
        dispatch(EVENTS.JOKER_SELECTED, {joker, selected});
    }

    static isColumnComplete({letter, parent = document}) {
        const columnElement = parent.querySelectorAll(`[data-letter="${letter}"]`)[0]?.parentElement;
        const selectedBlocks = columnElement.querySelectorAll('.score-block.selected').length;

        return selectedBlocks === 7;
    }
}
