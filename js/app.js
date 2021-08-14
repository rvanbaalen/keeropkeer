import { level1, level2, level3, level4 } from "./levels.js";
import { $ } from "./utilities.js";
import {EVENTS, listen} from "./eventbus.js";
import {createElement, renderNewGameButton} from "./rendering.js";

const JOKER_VALUE = 1;
const STAR_VALUE = 2;
const TOTAL_JOKERS = 8;
const COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];

function parseColumn(column) {
    let columnTemplate = createElement('div', {className: 'column' + (column.column === 'H' ? ' highlight' : '')});
    // create header
    createElement('span', {className: 'letter rounded-block', innerText: column.column}, columnTemplate);

    // create grid blocks
    column.grid.forEach((block, index) => {
        const row = createElement('span', {
            className: 'score-block ' + block.color,
            data: {
                column: column.column,
                row: index
            }
        });
        if (block.star) {
            createElement('span', {className: 'star', innerText: '*'}, row);
        }
        if (block.selected) {
            row.classList.add('selected');
        }

        columnTemplate.append(row);
    });
    // create score columns
    let score = createElement('div', {className: 'column-score'});
    column.score.forEach((scoreObject, index) => {
        let state = (scoreObject.state && scoreObject.state !== 'default') ? ' ' + scoreObject.state : '';
        createElement('span', {
            className: 'rounded-block column-score' + state,
            innerText: scoreObject.value,
            data: {
                column: column.column,
                row: index
            }
        }, score);
    });
    columnTemplate.append(score);

    return columnTemplate;
}

let selectedLevel;
function getSelectedLevel() {
    if (!selectedLevel) {
        let level = prompt('Kies een level (1-4)', '1');
        switch (level) {
            case '2':
                selectedLevel = level2;
                break;
            case '3':
                selectedLevel = level3;
                break;
            case '4':
                selectedLevel = level4;
                break;
            default:
                selectedLevel = level1;
        }

        // $('overlay').classList.add('show');
        // setTimeout(() => {
        //     $('overlay').remove();
        // }, 1000);
    }

    return selectedLevel;
}
function createState() {
    let state = {
        grid: getSelectedLevel(),
        jokers: [],
        colorScores: {
            high: [],
            low: []
        }
    }, i;
    for (i = 0; i < TOTAL_JOKERS; i++) {
        state.jokers.push({selected: false});
    }
    COLORS.forEach(color => {
        state.colorScores.high.push({
            color: color,
            value: 0
        });
        state.colorScores.low.push({
            color: color,
            value: 0
        });
    });

    return state;
}
function resetState() {
    localStorage.removeItem('kok_state');
    window.location.reload();

    return true;
}
function getState() {
    return JSON.parse(localStorage.getItem('kok_state')) || createState();
}
function setState(state) {
    localStorage.setItem('kok_state', JSON.stringify(state));
}
function updateState(column, index, key, value, type = 'grid') {
    let currentState = getState();
    let found = false;
    currentState.grid.forEach((stateColumn, stateIndex) => {
        if (stateColumn.column === column) {
            currentState.grid[stateIndex][type][index][key] = value;
            found = true;
        }
    });

    if (found) {
        setState(currentState);
    }

    render(currentState);
}
function updateBlockState(col, row, key, value) {
    let currentState = getState();
    let found = false;
    currentState.grid.forEach((stateColumn, stateIndex) => {
        if (stateColumn.column === col) {
            currentState.grid[stateIndex].grid[row][key] = value;
            found = true;
        }
    });

    if (found) {
        setState(currentState);
    }

    render(currentState);
}
function updateJokerState(row, selected) {
    let currentState = getState();
    let found = false;
    currentState.jokers.forEach((joker, index) => {
        if (index === row) {
            joker.selected = selected;
            found = true;
        }
    });

    if (found) {
        setState(currentState);
        render(currentState);
    }
}
function updateColorScoreState(group, color, value) {
    let found = false;
    let currentState = getState();
    currentState.colorScores[group].forEach((colorScore, index) => {
        if (colorScore.color === color) {
            colorScore.value = value;
            found = true;
        }
    });

    if (found) {
        setState(currentState);
        render(currentState);
    }

}

