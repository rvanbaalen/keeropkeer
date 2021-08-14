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
            label: 'New Game',
            className: 'new-game',
            id: 'newGame'
        }))
}
