const JOKER_VALUE = 1;
const STAR_VALUE = 2;
const TOTAL_JOKERS = 8;

function createElement(el, options, appendTo, listen = []){
    let element = document.createElement(el);
    Object.keys(options).forEach(function (k){
        element[k] = options[k];
    });
    if (listen.length > 0){
        listen.forEach(function(l){
            element.addEventListener(l.event, l.f);
        });
    }
    if (appendTo) {
        appendTo.append(element);
    }

    return element;
}

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

let selectedLevel = level1;
function getSelectedLevel() {
    if (!selectedLevel) {
        let level = prompt('Kies een level (1-3)', '1');
        switch (level) {
            default:
                selectedLevel = level1;
        }
    }

    return selectedLevel;
}
function createState() {
    let state = {
        grid: getSelectedLevel(),
        jokers: []
    }, i;
    for (i = 0; i < TOTAL_JOKERS; i++) {
        state.jokers.push({selected: false});
    }

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
    }

    render(currentState);
}

function registerEventListeners() {
    // Colored blocks
    let scoreBlocks = document.querySelectorAll('.score-block:not(.final-score)');
    Array.prototype.forEach.call(scoreBlocks, (scoreBlock) => {
        scoreBlock.addEventListener('click', () => {
            let blockSelected = !scoreBlock.classList.contains('selected');
            updateBlockState(scoreBlock.data.column, scoreBlock.data.row, 'selected', blockSelected);
            updateScores();
            setStarTotal();
        }, false);
    });

    // Final score toggles
    let finalScores = document.querySelectorAll('.final-score');
    Array.prototype.forEach.call(finalScores, (finalScore) => {
        finalScore.addEventListener('click', () => {
            finalScore.classList.toggle('final-selected');
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

let claimed = [];
function updateScores() {
    const colorMap = {
        'green': 'groen',
        'blue': 'blauw',
        'yellow': 'geel',
        'red': 'rood',
        'orange': 'oranje'
    };
    let claimBonus = function (color) {
        if (claimed.indexOf(color) === -1) {
            if (confirm('Ben je de eerste met kleur ' + colorMap[color] + '?')) {
                document.querySelectorAll('.final-score.' + color)[0].classList.toggle('final-selected');
                document.querySelectorAll('.final-score.second.' + color)[0].classList.remove('final-selected');
            } else {
                document.querySelectorAll('.final-score.second.' + color)[0].classList.toggle('final-selected');
                document.querySelectorAll('.final-score.' + color)[0].classList.remove('final-selected');
            }

            claimed.push(color);
        }

        setBonusTotal();
    };
    let unclaimBonus = function (color) {
        let element = document.querySelectorAll('.final-score.final-selected.' + color)[0];
        if (element) {
            element.classList.remove('final-selected');
        }
    }

    let colors = ['green', 'yellow', 'red', 'blue', 'orange'];
    colors.forEach(color => {
        let all = document.getElementsByClassName(color).length - 2;
        let allSelected = document.querySelectorAll('.' + color + '.selected').length;

        if (all === allSelected) {
            claimBonus(color);
        } else {
            unclaimBonus(color);
        }
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

function $(id) {
    return document.getElementById(id);
}
function render(state) {
    if (typeof state === 'undefined') {
        state = getState();
    }

    $('blockGrid').innerHTML = '';
    state.grid.forEach(column => {
        $('blockGrid').append(parseColumn(column));
    });

    $('jokerContainer').innerHTML = '';
    state.jokers.forEach(joker => {
        let renderedJoker = createElement('span', {className: 'joker', innerText: '!'});
        if (joker.selected) {
            renderedJoker.classList.add('used');
        }
        $('jokerContainer').append(renderedJoker);
    });

    registerEventListeners();
    setBonusTotal()
    setJokerTotal();
    setColumnTotal();
    setStarTotal();
}
function init() {
    render();

    $('newGame').addEventListener('click', function () {
        if (confirm('Weet je zeker dat je een nieuw spel wil starten?')) {
            resetState();
        }
    }, false);
}

$('totals').addEventListener('click', () => {
    setTotalScore();
}, false);

init();
