import {$} from "./utilities.js";
import {createElement, renderButton} from "./rendering.js";
import {createNewGameModal, createNewModal, registerModalEvents} from "./modals.js";
import {dispatch, EVENTS, listen} from "./events.js";
import {Game} from "./Game.js";
import language from "../lang/default.js";
import socket from "./socket";
import {GameStorage} from "./GameStorage";
import {Session} from "./Session";
import {Layout} from "./Layout";
import {Application} from "./Application";

export class Engine {
    currentGame = false;
    application;
    version;
    constructor() {
        $('app').innerHTML += Layout.render();
        this.application = new Application();

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
        listen(EVENTS.RENDER_SCORES, (event) => {
            const {scores} = event.detail, Score = this.currentGame.Score;
            if (typeof scores.bonus !== 'undefined') {
                Score.renderBonusScore(scores.bonus);
            }
            if (typeof scores.columns !== 'undefined') {
                Score.renderColumnScore(scores.columns);
            }
            if (typeof scores.jokers !== 'undefined') {
                Score.renderJokerScore(scores.jokers);
            }
            if (typeof scores.stars !== 'undefined') {
                Score.renderStarScore(scores.stars);
            }
        });

        socket.on('grid:column-completed', ({columnLetter, player}) => {

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
        const blockGrid = $('blockGrid');
        blockGrid.innerHTML = '';
        state.grid.forEach(column => {
            blockGrid.innerHTML += this.parseColumn(column);
        });

        // Colored blocks
        let scoreBlocks = document.querySelectorAll('.score-block:not(.final-score)');
        Array.prototype.forEach.call(scoreBlocks, (block) => {
            block.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                let selected = !block.classList.contains('selected');
                this.currentGame.updateBlockState(block.dataset.column, block.dataset.row, 'selected', selected);
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
        jokerContainer.innerHTML = state.jokers.map(joker => {
            return `<span class="joker${joker.selected ? ' used' : ''}">!</span>`
        }).join('');

        // Joker events
        let jokers = document.getElementsByClassName('joker');
        Array.prototype.forEach.call(jokers, (joker, index) => {
            joker.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                let selected = !joker.classList.contains('used');
                this.currentGame.updateJokerState(index, selected);
                dispatch(EVENTS.JOKER_SELECTED, {joker, selected});
            }, false);
        });
    }

    parseScoreColumns(state) {
        $('scoreColumn1').innerHTML = state.colorScores.high.map(colorScore => {
            const valueClass = (value) => {
                if (value === -1) return ' selected';
                if (value === 5) return ' final-selected';
                return '';
            }

            return `<span class="score-block final-score ${colorScore.color}${valueClass(colorScore.value)}"><span>5</span></span>`;
        }).join('');
        // state.colorScores.high.forEach(colorScore => {
        //     let element = createElement('span', {className: 'score-block final-score ' + colorScore.color});
        //     if (colorScore.value === -1) {
        //         element.classList.add('selected');
        //     }
        //     if (colorScore.value === 5) {
        //         element.classList.add('final-selected');
        //     }
        //     createElement('span', {innerText: 5}, element);
        //     $('scoreColumn1').append(element);
        // });

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
            highScore.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

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
            lowScore.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

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
            columnScore.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                dispatch(EVENTS.SCORE_TOGGLE_COLUMN, {
                    column: columnScore.dataset.column,
                    element: columnScore
                })
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
                <div class="totals" id="bonus"><label class="rainbow">${language.label.bonus}</label><span class="label">=</span><span id="bonusTotal" class="totalValue">15</span></div>
                <div class="totals" id="columns"><label>${language.label.columns}</label><span class="label">+</span><span id="columnsTotal" class="totalValue"></span></div>
                <div class="totals" id="jokers"><label>${language.label.jokers}</label><span class="label">+</span><span id="jokerTotal" class="totalValue"></span></div>
                <div class="totals" id="stars"><label>${language.label.stars}</label><span class="label">-</span><span id="starsTotal" class="totalValue"></span></div>
                <div class="totals" id="totals">
                    <label>${language.label.totals}</label><span class="label">&nbsp;</span><span id="totalScore" class="totalValue hide"></span>
                </div>
            </div>
        `;

        $('scoreColumn').innerHTML += totalScoresTemplate;

        $('totals').addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            dispatch(EVENTS.SCORE_TOTAL_TOGGLE);
        }, false);
    }

    renderNewGameButton(callback) {
        const id = 'newGameButton';
        if ($(id)) {
            return;
        }

        const button = renderButton({
            callback, id,
            label: language.label.newGame,
            className: 'new-game',
        });

        // New game button
        $('gameView').append(button);

        return button;
    }

    render(state) {
        this.parseGrid(state);
        this.parseTotalScores();

        const modalId = 'newGameModal';
        if (!$(modalId)) {
            createNewGameModal({modalId});
        }

        this.renderNewGameButton((event) => {
            event.preventDefault()
            dispatch(EVENTS.MODAL_SHOW, {modalId});
        });

        dispatch(EVENTS.SCORE_RELOAD);
    }

    parseColumn(column) {
        let blocks = column.grid.length, selectedBlocks = 0;

        let tpl = `
            <div class="column${column.column === 'H' ? ' highlight' : ''}">
                <span class="rounded-block" data-letter="${column.column}">${column.column}</span>
                ${renderColumnBlocks(column.grid)}
                <div class="column-score">${renderColumnScores(column.score)}</div>
            </div>
        `;

        // create grid blocks
        function renderColumnBlocks(blocks) {
            return blocks.map((block, index) => {
                if (block.selected) selectedBlocks++;

                return `
                    <span class="score-block${block.selected ? ' selected' : ''} ${block.color}" data-column="${column.column}" data-row="${index}">
                        ${block.star ? `<span class="star">*</span>` : ``}
                    </span>
                `;
            }).join('');
        }
        // create score columns
        //let score = createElement('div', {className: 'column-score'});
        function renderColumnScores(scores) {
            return scores.map((scoreObject, index) => {
                let state = (scoreObject.state && scoreObject.state !== 'default') ? ' ' + scoreObject.state : '';
                return `<span class="rounded-block column-score${state}" data-column="${column.column}" data-row="${index}">${scoreObject.value}</span>`;
            }).join('');
        }

        if (blocks === selectedBlocks) {
            socket.emit('grid:column-complete', {columnLetter: column.column});
        }

        return tpl;
    }
}
