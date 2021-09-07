import {dispatch, EVENTS} from "./events";
import {ColumnScoreBlock} from "./Block";
import socket from "./socket";

export class Grid {
    static setColumnScoreState({letter, shouldEmit = false})  {
        if (Grid.isColumnComplete({letter})) {
            Grid.toggleCompletedColumn({letter, shouldEmit})
        } else {
            // Column is not complete
            Grid.clearColumnScore({letter, shouldEmit});
        }
    }
    static toggleCompletedColumn({letter, shouldEmit = false}) {
        let activateBlock = ColumnScoreBlock
            .getAll({letter})
            .filter(block => block.isActive())
            .length === 0

        if (activateBlock) {
            let block =
                ColumnScoreBlock.getFirstAvailable({letter});
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
