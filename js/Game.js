import {EventRegistry} from "./eventRegistry.js";

export class Game {
    static JOKER_VALUE = 1;
    static STAR_VALUE = 2;
    static TOTAL_JOKERS = 8;
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];

    constructor() {
        new EventRegistry();
    }
}
