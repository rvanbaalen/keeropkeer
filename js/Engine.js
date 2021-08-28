import {$} from "./utilities.js";
import {createElement, renderButton, renderTemplate} from "./rendering.js";
import {createNewGameModal, createNewModal, registerModalEvents} from "./modals.js";
import {dispatch, EVENTS, listen} from "./events.js";
import {Game} from "./Game.js";
import language from "../lang/default.js";
import socket from "./socket";
import {GameStorage} from "./GameStorage";
import {Session} from "./Session";

export class Engine {
    currentGame = false;
    version;
    constructor() {
        registerModalEvents();

        this.currentGame = new Game();
        this.parseOrientationOverlay();
        this.parseGenericLoading();

        $('connecting-message').innerText = language.messages.connecting;

        listen(EVENTS.LOADING, () => {
            dispatch(EVENTS.MODAL_SHOW, {modalId: 'genericLoading'});
        });
        listen(EVENTS.RENDER_LEVEL, () => {
            this.render();
        });
        listen(EVENTS.RENDER_JOKER_SCORE, (event) => {
            this.renderJokerScore(event.detail.value)
        })
        listen(EVENTS.RENDER_SCORES, (event) => {
            const {scores} = event.detail;
            if (typeof scores.bonus !== 'undefined') {
                this.renderBonusScore(scores.bonus);
            }
            if (typeof scores.columns !== 'undefined') {
                this.renderColumnScore(scores.columns);
            }
            if (typeof scores.jokers !== 'undefined') {
                this.renderJokerScore(scores.jokers);
            }
            if (typeof scores.stars !== 'undefined') {
                this.renderStarScore(scores.stars);
            }
        });

        socket.on('version', version => {
            GameStorage.setItem('version', version);
        });

        socket.on('session', ({sessionId}) => {
            Session.cachedId = sessionId;
        });

        socket.on('connect', () => {
            document.body.classList.toggle('connected');
        });
        socket.on('disconnect', () => {
            document.body.classList.toggle('connected');
        });
    }

    renderBonusScore(value) {
        $('bonusTotal').innerText = value;
    }

    renderColumnScore(value) {
        $('columnsTotal').innerText = value;
    }

    renderJokerScore(value) {
        $('jokerTotal').innerText = value;
    }

    renderStarScore(value) {
        $('starsTotal').innerText = value;
    }

    parseOrientationOverlay() {
        createNewModal({
            id: 'orientationModal',
            message: language.notification.landscapeMode
        });
    }

    parseGenericLoading() {
        createNewModal({
            visible: false,
            id: 'genericLoading',
            message: 'Aan het laden.. een moment geduld.'
        });
    }

    parseColumnGrid(state) {
        $('blockGrid').innerHTML = '';
        state.grid.forEach(column => {
            $('blockGrid').append(this.parseColumn(column));
        });

        // Colored blocks
        let scoreBlocks = document.querySelectorAll('.score-block:not(.final-score)');
        Array.prototype.forEach.call(scoreBlocks, (block) => {
            block.addEventListener('click', () => {
                let selected = !block.classList.contains('selected');
                this.currentGame.updateBlockState(block.data.column, block.data.row, 'selected', selected);
                dispatch(EVENTS.GRID_BLOCK_SELECTED, {selected, block});
                if (block.querySelectorAll('.star').length > 0) {
                    // Has a star, update star score.
                    dispatch(EVENTS.STAR_SELECTED, {selected, block});
                }
            }, false);
        });
    }

    parseJokerColumn(state) {
        let jokerContainer = $('jokerContainer');
        jokerContainer.innerHTML = '';
        state.jokers.forEach(joker => {
            let renderedJoker = createElement('span', {className: 'joker', innerText: '!'});
            if (joker.selected) {
                renderedJoker.classList.add('used');
            }
            jokerContainer.append(renderedJoker);
        });

        // Joker events
        let jokers = document.getElementsByClassName('joker');
        Array.prototype.forEach.call(jokers, (joker, index) => {
            joker.addEventListener('click', () => {
                let selected = !joker.classList.contains('used');
                this.currentGame.updateJokerState(index, selected);
                dispatch(EVENTS.JOKER_SELECTED, {joker, selected});
            }, false);
        });
    }

