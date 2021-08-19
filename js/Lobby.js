import {deleteData, getData, postData} from "./client.js";
import {randomString} from "./utilities.js";
import {dispatch, EVENTS, listen} from "./events.js";
import {GameStorage} from "./GameStorage.js";

export class Lobby {
    lobby = false;
    Player;
    reloading = false;

    constructor(Player) {
        listen(EVENTS.LOBBY_CREATED, (event) => {
            this.lobby = event.detail.lobby;
        });
        listen(EVENTS.LOBBY_JOINED, (event) => {
            this.lobby = event.detail.lobby;
        });

        this.Player = Player;

        this.reloading = setInterval(() => {
            this.reload();
        }, 1000);
    }

    async reload() {
        // Keep getting data
    }

    async create(key = randomString(6)) {
        return await postData('/games', Lobby.template(key, this.Player.id))
            .then(data => this.store(data))
            .then(data => {
                dispatch(EVENTS.LOBBY_CREATED, {lobby: data});
                return data;
            });
    }

    store(data) {
        this.lobby = data;
        GameStorage.setItem('lobby', data.code);

        return data;
    }

    async join(key) {
        return await getData(`/games/${key}`)
            .then(data => {
                if (data.length > 0) {
                    dispatch(EVENTS.LOBBY_JOINED, {lobby: data[0]});
                    return this.store(data[0]);
                }

                return this.create(key);
            });
    }

    static template(gameKey = '', playerId = -1) {
        const newLobby = {...lobbyTemplate};
        newLobby.code = gameKey;
        newLobby.playerId = playerId;

        return newLobby;
    }

    async delete() {
        GameStorage.removeItem('lobby');

        const lobbyId = this.lobby.code;
        if (this.lobby.playerId === this.Player.id) {
            return await deleteData(`/games/${lobbyId}`)
                .then(() => {
                    GameStorage.removeItem('lobby');
                    dispatch(EVENTS.LOBBY_DELETED, {lobbyId});
                });
        }

        return true;
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
