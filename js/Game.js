import {Lobby} from "./Lobby.js";
import {Level} from "./Level.js";
import {dispatch, EVENTS, listen} from "./events.js";
import {Score} from "./Score.js";
import socket from "./socket";
import {GameStorage} from "./GameStorage.js";
import {Player} from "./Player.js";
import {Application} from "./Application";

export class Game {
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];
    static TOTAL_JOKERS = 8;

    Lobby;
    Level;
    Score;
    Player;

    #cachedState = false;
    constructor() {
        // Load state from localstorage
        this.state = GameStorage.getItem('state');

        // Create player and connect to socket
        this.Player = new Player();

        socket.on('game:start', () => {
            dispatch(EVENTS.GAME_START);
        });

        socket.on('lobby:updated', ({lobby}) => {
            switch (lobby.state) {
                case 'levelSelect':
                    //this.Level.select({Player: this.Player, Lobby: this.Lobby});
                    break;
                case 'inGame':
                    // this.load();
                    break;
            }
        });

        socket.on('connect', () => {
            this.initialize();
        });

        listen(EVENTS.GAME_CREATE_STATE, () => {
            this.state = this.createState();
        });
        listen(EVENTS.GAME_NEW, () => {
            this.new();
        });
        listen(EVENTS.GAME_START, () => {
            // Level is loaded, state is created, now we need to go
            // ahead and render the game
            this.continue();
        });
        listen(EVENTS.SCORE_TOGGLE_COLUMN, ({element, row, column}) => {
            this.updateState(column, row, 'state', Score.getColumnScoreState(element), 'score');
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
                this.Level = new Level({Lobby: LobbyInstance, Game: this});
                this.Score = new Score();

                // All ready now, start the game
                this.start();
            })
            .catch(err => {
                console.error('Failed to create lobby', err);
            });
    }

    start() {
        if (!this.state) {
            // No state, select a level first.
            //this.Level.select({Player: this.Player, Lobby: this.Lobby});
        } else {
            this.continue();
        }
    }

    new() {
        // Reset state, continue game
        this.resetState();
        Application.navigateTo('levelSelect');
        // Continue rendering the newly created level
        this.start();
    }

    continue() {
        this.state = GameStorage.getItem('state');
        // Load state from localstorage and trigger events to render level
        Application.navigateTo('gameView')
        dispatch(EVENTS.RENDER_LEVEL);
    }

    resetState() {
        this.Level.reset();
        this.state = false;
    }

    createState() {
        let state = {
            grid: this.Level.level,
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
            console.log('Clearing local state');
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
