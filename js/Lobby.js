import {getData, postData} from "./client.js";
import {Game} from "./Game.js";
import {randomString} from "./utilities.js";
import {dispatch, EVENTS, listen} from "./eventbus.js";

export default class Lobby {
    lobby = false;
    constructor() {
        listen(EVENTS.LOBBY_CREATED, (event) => {
            this.lobby = event.detail.lobby;
        });
        listen(EVENTS.LOBBY_JOINED, (event) => {
            this.lobby = event.detail.lobby;
        });

        if (!this.lobby) {
            this.joinOrCreate();
        }
    }

    joinOrCreate() {
        const lobby = prompt('Do you want to join or create a lobby', 'create');
        if (lobby === 'create') {
            this.create();
        } else {
            this.join(lobby);
        }
    }

    create(key = randomString(6)) {
        return postData('/games', Game.newGameData(key))
            .then(response => response.json())
            .then(data => {
                dispatch(EVENTS.LOBBY_CREATED, {lobby: data});
                return data;
            });
    }

    join(key) {
        return getData('/games/' + key)
            .then(data => {
                dispatch(EVENTS.LOBBY_JOINED, {lobby: data});
                return data;
            });
    }
}
