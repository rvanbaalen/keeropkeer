import {$, forEachQuery} from "./utilities.js";
import {createElement, renderButton} from "./rendering.js";
import {createNewModal, Modals, registerModalEvents} from "./modals.js";
import {dispatch, EVENTS, listen} from "./events.js";
import {Game} from "./Game.js";
import language from "../lang/default.js";
import socket from "./socket";
import {GameStorage} from "./GameStorage";
import {Session} from "./Session";
import {Layout} from "./Layout";
import {Router} from "./Router";
import {Lobby} from "./Lobby";
import {Grid} from "./Grid";

export class Engine {
    currentGame = false;
    router;
    version;
    constructor() {
        $('app').innerHTML += Layout.render();
        this.router = new Router();

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

        socket.on('version', version => {
            GameStorage.setItem('version', version);
        });

        socket.on('session', ({sessionId}) => {
            Session.cachedId = sessionId;
        });

        socket.on('connect', () => {
            document.body.classList.add('connected');
        });
        socket.on('disconnect', () => {
            document.body.classList.remove('connected');

            // Clear player list. They'll reappear once they reconnect
            Lobby.setPlayers([]);
        });

        $('newGameButton').addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const modalId = 'newGameModal';
            Modals.newGame({modalId});

            dispatch(EVENTS.MODAL_SHOW, {modalId: 'newGameModal'});
        }, false);
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
        Layout.renderGrid({columns: state.grid});

        // Colored blocks
        forEachQuery('.score-block:not(.final-score)', block => {
            block.addEventListener('click', (event) => {
                Grid.coloredBlockHandler({block, event, currentGame: this.currentGame});
            }, false);
        });
    }

    parseJokerColumn(state) {
        Layout.renderJokers({jokers: state.jokers});

        // Joker events
        forEachQuery('.joker', (joker, index) => {
            joker.addEventListener('click', (event) => {
                Grid.jokerHandler({joker, currentGame: this.currentGame, index, event});
            }, false);
        });
    }

    parseScoreColumns(state) {
        const valueClass = (value) => {
            if (value === -1) return ' selected';
            if (value === 5 || value === 3) return ' final-selected';
            return '';
        }

        $('scoreColumn1').innerHTML = state.colorScores.high.map(colorScore => {
            return `<span class="score-block final-score ${colorScore.color}${valueClass(5)}" data-color="${colorScore.color}" data-type="colorScore" data-value="5"><span>5</span></span>`;
        }).join('');

        $('scoreColumn2').innerHTML = state.colorScores.low.map(colorScore => {
            return `<span class="score-block final-score ${colorScore.color}${valueClass(3)}" data-color="${colorScore.color}" data-type="colorScore" data-value="3"><span>3</span></span>`;
        }).join('');


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
    }

    parseGrid() {
        const {state} = this.currentGame;
        this.parseColumnGrid(state);
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

    render() {
        this.parseGrid();
        this.parseTotalScores();

        dispatch(EVENTS.SCORE_RELOAD);
    }

    parseColumn(column) {

    }
}
