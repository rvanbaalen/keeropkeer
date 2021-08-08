let scoreBlocks = document.getElementsByClassName('score-block');
scoreBlocks.forEach((scoreBlock) => {
    scoreBlock.addEventListener('click', (event) => {
        event.targetElement.classList.toggle('selected');
        console.log(event.targetElement, 'toggled');
    }, false);
});
