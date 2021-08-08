let scoreBlocks = document.querySelectorAll('.score-block:not(.final-score)');
Array.prototype.forEach.call(scoreBlocks, (scoreBlock) => {
    scoreBlock.addEventListener('click', () => {
        scoreBlock.classList.toggle('selected');
        updateScores();
    }, false);
});

let finalScores = document.querySelectorAll('.final-score');
Array.prototype.forEach.call(finalScores, (finalScore) => {
    finalScore.addEventListener('click', () => {
        finalScore.classList.toggle('final-selected');
    }, false);
});

function updateScores() {
    let greens = document.getElementsByClassName('green');
    let greensSelected = document.querySelectorAll('.green.selected');
    let yellows = document.getElementsByClassName('yellow');
    let yellowsSelected = document.querySelectorAll('.yellow.selected');
    let reds = document.getElementsByClassName('red');
    let redsSelected = document.querySelectorAll('.red.selected');
    let blues = document.getElementsByClassName('blue');
    let bluesSelected = document.querySelectorAll('.blue.selected');
    let oranges = document.getElementsByClassName('orange');
    let selectedOranges = document.querySelectorAll('.orange.selected');

    console.log('Greens: ', greens.length - 2, greensSelected.length);
    console.log('Yellows: ', yellows.length - 2, yellowsSelected.length);
    console.log('Reds: ', reds.length - 2, redsSelected.length);
    console.log('Blues: ', blues.length - 2, bluesSelected.length);
    console.log('Oranges: ', oranges.length - 2, selectedOranges.length);
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
    }, false);

    updateScores();
});

let jokers = document.getElementsByClassName('joker');
Array.prototype.forEach.call(jokers, (joker) => {
    joker.addEventListener('click', () => {
        joker.classList.toggle('used');
    }, false);
});
