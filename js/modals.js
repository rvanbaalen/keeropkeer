import {$, randomString} from "./utilities.js";
import language from "../lang/default.js";
import { renderTemplate } from "./rendering.js";
import {EVENTS, listen} from "./events.js";

export function registerModalEvents() {
    listen(EVENTS.MODAL_TOGGLE, event => {
        const {modalId} = event.detail;
        if ($(modalId)) {
            $(modalId).classList.toggle('show');
        }
    });
    listen(EVENTS.MODAL_HIDE, event => {
        const {modalId} = event.detail;
        if ($(modalId) && $(modalId).classList.contains('show')) {
            $(modalId).classList.remove('show');
        }
    });
    listen(EVENTS.MODAL_SHOW, event => {
        const {modalId} = event.detail;
        if ($(modalId) && !$(modalId).classList.contains('show')) {
            $(modalId).classList.add('show');
        }
    });
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

    let modal = renderTemplate(modalTemplate);
    if (opts.buttons.cancel && typeof opts.buttons.cancel.callback === 'function') {
        modal.querySelector('#' + opts.buttons.cancel.id).addEventListener('click', opts.buttons.cancel.callback, false);
    }
    if (opts.buttons.ok && typeof opts.buttons.ok.callback === 'function') {
        modal.querySelector('#' + opts.buttons.ok.id).addEventListener('click', opts.buttons.ok.callback, false);
    }

    if (opts.selfDestruct) {
        listen(EVENTS.MODAL_HIDE, (event) => {
            const {modalId} = event.detail;
            if (modalId === opts.id) {
                console.log(`Deleting ${opts.id} from the DOM`);
                $(opts.id).delete();
            }
        });
    }

    $('app').append(modal);

    return modal;
}
