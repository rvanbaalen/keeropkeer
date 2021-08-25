import {GameStorage} from "./GameStorage.js";

export class Session {
    constructor() {
    }

    static get cachedId() {
        return GameStorage.getItem('sessionId');
    }

    static set cachedId(newValue) {
        return GameStorage.setItem('sessionId', newValue);
    }
}
