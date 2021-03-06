import {Lobby} from "./Lobby.js";
import {Level} from "./Level.js";
import {dispatch, EVENTS, listen} from "./events.js";
import {Score} from "./Score.js";
import socket from "./socket";
import {GameStorage} from "./GameStorage.js";
import {Player} from "./Player.js";
import {Router} from "./Router";

export class Game {
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];
    static TOTAL_JOKERS = 8;

    initialized = false;

    Lobby;
    Level;
    Score;
    Player;

    #cachedState = false;
    constructor() {
        // Create player and connect to socket
        this.Player = new Player();

        socket.on('game:start', () => {
            dispatch(EVENTS.GAME_START);
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
        listen(EVENTS.UPDATE_GRID_BLOCK, (event) => {
            const {gridBlock} = event.detail;
            this.updateBlockState({gridBlock});
        });
        listen(EVENTS.JOKER_SELECTED, (event) => {
            const {joker} = event.detail;
            this.updateJokerState({joker});
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
                this.Score = new Score({Game: this});

                // All ready now, start the game
                this.start();
                this.initialized = true;
            })
            .catch(err => {
                console.error('Failed to create lobby', err);
                this.initialized = false;
            });
    }

    start() {
        if (!this.state) {
            // No state, select a level first.
            Router.navigateTo('levelSelect');
        } else {
            this.continue();
        }
    }

    new() {
        // Reset state, continue game
        this.resetState();
        // Continue rendering the newly created level
        this.start();
    }

    continue() {
        // Load state from localstorage and trigger events to render level
        Router.navigateTo('gameView')
        dispatch(EVENTS.RENDER_LEVEL);
    }

    resetState() {
        this.Level.reset();
        this.state = false;
        GameStorage.removeItem('columnScore');
        GameStorage.removeItem('colorScore');
    }

    createState() {
        let state = {
            grid: this.Level.getGrid(),
            jokers: [],
            colorScores: {}
        }, i;
        for (i = 0; i < Game.TOTAL_JOKERS; i++) {
            state.jokers.push({selected: false});
        }

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

    /**
     * @param {GridBlock} gridBlock
     */
    updateBlockState({gridBlock}) {
        let currentState = this.state;
        let updateState = false;
        currentState.grid.forEach((stateColumn, stateIndex) => {
            if (stateColumn.column === gridBlock.letter) {
                currentState.grid[stateIndex].grid[gridBlock.row]['selected'] = gridBlock.selected;
                updateState = true;
            }
        });

        if (updateState) {
            this.state = currentState;
        }
    }

    /**
     *
     * @param {JokerScoreBlock} joker
     */
    updateJokerState({joker}) {
        let currentState = this.state;
        let found = false;
        currentState.jokers.forEach((stateJoker, index) => {
            if (index === joker.row) {
                stateJoker.selected = joker.selected;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
        }
    }
}
