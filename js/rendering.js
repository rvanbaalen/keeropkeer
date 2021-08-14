import {$} from "./utilities.js";
import {dispatch, EVENTS} from "./eventbus.js";
import {createNewModal, toggleModal} from "./modals.js";
import language from "../lang/default.js";

export function createElement(el, options = {}, appendTo = undefined){
    let element = document.createElement(el);
    Object.keys(options).forEach(function (k){
        element[k] = options[k];
    });
    if (appendTo) {
        appendTo.append(element);
    }

    return element;
}

export function renderTemplate(template) {
    let container = createElement('div');
    container.innerHTML = template;

    return container.firstElementChild;
}

export function renderButton(options = {}) {
    const defaultOptions = {
        callback() {
            return false;
        },
        className: 'button'
    };
    const opts = {...defaultOptions, ...options};
    const buttonTemplate = `<a>${opts.label}</a>`;

    let button = renderTemplate(buttonTemplate, opts);
    if (opts.callback && typeof opts.callback === 'function') {
        button.addEventListener('click', opts.callback, false);
    }
    if (opts.className) {
        button.className = opts.className;
    }
    if (opts.id) {
        button.id = opts.id;
    }

    return button;
}

export function renderNewGameButton() {
    createNewModal({
        id: 'newGameModal',
        message: language.modal.newGame.body,
        buttons: {
            cancel: {
                id: 'newGameModalCancel',
                label: language.label.cancel,
                callback() {
                    const modal = $('newGameModal');
                    modal.classList.remove('show');
                    return false;
                }
            },
            ok: {
                id: 'newGameModalConfirm',
                label: language.label.ok,
                callback() {
                    dispatch(EVENTS.NEW_GAME);
                    return false;
                }
            }
        }
    });

    // New game button
    $('grid').append(
        renderButton({
            callback() {
                toggleModal('newGameModal');
            },
            label: language.label.newGame,
            className: 'new-game',
            id: 'newGame'
        }))
}

export function renderTotalScores() {
    const totalScoresTemplate = `
    <div id="totalScores">
        <div class="totals" id="bonus"><label>${language.label.bonus}</label><span class="label">=</span><span id="bonusTotal" class="totalValue">15</span></div>
        <div class="totals" id="columns"><label>${language.label.columns}</label><span class="label">+</span><span id="columnsTotal" class="totalValue"></span></div>
        <div class="totals" id="jokers"><label>${language.label.jokers}</label><span class="label">+</span><span id="jokerTotal" class="totalValue"></span></div>
        <div class="totals" id="stars"><label>${language.label.stars}</label><span class="label">-</span><span id="starsTotal" class="totalValue"></span></div>
        <div class="totals" id="totals">
            <label>${language.label.totals}</label><span class="label">&nbsp;</span><span id="totalScore" class="totalValue hide"></span>
        </div>
    </div>
    `;

    $('scoreColumn').append(renderTemplate(totalScoresTemplate));
}
