import {GameStorage} from "./GameStorage";
import language from "../lang/default";

export class Player {
    #cachedPlayer = false;
    constructor() {
        const localPlayer = GameStorage.getItem('player', false);
        if (localPlayer !== false) {
            // A player already exists in the cache.
            this.#cachedPlayer = localPlayer;
        } else {
            // No player exists. Create a new one.
            this.createPlayer();
        }

    }

    createPlayer() {
        const name = prompt(language.notification.playerName);
        this.#cachedPlayer = {
            name, id: Math.floor(Math.random() * 1000)
        };
        GameStorage.setItem('player', this.#cachedPlayer);
    }

    delete() {
        GameStorage.removeItem('player');
    }

    get name() {
        return this.#cachedPlayer.name;
    }

    get id() {
        return this.#cachedPlayer.id;
    }
}
