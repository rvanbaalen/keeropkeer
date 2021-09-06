import socket from "./socket";
import language from "../lang/default";
import {GameStorage} from "./GameStorage";
import {$, forEachQuery, randomString} from "./utilities";
import {Layout} from "./Layout";

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
        });

        socket.once('lobby:joined', ({lobby}) => {
            this.lobby = lobby;
        });

        socket.once('lobby:created', ({lobby}) => {
            this.lobby = lobby;
        });

        socket.on('player:connected', ({player}) => {
            Lobby.addPlayerToLobby(player);
        });

        socket.on('player:disconnected', ({player}) => {
            Lobby.removePlayerFromLobby(player);
        });
    }

    static loadAvatars() {
        forEachQuery('#players .player:not(.avatar), #activePlayers .player:not(.avatar)', player => {
            const playerName = player.innerText;
            const url = new URL(`https://avatars.dicebear.com/api/bottts/${playerName}.svg?mood[]=happy`);
            player.innerHTML = Layout.renderPlayerAvatar({url, playerName});
            player.classList.add('avatar');
        });
    }

    static getPlayerElement(player) {
        return document.querySelectorAll(`[data-player-id="${player.userId}"]`)[0];
    }

    static addPlayerToLobby(player) {
        const playerElement = Lobby.getPlayerElement(player);
        if (!playerElement) {
            forEachQuery('#players, #activePlayers', playerContainer => {
                playerContainer.innerHTML += Layout.renderPlayer({player});
            });
            Lobby.loadAvatars();
        }
    }

    static removePlayerFromLobby(player) {
        const playerElement = Lobby.getPlayerElement(player);
        if (playerElement) {
            // Player element exists in the DOM
            playerElement.remove();
        }
    }

    static setPlayers(players) {
        forEachQuery('#players, #activePlayers', playerContainer => {
            playerContainer.innerHTML = '';
        });
        if (players.length > 0) {
            players.forEach(player => {
                Lobby.addPlayerToLobby(player);
            });
        }
    }

    static async joinOrCreate(lobbyCode) {
        if (lobbyCode) {
            // Join lobby
            socket.emit('lobby:join', {lobbyCode});
        } else {
            // Create lobby
            let lobbyCode = prompt(language.notification.createLobby, randomString(4).toUpperCase());
            lobbyCode = lobbyCode.toUpperCase();
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

        Lobby.setLobbyCodeDom({code: newLobby.code});
        if (newLobby.players.length > 0) {
            Lobby.setPlayers(newLobby.players);
        }

        this.#lobby = newLobby;
    }

    get lobby() {
        return this.#lobby;
    }

    get playerNames() {
        return this.players.map(p => p.username).join(', ');
    }
}