    parseScoreColumns(state) {
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
            Game.COLORS.forEach(mappedColor => {
                if (element.classList.contains(mappedColor)) {
                    color = mappedColor;
                }
            });

            return color;
        };
        let highScores = document.querySelectorAll('#scoreColumn1 .final-score');
        Array.prototype.forEach.call(highScores, (highScore) => {
            highScore.addEventListener('click', () => {
                this.currentGame.updateColorScoreState(
                    'high',
                    getColorFromElement(highScore),
                    getValueFromClass(highScore, 5, -1)
                );

                dispatch(EVENTS.SCORE_RELOAD);
            }, false);
        });
        let lowScores = document.querySelectorAll('#scoreColumn2 .final-score');
        Array.prototype.forEach.call(lowScores, (lowScore) => {
            lowScore.addEventListener('click', () => {
                this.currentGame.updateColorScoreState(
                    'low',
                    getColorFromElement(lowScore),
                    getValueFromClass(lowScore, 3, -1)
                );

                dispatch(EVENTS.SCORE_RELOAD);
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

                this.currentGame.updateState(col, row, 'state', state, 'score');
                dispatch(EVENTS.SCORE_RELOAD);
            }, false);
        });
    }

    parseGrid() {
        this.parseColumnGrid(this.currentGame.state);
        this.parseJokerColumn(this.currentGame.state);
        this.parseScoreColumns(this.currentGame.state);

        dispatch(EVENTS.GRID_RENDER_COMPLETE);
    }

    parseTotalScores() {
        if ($('totalScores')) {
            return;
        }

        const totalScoresTemplate = `
            <div id="totalScores">
                <div class="totals" id="bonus"><label>${language.label.bonus}</label><span class="label">=</span><span id="bonusTotal" class="totalValue">15</span></div>
                <div class="totals" id="columns"><label>${language.label.columns}</label><span class="label">+</span><span id="columnsTotal" class="totalValue"></span></div>
                <div class="totals" id="jokers"><label>${language.label.jokers}</label><span class="label">+</span><span id="jokerTotal" class="totalValue"></span></div>
                <div class="totals" id="stars"><label>${language.label.stars}</label><span class="label">-</span><span id="starsTotal" class="totalValue"></span></div>
                <div class="totals" id="totals">
                    <label>${language.label.totals}</label><span class="label">&nbsp;</span><span id="totalScore" class="totalValue hide"></span>
                </div>
            </div>
        `;

        $('scoreColumn').append(renderTemplate(totalScoresTemplate));

        $('totals').addEventListener('click', () => {
            dispatch(EVENTS.SCORE_SHOW);
        }, false);
    }

    renderNewGameButton(callback) {
        const id = 'newGame';
        if ($(id)) {
            return;
        }

        const button = renderButton({
            callback, id,
            label: language.label.newGame,
            className: 'new-game',
        });

        // New game button
        $('grid').append(button);

        return button;
    }

    render(state) {
        this.parseGrid(state);
        this.parseTotalScores();

        const modalId = 'newGameModal';
        createNewGameModal({modalId});
        this.renderNewGameButton((event) => {
            event.preventDefault()
            dispatch(EVENTS.MODAL_SHOW, {modalId});
        });

        dispatch(EVENTS.SCORE_RELOAD);
    }

    parseColumn(column) {
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

        let blocks = columnTemplate.querySelectorAll('.score-block');
        let selectedBlocks = columnTemplate.querySelectorAll('.selected');
        let columnLetter = columnTemplate.querySelector('.letter').innerText.toUpperCase();
        if (blocks.length === selectedBlocks.length) {
            socket.emit('grid:column-complete', {columnLetter})
        }

        return columnTemplate;
    }
}
