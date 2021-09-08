import {$, R, randomString} from "./utilities.js";
import language from "../lang/default.js";
import {dispatch, EVENTS, listen} from "./events.js";
import socket from "./socket";

export function registerModalEvents() {
    listen(EVENTS.MODAL_HIDE, event => {
        const {modalId} = event.detail, element = $(modalId);
        if (element && element.classList.contains('show')) {
            element.classList.remove('show');
        }

        if (element.dataset.selfdestruct) {
            element.remove();
        }
    });
    listen(EVENTS.MODAL_SHOW, event => {
        const {modalId} = event.detail;
        if ($(modalId) && !$(modalId).classList.contains('show')) {
            $(modalId).classList.add('show');
        }
    });
}

export class Modals {
    static newGame({modalId = 'newGameModal', message, emit = false} = {}) {
        if (!modalId) {
            modalId = `modal_${randomString(8)}`;
        }

        return createNewModal({
            id: modalId,
            visible: true,
            selfDestruct: true,
            message: message || language.modal.newGame.body,
            buttons: {
                cancel: {
                    id: modalId + 'Cancel',
                    label: language.label.cancel,
                    callback(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        dispatch(EVENTS.MODAL_HIDE, {modalId});
                    }
                },
                ok: {
                    id: modalId + 'Confirm',
                    label: language.label.ok,
                    callback(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        // hide the modal first
                        dispatch(EVENTS.MODAL_HIDE, {modalId});
                        // Reset the game
                        dispatch(EVENTS.GAME_NEW);
                        if (emit) socket.emit('game:new');
                    }
                }
            }
        });
    }
    static showNewGameModal({modalId = 'newGameModal', message, emit = false} = {}) {
        Modals.newGame({modalId, message, emit});
        dispatch(EVENTS.MODAL_SHOW, {modalId});
    }
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
        <div class="modal-overlay${opts.visible ? ' show' : ''}" id="${opts.id}"${opts.selfDestruct ? ' data-selfDestruct="true"' : ''}>
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

    let modal = R(modalTemplate);
    if (opts.buttons.cancel && typeof opts.buttons.cancel.callback === 'function') {
        modal.querySelector('#' + opts.buttons.cancel.id).addEventListener('click', opts.buttons.cancel.callback, false);
    }
    if (opts.buttons.ok && typeof opts.buttons.ok.callback === 'function') {
        modal.querySelector('#' + opts.buttons.ok.id).addEventListener('click', opts.buttons.ok.callback, false);
    }

    $('app').append(modal);

    return modal;
}