function registerEventListeners() {
    // Colored blocks
    let scoreBlocks = document.querySelectorAll('.score-block:not(.final-score)');
    Array.prototype.forEach.call(scoreBlocks, (scoreBlock) => {
        scoreBlock.addEventListener('click', () => {
            let blockSelected = !scoreBlock.classList.contains('selected');
            updateBlockState(scoreBlock.data.column, scoreBlock.data.row, 'selected', blockSelected);
            setStarTotal();
        }, false);
    });

    // Final score toggles
    let getValueFromClass = function (element, high = 5, low = -1) {
        if (!element.classList.contains('final-selected') && !element.classList.contains('selected')) {
            // Not selected yet, value = 5
            return high;
        }
        if (element.classList.contains('final-selected') && !element.classList.contains('selected')) {
            // Already selected, toggle disabled state, value = -1
            return low
        }

        return 0;
    };
    let getColorFromElement = function (element) {
        let color = '';
        COLORS.forEach(mappedColor => {
            if (element.classList.contains(mappedColor)) {
                color = mappedColor;
            }
        });

        return color;
    };
    let highScores = document.querySelectorAll('#scoreColumn1 .final-score');
    Array.prototype.forEach.call(highScores, (highScore, index) => {
        highScore.addEventListener('click', () => {
            updateColorScoreState(
                'high',
                getColorFromElement(highScore),
                getValueFromClass(highScore, 5, -1)
            );
            setBonusTotal();
        }, false);
    });
    let lowScores = document.querySelectorAll('#scoreColumn2 .final-score');
    Array.prototype.forEach.call(lowScores, (lowScore, index) => {
        lowScore.addEventListener('click', () => {
            updateColorScoreState(
                'low',
                getColorFromElement(lowScore),
                getValueFromClass(lowScore, 3, -1)
            );
            setBonusTotal();
        }, false);
    });

    // Column scores
    let columnScores = document.querySelectorAll('span.column-score');
    Array.prototype.forEach.call(columnScores, (columnScore) => {
        columnScore.addEventListener('click', () => {
            let col = columnScore.data.column, row = columnScore.data.row, state;

            if (!columnScore.classList.contains('active') && !columnScore.classList.contains('taken')) {
                state = 'active';
            } else if (columnScore.classList.contains('active') && !columnScore.classList.contains('taken')) {
                state = 'taken';
            } else {
                state = 'default';
            }

            updateState(col, row, 'state', state, 'score');
            setColumnTotal();
        }, false);
    });

    // Jokers
    let jokers = document.getElementsByClassName('joker');
    Array.prototype.forEach.call(jokers, (joker, index) => {
        joker.addEventListener('click', () => {
            let state = !joker.classList.contains('used');
            updateJokerState(index, state);
            setJokerTotal();
        }, false);
    });
}

function getTotalScore() {
    return getBonusTotal() + getColumnTotal() + getJokerTotal() - getStarTotal();
}
function setTotalScore() {
    $('totalScore').innerText = getTotalScore();
}
function getBonusTotal() {
    let bonuses = document.querySelectorAll('.final-selected span');
    let bonusTotal = 0;
    Array.prototype.forEach.call(bonuses, (bonus) => {
        bonusTotal += parseInt(bonus.innerText);
    });

    return bonusTotal;
}
function setBonusTotal() {
    $('bonusTotal').innerText = getBonusTotal();
}
function getJokerTotal() {
    let jokers = document.getElementsByClassName('joker');
    let totalJokers = jokers.length;
    let usedJokers = 0;
    Array.prototype.forEach.call(jokers, (joker) => {
        if (joker.classList.contains('used')) {
            usedJokers++;
        }
    });

    return (totalJokers - usedJokers) * JOKER_VALUE;
}
function setJokerTotal() {
    $('jokerTotal').innerText = getJokerTotal();
}
function getColumnTotal() {
    let activeColumns = document.querySelectorAll('span.column-score.active');
    let totalValue = 0;
    Array.prototype.forEach.call(activeColumns, (activeColumn) => {
        let value = parseInt(activeColumn.innerText);
        totalValue += value;
    });

    return totalValue;
}
function setColumnTotal() {
    $('columnsTotal').innerText = getColumnTotal();
}

function getStarTotal() {
    let activeStars = document.querySelectorAll('span.selected span.star').length;
    let totalStars = document.querySelectorAll('span.star').length;

    return (totalStars - activeStars) * STAR_VALUE;
}
function setStarTotal() {
    $('starsTotal').innerText = getStarTotal();
}

function render(state) {
    if (typeof state === 'undefined') {
        state = getState();
    }

    $('blockGrid').innerHTML = '';
    state.grid.forEach(column => {
        $('blockGrid').append(parseColumn(column));
    });

    let jokerContainer = $('jokerContainer');
    jokerContainer.innerHTML = '';
    state.jokers.forEach(joker => {
        let renderedJoker = createElement('span', {className: 'joker', innerText: '!'});
        if (joker.selected) {
            renderedJoker.classList.add('used');
        }
        jokerContainer.append(renderedJoker);
    });

    $('scoreColumn1').innerHTML = '';
    state.colorScores.high.forEach(colorScore => {
        let element = createElement('span', {className: 'score-block final-score ' + colorScore.color});
        if (colorScore.value === -1) {
            element.classList.add('selected');
        }
        if (colorScore.value === 5) {
            element.classList.add('final-selected');
        }
        createElement('span', {innerText: 5}, element);
        $('scoreColumn1').append(element);
    });

    $('scoreColumn2').innerHTML = '';
    state.colorScores.low.forEach(colorScore => {
        let element = createElement('span', {className: 'score-block final-score ' + colorScore.color});
        if (colorScore.value === -1) {
            element.classList.add('selected');
        }
        if (colorScore.value === 3) {
            element.classList.add('final-selected');
        }
        createElement('span', {innerText: 3}, element);
        $('scoreColumn2').append(element);
    });

    registerEventListeners();
    setBonusTotal()
    setJokerTotal();
    setColumnTotal();
    setStarTotal();
}
function init() {
    render();

    renderNewGameButton();

    listen(EVENTS.NEW_GAME, () => {
        resetState();
    });
}

$('totals').addEventListener('click', () => {
    setTotalScore();
}, false);

init();