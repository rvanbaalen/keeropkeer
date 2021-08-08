let scoreBlocks = document.getElementsByClassName('score-block');
Array.prototype.forEach.call(scoreBlocks, (scoreBlock) => {
    scoreBlock.addEventListener('click', (event) => {
        scoreBlock.classList.toggle('selected');
        console.log(event.targetElement, 'toggled');
    }, false);
});
