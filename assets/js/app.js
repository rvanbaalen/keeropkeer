const JOKER_VALUE = 1;
const STAR_VALUE = 2;

window.onbeforeunload = unload();

function unload() {
 return confirm('Weet je zeker dat je weg wil gaan?');
};

let scoreBlocks = document.querySelectorAll('.score-block:not(.final-score)');
Array.prototype.forEach.call(scoreBlocks, (scoreBlock) => {
    scoreBlock.addEventListener('click', () => {
        toggleSelected(scoreBlock);
        updateScores();
        setStarTotal();
    }, false);
});

function toggleSelected(block) {
    block.classList.toggle('selected');
}

let finalScores = document.querySelectorAll('.final-score');
Array.prototype.forEach.call(finalScores, (finalScore) => {
    finalScore.addEventListener('click', () => {
        finalScore.classList.toggle('final-selected');
        setBonusTotal();
    }, false);
});

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
if(claimed.indexOf(color) === -1) {
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
        let element = document.querySelectorAll('.final-score.final-selected.green')[0];
        if (element) {
            element.classList.remove('final-selected');
        }
    }

    let colors = ['green', 'yellow', 'red', 'blue', 'orange'];
    colors.forEach(color => {
        let all = document.getElementsByClassName(color).length - 2;
        let allSelected = document.querySelectorAll('.' + color + '.selected').length;
        console.log('check', color, all, allSelected);

        if (all === allSelected) {
            claimBonus(color);
        } else {
            // unclaimBonus(color);
        }
    });
}

let columnScores = document.getElementsByClassName('column-score');
Array.prototype.forEach.call(columnScores, (columnScore) => {
    columnScore.addEventListener('click', () => {
        if (!columnScore.classList.contains('active') && !columnScore.classList.contains('taken')) {
            columnScore.classList.add('active');
            columnScore.classList.remove('taken');
        } else if (columnScore.classList.contains('active') && !columnScore.classList.contains('taken')) {
            columnScore.classList.add('taken');
            columnScore.classList.remove('active');
        } else {
            columnScore.classList.remove('taken');
            columnScore.classList.remove('active');
        }

        setColumnTotal();
    }, false);
});

let jokers = document.getElementsByClassName('joker');
Array.prototype.forEach.call(jokers, (joker) => {
    joker.addEventListener('click', () => {
        joker.classList.toggle('used');
        setJokerTotal();
    }, false);
});

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
        console.log(value);
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
function init() {
    setBonusTotal()
    setJokerTotal();
    setColumnTotal();
    setStarTotal();
}

$('totals').addEventListener('click', () => {
    setTotalScore();
}, false);

init();
