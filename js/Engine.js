import {$} from "./utilities.js";
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
import {ColorScoreBlock, Grid} from "./Block";

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
            dispatch('delegation.destroy');
        });
        socket.on('game:confirm-new', ({player}) => {
            Modals.showNewGameModal({
                message: `Speler ${player.username} start een nieuw spel. Wil jij ook opnieuw beginnen?`,
                emit: false
            });
        });

        $('newGameButton').addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            Modals.showNewGameModal({emit: true});
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
    }

    parseJokerColumn(state) {
        Layout.renderJokers({jokers: state.jokers});
    }

    parseScoreColumns() {
        $('scoreColumn1').innerHTML = Game.COLORS.map(color => {
            return new ColorScoreBlock({value: 5, color}).render();
        }).join('');

        $('scoreColumn2').innerHTML = Game.COLORS.map(color => {
            return new ColorScoreBlock({value: 3, color}).render();
        }).join('');

        Game.COLORS.map(color => {
            Grid.setColorScoreState({color});
        });
    }

    parseGrid() {
        const {state} = this.currentGame;
        this.parseColumnGrid(state);
        this.parseJokerColumn(this.currentGame.state);
        this.parseScoreColumns(this.currentGame.state);
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

    render() {
        this.parseGrid();
        this.parseTotalScores();

        dispatch(EVENTS.SCORE_RELOAD);
    }
}
