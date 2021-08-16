import {EventRegistry} from "./eventRegistry.js";
import {randomString} from "./utilities";

const newGameData = {
    "code": "",
    "members": [],
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

export class Game {
    static JOKER_VALUE = 1;
    static STAR_VALUE = 2;
    static TOTAL_JOKERS = 8;
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];

    constructor() {
        new EventRegistry();
    }

    static newGameData(gameKey = '') {
        const newGame = {...newGameData};
        newGame.code = gameKey;

        return newGame;
    }
}
