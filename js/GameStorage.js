export class GameStorage {
    static prefix = 'kok_';

    static removeItem(key) {
        return localStorage.removeItem(GameStorage.prefix + key);
    }

    static setItem(key, value = '') {
        return localStorage.setItem(GameStorage.prefix + key, JSON.stringify(value));
    }

    static getItem(key, defaultValue = false) {
        let value = localStorage.getItem(GameStorage.prefix + key);

        if (value === null) {
            return defaultValue;
        }

        return JSON.parse(value);
    }
}
