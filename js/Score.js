import {$} from "./utilities.js";
import {EVENTS, listen} from "./events.js";

export class Score {
    static JOKER_VALUE = 1;
    static STAR_VALUE = -2;

    constructor() {
        listen(EVENTS.JOKER_SELECTED, event => {
            dispatch(EVENTS.RENDER_SCORES, {scores: {jokers: this.jokerScore}});
        });
        listen(EVENTS.STAR_SELECTED, () => {
            dispatch(EVENTS.RENDER_SCORES, {scores: {stars: this.starScore}});
        });
        listen(EVENTS.SCORE_RELOAD, () => {
            dispatch(EVENTS.RENDER_SCORES, {
                scores: {
                    bonus: this.bonusScore,
                    columns: this.columnScore,
                    jokers: this.jokerScore,
                    stars: this.starScore,
                    total: this.total
                }
            });
        });
        listen(EVENTS.SCORE_TOTAL_TOGGLE, () => {
            this.toggleTotalScore();
        });
    }

    get total() {
        return this.bonusScore + this.columnScore + this.jokerScore + this.starScore;
    }

    get columnScore() {
        let activeColumns = document.querySelectorAll('span.column-score.active');
        let totalValue = 0;
        Array.prototype.forEach.call(activeColumns, (activeColumn) => {
            let value = parseInt(activeColumn.innerText);
            totalValue += value;
        });

        return totalValue;
    }

    get jokerScore() {
        let jokers = document.getElementsByClassName('joker');
        let totalJokers = jokers.length;
        let usedJokers = 0;
        Array.prototype.forEach.call(jokers, (joker) => {
            if (joker.classList.contains('used')) {
                usedJokers++;
            }
        });

        return (totalJokers - usedJokers) * Score.JOKER_VALUE;
    }

    get bonusScore() {
        let bonuses = document.querySelectorAll('.final-selected span');
        let bonusTotal = 0;
        Array.prototype.forEach.call(bonuses, (bonus) => {
            bonusTotal += parseInt(bonus.innerText);
        });

        return bonusTotal;
    }

    get starScore() {
        const activeStars = document.querySelectorAll('span.selected span.star').length;
        const totalStars = document.querySelectorAll('span.star').length;

        return (totalStars - activeStars) * Score.STAR_VALUE;
    }

    toggleTotalScore() {
        let element = $('totalScore');
        if (element.classList.contains('hide')) {
            element.innerText = this.total;
            element.classList.remove('hide');
        } else {
            element.innerText = '';
            element.classList.add('hide');
        }
    }
}
