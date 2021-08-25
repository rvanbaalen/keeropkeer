import socket from "./socket";
import {Notify} from "./Notify";
import language from "../lang/default";
import {GameStorage} from "./GameStorage";
import {$, randomString} from "./utilities";

export class Lobby {
    #lobby = false;
    state = false;

    constructor(lobbyData) {
        this.lobby = lobbyData;

        socket.on('player:stats', ({player}) => {
            Lobby.setLobbyCodeDom({code: player.lobbyCode});
        });

        socket.on('lobby:updated', ({lobby}) => {
            this.lobby = lobby;
            Lobby.setLobbyCodeDom({code: this.lobby.code});
        });

        socket.once('lobby:joined', ({lobby}) => {
            this.lobby = lobby;
        });

        socket.once('lobby:created', ({lobby}) => {
            this.lobby = lobby;
        });
    }

    static async joinOrCreate(lobbyCode) {
        if (lobbyCode) {
            // Join lobby
            socket.emit('lobby:join', {lobbyCode});
        } else {
            // Create lobby
            const lobbyCode = prompt(language.notification.createLobby, randomString(4).toUpperCase());
            socket.emit('lobby:create', {lobbyCode});
        }

        return new Promise((resolve, reject) => {
            socket.once('lobby:joined', ({lobby}) => {
                resolve(new Lobby(lobby));
            });

            socket.once('lobby:created', ({lobby}) => {
                resolve(new Lobby(lobby));
            });

            setTimeout(() => {
                reject('Lobby creation timeout.');
            }, 10000);
        });
    }

    static setLobbyCodeDom({code}) {
        const lobbyEl = $('lobbyCode');
        if (lobbyEl) {
            lobbyEl.innerText = code;
        }
    }

    static setState(state) {
        socket.emit('lobby:state', {key: 'state', value: state})
    }

    leave() {
        socket.emit('lobby:leave', {lobbyCode: this.code});
    }

    get players() {
        return this.lobby?.players || [];
    }

    get code() {
        return this.lobby?.code;
    }

    static get cachedLobbyCode() {
        return GameStorage.getItem('lobby', false);
    }

    get state() {
        return this.lobby?.state;
    }

    set lobby(newLobby) {
        if (newLobby.code !== this.#lobby.code) {
            // Store the new value in the local storage as well.
            GameStorage.setItem('lobby', newLobby.code);
        }

        this.#lobby = newLobby;
    }

    get lobby() {
        return this.#lobby;
    }

    get playerNames() {
        return this.players.map(p => p.username).join(', ');
    }

    static template(gameKey = '', playerId = -1) {
        const newLobby = {...lobbyTemplate};
        newLobby.code = gameKey;
        newLobby.playerId = playerId;

        return newLobby;
    }
}

const lobbyTemplate = {
    "members": [],
    "playerId": -1,
    "code": "KOK123",
    "data": {
        "columnScores": {
            "A": -1,
            "B": -1,
            "C": -1,
            "D": -1,
            "E": -1,
            "F": -1,
            "G": -1,
            "H": -1,
            "I": -1,
            "J": -1,
            "K": -1,
            "L": -1,
            "M": -1,
            "N": -1,
            "O": -1
        },
        "colorScores": {
            "high": {
                "yellow": -1,
                "green": -1,
                "blue": -1,
                "red": -1,
                "orange": -1
            },
            "low": {
                "yellow": -1,
                "green": -1,
                "blue": -1,
                "red": -1,
                "orange": -1
            }
        }
    }
};
