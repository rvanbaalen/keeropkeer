import {dispatch, EVENTS} from "./events";
import {GridBlock} from "./GridBlock";
import {ColumnScoreBlock} from "./ScoreBlock";
import socket from "./socket";

export class Grid {
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
    static coloredBlockHandler({event, block, currentGame}) {
        event.preventDefault();
        event.stopPropagation();

        // Update selected state
        let gridBlock = GridBlock.getInstance(block);
        gridBlock.selected = !gridBlock.selected;

        // Save new block state to game cache
        currentGame.updateBlockState({gridBlock});

        const {letter} = gridBlock;
        // Check if row is completed
        if (Grid.isColumnComplete({letter})) {
            Grid.toggleCompletedColumn({letter, shouldEmit: true})
        } else {
            // Column is not complete
            Grid.clearColumnScore({letter, shouldEmit: true});
        }

        dispatch(EVENTS.SCORE_COLUMN_UPDATE);
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
