import {ColorScoreBlock, ColumnScoreBlock} from "./Block";
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
            .length === 0

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
