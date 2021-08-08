let scoreBlocks = document.getElementsByClassName('score-block');
Array.prototype.forEach.call(scoreBlocks, (scoreBlock) => {
    scoreBlock.addEventListener('click', (event) => {
        event.targetElement.classList.toggle('selected');
        console.log(event.targetElement, 'toggled');
    }, false);
});
