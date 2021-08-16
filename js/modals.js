import {$, randomString} from "./utilities.js";
import language from "../lang/default.js";
import { renderTemplate } from "./rendering.js";
import {dispatch, EVENTS, listen, registerEvents} from "./eventbus";

export function registerModalEvents() {
    registerEvents([
        {
            name: EVENTS.MODAL_TOGGLE,
            callback(event) {
                if ($(event.detail.modalId)) {
                    $(event.detail.modalId).classList.toggle('show');
                }
            }
        },
        {
            name: EVENTS.MODAL_HIDE,
            callback(event) {
                if ($(event.detail.modalId) && $(event.detail.modalId).classList.contains('show')) {
                    $(event.detail.modalId).classList.remove('show');
                }
            }
        },
        {
            name: EVENTS.MODAL_SHOW,
            callback(event) {
                if ($(event.detail.modalId) && !$(event.detail.modalId).classList.contains('show')) {
                    $(event.detail.modalId).classList.add('show');
                }
            }
        }
    ]);
}

export function createNewModal(options) {
    const defaultOptions = {
        id: 'modal-' + randomString(),
        message: 'No modal message is set.',
        buttons: false,
        appendTo: '#app',
        visible: false
    };
    let opts = {...defaultOptions, ...options};

    if (opts.buttons === true) {
        opts.buttons = {
            cancel: {
                id: opts.id + '-cancel',
                label: language.label.cancel
            },
            ok: {
                id: opts.id + '-ok',
                label: language.label.ok
            }
        };
    }

    const modalTemplate = `
        <div class="modal-overlay${opts.visible ? ' show' : ''}" id="${opts.id}">
            <div class="modal-container">
                ${opts.title ? `
                <div class="modal-title">
                    <h2>${opts.title}</h2>
                </div>
                ` : ``}
                ${opts.body && !opts.message ? opts.body : `
                <div class="modal-body">
                    <p>${opts.message}</p>
                </div>
                `}
                ${opts.buttons ? `
                <div class="modal-button-bar">
                    ${opts.buttons.cancel ? `<a href="#" id="${opts.buttons.cancel.id}" class="button button-cancel">${opts.buttons.cancel.label}</a>` : ``}
                    ${opts.buttons.ok ? `<a href="#" id="${opts.buttons.ok.id}" class="button button-confirm">${opts.buttons.ok.label}</a>` : ``}
                </div>
                ` : ``}
            </div>
        </div>
    `;

    let modal = renderTemplate(modalTemplate, opts);
    if (opts.buttons.cancel && typeof opts.buttons.cancel.callback === 'function') {
        modal.querySelector('#' + opts.buttons.cancel.id).addEventListener('click', opts.buttons.cancel.callback, false);
    }
    if (opts.buttons.ok && typeof opts.buttons.ok.callback === 'function') {
        modal.querySelector('#' + opts.buttons.ok.id).addEventListener('click', opts.buttons.ok.callback, false);
    }

    $('app').append(modal);

    return modal;
}

export function createNewGameModal() {
    const modalId = 'newGameModal';
    return createNewModal({
        id: modalId,
        message: language.modal.newGame.body,
        buttons: {
            cancel: {
                id: modalId + 'Cancel',
                label: language.label.cancel,
                callback(event) {
                    event.preventDefault();
                    dispatch(EVENTS.MODAL_TOGGLE, {modalId});
                }
            },
            ok: {
                id: modalId + 'Confirm',
                label: language.label.ok,
                callback(event) {
                    event.preventDefault();
                    // hide the modal first
                    dispatch(EVENTS.MODAL_TOGGLE, {modalId});
                    // Reset the game
                    dispatch(EVENTS.GAME_NEW);
                }
            }
        }
    });
}
