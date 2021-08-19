import {Lobby} from "./Lobby.js";
import {Level} from "./Level.js";
import {dispatch, EVENTS, listen} from "./events.js";
import {Score} from "./Score.js";
import {Player} from "./Player.js";
import {GameStorage} from "./GameStorage.js";

export class Game {
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];
    static TOTAL_JOKERS = 8;

    Lobby;
    Level;
    Score;
    Player;
    State;

    #cachedState = false;
    constructor(offline = false) {
        this.Level = new Level();
        this.Score = new Score();
        this.Player = new Player();
        this.State = new GameStorage();

        listen(EVENTS.GAME_RESET, () => {
            // Game is reset, start a new one.
            dispatch(EVENTS.GAME_START);
        });

        const self = this;
        listen(EVENTS.GAME_NEW, () => {
            self.resetState();
        });
        listen(EVENTS.GAME_START, () => {
            this.start();
        });
        listen(EVENTS.LOBBY_JOIN, (event) => {
            const {lobbyId} = event.detail;
            // Join a new lobby
            this.Lobby = new Lobby(this.Player);
            this.Lobby.join(lobbyId).then((lobby) => {
                dispatch(EVENTS.LOBBY_READY, {lobby});
            });
        });

        if (offline) {
            listen(EVENTS.LEVEL_LOADED, () => {
                console.log('creating offline state');
                this.state = this.createState();
                dispatch(EVENTS.RENDER_LEVEL);
            });
        } else {
            listen(EVENTS.LOBBY_READY, () => {
                console.log('creating state');
                this.state = this.createState();
                dispatch(EVENTS.RENDER_LEVEL);
            });
        }

        console.log('New Game', this);
    }

    start() {
        if (this.state === false) {
            console.log('no state');
            // New Game
            this.Level.select();
        } else {
            console.log('load state');
            // Load game
            this.loadGame();
        }
    }

    loadGame() {
        this.Lobby = new Lobby(this.Player);
        this.Lobby.join(GameStorage.getItem('lobby')).then(() => {
            dispatch(EVENTS.RENDER_LEVEL);
        });
    }

    resetState() {
        this.Level.reset();
        this.Lobby.delete();
        GameStorage.removeItem('state');
        this.#cachedState = false;

        dispatch(EVENTS.GAME_RESET);
    }

    createState() {
        const self = this;
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
        if (this.#cachedState === false) {
            return GameStorage.getItem('state', false);
        }

        return this.#cachedState;
    }

    set state(value) {
        GameStorage.setItem('state', value);
        this.#cachedState = value;
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
