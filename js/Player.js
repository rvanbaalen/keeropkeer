import {GameStorage} from "./GameStorage";
import language from "../lang/default";
import socket from "./socket";
import {$, randomString} from "./utilities";
import {Notify} from "./Notify";
import {Session} from "./Session";

export class Player {
    #cachedPlayer = false;

    constructor() {
        const sessionId = Session.cachedId;
        if (sessionId !== false) {
            socket.auth = {
                sessionId,
                username: Player.cachedName
            };
            socket.connect();
        } else {
            // No player exists. Create a new one.
            this.createPlayer();
        }

        socket.once('player:created', ({player}) => {
            this.player = player;
        });

        socket.on('player:updated', ({player}) => {
            this.player = player;
        });

        socket.on('player:stats', ({totalPlayers, players}) => {
            Player.setPlayerNamesDom({players});
            Player.setPlayerTotalDom({totalPlayers});
        });

        socket.on('player:connected', (player) => {
            Notify.show({
                title: language.notification.playerJoined.title,
                message: language.notification.playerJoined.message(player.username),
                autoHide: true
            });
        });

        socket.on('player:disconnected', ({player}) => {
            // Notify.show({
            //     title: language.notification.playerDisconnected.title,
            //     message: language.notification.playerDisconnected.message(player.username),
            //     autoHide: true
            // });
        });

        // socket.on('connect', () => {
        //     dispatch(EVENTS.GAME_CONNECTED);
        // });
    }

    static setPlayerTotalDom({totalPlayers}) {
        const totalEl = $('playerTotal');
        if (totalEl) {
            totalEl.innerText = totalPlayers;
        }
    }

    static setPlayerNamesDom({players}) {
        const namesEl = $('playerNames');
        if (namesEl) {
            namesEl.innerText = players.join(', ');
        }
    }

    static setPlayerNameDom({player}) {
        const playerEl = $('playerName');
        if (playerEl) {
            playerEl.innerText = player.username;
        }
    }

    createPlayer() {
        const username = prompt(language.notification.playerName);
        this.player = {username};
        this.connectPlayer(this.player);
    }

    connectPlayer(player) {
        console.log('Connecting player!', player);
        socket.auth = player;
        socket.connect();
    }

    delete() {
        return GameStorage.removeItem('player');
    }

    set player(value) {
        if (!value.username) {
            throw new Error('Invalid player object. No username.');
        }

        this.#cachedPlayer = value;
        GameStorage.setItem('player', value.username);
        Player.setPlayerNameDom(value.username);
    }

    get player() {
        return this.#cachedPlayer;
    }

    static get cachedName() {
        return GameStorage.getItem('player');
    }

    get name() {
        return this.#cachedPlayer.username;
    }

    get id() {
        return this.#cachedPlayer?.id || randomString(6).toLowerCase();
    }
}
