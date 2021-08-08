let scoreBlocks = document.getElementsByClassName('score-block');
Array.prototype.forEach.call(scoreBlocks, (scoreBlock) => {
    scoreBlock.addEventListener('click', (event) => {
        scoreBlock.classList.toggle('selected');
    }, false);
});

let columnScores = document.getElementsByClassName('column-score');
Array.prototype.forEach.call(columnScores, (columnScore) => {
    columnScore.addEventListener('click', (event) => {
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
});
