import {$} from "./utilities.js";
import {dispatch, EVENTS, listen, listenOnce} from "./events.js";
import socket from "./socket";

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
        listen(EVENTS.SCORE_TOTAL_TOGGLE, () => this.toggleTotalScore());

        socket.on('grid:column-completed', ({columnLetter, player, first}) => {
            const row = first ? 0 : 1;
            const el = document.querySelectorAll(`.column-score[data-column="${columnLetter}"][data-row="${row}"]`)[0]
            if (el) {
                dispatch(EVENTS.SCORE_TOGGLE_COLUMN, {element: el, row, column: columnLetter});
                dispatch(EVENTS.SCORE_RELOAD);
            }
        });
    }

    static getColumnScoreState(element) {
        if (!element) {
            return "default";
        }

        if (!element.classList.contains('active') && !element.classList.contains('taken')) {
            return 'active';
        } else if (element.classList.contains('active') && !element.classList.contains('taken')) {
            return 'taken';
        }

        return 'default';
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
        const element = $('totalScore');
        if (element.classList.contains('hide')) {
            element.classList.remove('hide');
            this.renderTotalScore();
        } else {
            element.innerText = '';
            element.classList.add('hide');
        }
    }

    renderBonusScore(value) {
        $('bonusTotal').innerText = value;
        this.renderTotalScore();
    }

    renderColumnScore(value) {
        $('columnsTotal').innerText = value;
        this.renderTotalScore();
    }

    renderJokerScore(value) {
        $('jokerTotal').innerText = value;
        this.renderTotalScore();
    }

    renderStarScore(value) {
        $('starsTotal').innerText = value;
        this.renderTotalScore();
    }

    renderTotalScore() {
        const el = $('totalScore');
        if (!el.classList.contains('hide')) {
            console.log('set total', this.total);
            el.innerText = this.total;
        }
    }
}
