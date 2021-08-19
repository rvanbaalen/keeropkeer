import {$, forEachQuery, randomString} from "./utilities.js";
import language from "../lang/default.js";
import { renderTemplate } from "./rendering.js";
import {dispatch, EVENTS, listen} from "./events.js";

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

export function createLevelSelectModal() {
    // Create new modal and add it to the DOM
    createNewModal({
        id: 'selectLevelModal',
        visible: true,
        message: false,
        body: `
                <div class="new-game-container">
                    <div class="level-image-container">
                        <a href="#">
                            <span>Level 1</span>
                            <img src="/images/level1.png" alt="Level 1" class="level-image" id="level1">
                        </a>
                        <a href="#">
                            <span>Level 2</span>
                            <img src="/images/level2.png" alt="Level 2" class="level-image" id="level2">
                        </a>
                        <a href="#">
                            <span>Level 3</span>
                            <img src="/images/level3.png" alt="Level 3" class="level-image" id="level3">
                        </a>
                        <a href="#">
                            <span>Level 4</span>
                            <img src="/images/level4.png" alt="Level 4" class="level-image" id="level4">
                        </a>
                    </div>
                    <div class="lobby-container">
                        <label for="lobbyKey">Create/join lobby:</label><input maxlength="6" type="text" id="lobbyKey" placeholder="6 letters" required /><button id="randomizeLobby">Random</button><button id="start">Start</button>
                    </div>
                </div>
            `,
        buttons: false
    });

    let selectedLevel = false;
    forEachQuery('.level-image-container a', level => {
        level.addEventListener('click', (event) => {
            event.preventDefault();
            forEachQuery('.level-image-container a', level => {
                level.classList.remove('selected');
            });
            event.target.parentElement.classList.add('selected');
            selectedLevel = event.target.id;
        }, false);
    });

    $('lobbyKey').addEventListener('keyup', (event) => {
        event.target.value = event.target.value.toUpperCase().trim();
    }, false);

    $('start').addEventListener('click',(event) => {
        event.preventDefault();
        if (selectedLevel === false) {
            alert(language.notification.selectLevel);
            return false;
        }

        dispatch(EVENTS.LEVEL_SELECT, {selectedLevel});
        dispatch(EVENTS.LOBBY_JOIN, {lobbyId: $('lobbyKey').value});
    }, false);

    $('randomizeLobby').addEventListener('click',(event) => {
        event.preventDefault();
        $('lobbyKey').value = randomString(6).toUpperCase();
    }, false);
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
