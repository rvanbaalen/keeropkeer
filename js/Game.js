import {Lobby} from "./Lobby.js";
import {Level} from "./Level.js";
import {dispatch, EVENTS, listen} from "./events.js";
import {Score} from "./Score.js";
import {$} from "./utilities.js";
import socket from "./socket";
import {GameStorage} from "./GameStorage.js";
import {Player} from "./Player.js";

export class Game {
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];
    static TOTAL_JOKERS = 8;

    static STATE = {
        LEVEL_SELECT: 'levelSelect',
        IN_GAME: 'inGame'
    };

    Lobby;
    Level;
    Score;
    Player;

    #cachedState = false;
    constructor() {
        // Create player and connect to socket
        this.Player = new Player();

        this.registerHandlers();

        socket.on('connect', () => {
            console.clear();
            this.initialize();
        });
    }

    initialize() {
        /*
        Do we have a local state?
        - Yes
        --- Load the current level
        --- Load the current state
        --- Continue where we left off
        - No
        --- Display level selector
        --- Let user set sync game optionally
         */

        // Create new Lobby first
        Lobby.joinOrCreate(Lobby.cachedLobbyCode)
            .then(LobbyInstance => {
                this.Lobby = LobbyInstance;
                // Select new level
                this.Level = new Level(LobbyInstance);
                this.Score = new Score();

                this.start();
            })
            .catch(err => {
                console.error('Failed to create lobby', err);
            })
    }

    registerHandlers() {
        listen(EVENTS.GAME_NEW, () => {
            this.resetState();
            Lobby.setState(Game.STATE.LEVEL_SELECT);
        });
        listen(EVENTS.GAME_RESET, () => {
            // Game is reset, start a new one.
            dispatch(EVENTS.GAME_START);
        });
        listen(EVENTS.GAME_START, () => {
            console.log('Broadcasting GAME START to SOCKET');
            socket.emit('game:start');
        });

        socket.on('game:start', () => {
            console.log('RECEIVED GAME START FROM SERVER');
            this.start();
        });

        socket.on('level:selected', () => {
            this.state = this.createState();
        });

        socket.on('lobby:updated', ({lobby}) => {
            switch (lobby.state) {
                case 'levelSelect':
                    this.Level.select({Player: this.Player, Lobby: this.Lobby});
                    break;
                case 'inGame':
                    this.load();
                    break;
            }
        });
    }

    start() {
        if (!this.state) {
            this.Level.select({Player: this.Player, Lobby: this.Lobby});
        } else {
            // Load state
            this.load();
            Lobby.setState('inGame');
        }
    }

    load() {
        dispatch(EVENTS.MODAL_HIDE, {modalId: 'selectLevelModal'});
        dispatch(EVENTS.RENDER_LEVEL);
    }

    resetState() {
        this.Level.reset();
        this.state = false;

        dispatch(EVENTS.GAME_RESET);
    }

    createState() {
        const self = this;
        console.log('SETTING STATE LEVEL', self.Level.level);
        let state = {
            grid: self.Level.level,
            jokers: [],
            colorScores: {
                high: [],
                low: []
            }
        }, i;
        for (i = 0; i < Game.TOTAL_JOKERS; i++) {
            state.jokers.push({selected: false});
        }
        Game.COLORS.forEach(color => {
            state.colorScores.high.push({
                color: color,
                value: 0
            });
            state.colorScores.low.push({
                color: color,
                value: 0
            });
        });

        return state;
    }

    get state() {
        // If there is no locally cached state value, try to load one from the
        // localStorage and return false if none exist.
        if (!this.#cachedState) {
            this.#cachedState = GameStorage.getItem('state', false);
        }

        return this.#cachedState;
    }

    set state(value) {
        this.#cachedState = value;
        if (!value) {
            GameStorage.removeItem('state');
        } else {
            GameStorage.setItem('state', value);
        }
    }

    updateState(column, index, key, value, type = 'grid') {
        let currentState = this.state;
        let found = false;
        currentState.grid.forEach((stateColumn, stateIndex) => {
            if (stateColumn.column === column) {
                currentState.grid[stateIndex][type][index][key] = value;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
            dispatch(EVENTS.RENDER_LEVEL);
        }
    }

    updateBlockState(col, row, key, value) {
        let currentState = this.state;
        let found = false;
        currentState.grid.forEach((stateColumn, stateIndex) => {
            if (stateColumn.column === col) {
                currentState.grid[stateIndex].grid[row][key] = value;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
            dispatch(EVENTS.RENDER_LEVEL);
        }
    }

    updateJokerState(row, selected) {
        let currentState = this.state;
        let found = false;
        currentState.jokers.forEach((joker, index) => {
            if (index === row) {
                joker.selected = selected;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
            dispatch(EVENTS.RENDER_LEVEL);
        }
    }

    updateColorScoreState(group, color, value) {
        let found = false;
        let currentState = this.state;
        currentState.colorScores[group].forEach((colorScore) => {
            if (colorScore.color === color) {
                colorScore.value = value;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
            dispatch(EVENTS.RENDER_LEVEL);
        }
    }
}
