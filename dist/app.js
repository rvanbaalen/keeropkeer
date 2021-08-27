function $(id) {
    return document.getElementById(id);
}

function randomString(length = 6) {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, length);
}

function forEachQuery(query, callback) {
    Array.prototype.forEach.call(
        document.querySelectorAll(query), callback
    );
}

function createElement(el, options = {}, appendTo = undefined){
    let element = document.createElement(el);
    Object.keys(options).forEach(function (k){
        element[k] = options[k];
    });
    if (appendTo) {
        appendTo.append(element);
    }

    return element;
}

function renderTemplate(template) {
    let container = createElement('div');
    container.innerHTML = template;

    return container.firstElementChild;
}

function renderButton(options = {}) {
    const defaultOptions = {
        callback() {
            return false;
        },
        className: 'button'
    };
    const opts = {...defaultOptions, ...options};
    const buttonTemplate = `<a>${opts.label}</a>`;

    let button = renderTemplate(buttonTemplate);
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

var nl = {
    modal: {
        newGame: {
            body: 'Weet je zeker dat je een nieuw spel wil beginnen?'
        }
    },
    label: {
        cancel: 'Annuleren',
        ok: 'OK',
        newGame: 'Nieuw spel',
        bonus: 'bonus',
        columns: 'A-O',
        stars: 'Sterren',
        totals: 'Totaal',
        jokers: 'Jokers'
    },
    notification: {
        landscapeMode: 'Draai het scherm horizontaal om te beginnen.',
        selectLevel: 'Selecteer een level.',
        playerName: 'Wat is je naam?',
        createLobby: 'Kies een spelcode:',
        creatingLobby: 'Bezig met het aanmaken van de lobby...',
        playerJoined: {
            title: 'Een speler is verbonden',
            message(username = 'onbekend') { return `${username} speelt mee!`; }
        },
        playerDisconnected: {
            title: 'Verbinding met speler verbroken',
            message(username = 'onbekend') { return `${username} is niet meer verbonden.`; }
        }
    },
    lobbyStats(code, players) { return ` er ${players > 1 ? 'zijn' : 'is'} ${players} speler${players > 1 ? 's' : ''} in lobby '${code}'` }
};

let lang = 'nl';
document.querySelector('body').classList.add('lang-' + lang);

// Use a switch with predefined dynamic imports so rollup knows whats going on
// let language;
// switch (lang) {
//     case 'nl':
//     default:
//     language = import('./nl.js').default;
// }
// TODO: figure out how to make dynamic imports work in Rollup

const language = nl;

const EVENTS = {
    GAME_NEW: 'game-new',
    GAME_START: 'game-start',
    GAME_CREATE_STATE: 'game-create-state',
    SCORE_RELOAD: 'score-reload',
    SCORE_TOTAL_TOGGLE: 'score-total-toggle',
    MODAL_TOGGLE: 'modal-toggle',
    MODAL_HIDE: 'modal-hide',
    MODAL_SHOW: 'modal-show',
    GRID_BLOCK_SELECTED: 'grid-block-selected',
    GRID_RENDER_COMPLETE: 'grid-render-complete',
    JOKER_SELECTED: 'joker-selected',
    STAR_SELECTED: 'star-selected',
    RENDER_JOKER_SCORE: 'render-joker-score',
    RENDER_BONUS_SCORE: 'render-bonus-score',
    RENDER_COLUMN_SCORE: 'render-column-score',
    RENDER_STAR_SCORE: 'render-star-score',
    RENDER_TOTAL_SCORE: 'render-total-score',
    RENDER_LEVEL: 'render-level',
    RENDER_SCORES: 'render-scores',
    LOADING: 'loading',
    LEVEL_SELECT_DOM: 'level-select-dom',
};

const app = $('app');
const register = {};

function dispatch$1(eventName, eventData) {
    let event = new CustomEvent(eventName, { detail: eventData });
    app.dispatchEvent(event);

    if (register[eventName]?.once) {
        app.removeEventListener(eventName, register[eventName].callback, false);
    }
}
function listen(eventName, callback, once = false) {
    app.addEventListener(eventName, callback, false);

    if (once) {
        register[eventName] = {once: true, callback};
    }
}
function listenOnce(eventName, callback) {
    return listen(eventName, callback, true);
}

const SOCKET_SERVER = 'https://dry-peak-80209.herokuapp.com/' ;

const io = window.io;
const socket = io(SOCKET_SERVER, { autoConnect: false });

function registerModalEvents() {
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

function createLevelSelectModal({modalId, Player, Lobby, Level}) {
    // Create new modal and add it to the DOM
    let {selectedLevel} = Level;

    createNewModal({
        id: modalId,
        visible: false,
        message: false,
        body: `
                <div class="new-game-container">
                    <div class="lobby-container">
                        <ul>
                            <li id="playerNameWrap">Player: <span id="playerName">${Player.name}</span></li>
                            <li id="lobbyWrap">Game code: <span id="lobbyCode">${Lobby.code}</span></li>
                            <li id="playersJoinedWrap">Players joined (<span id="playerTotal">${Lobby.players.length}</span>): <span id="playerNames">${Lobby.playerNames}</span></li>
                            <li id="startGameWrap"><button id="start">Start game</button></li>
                        </ul>
                    </div>
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
                </div>
            `,
        buttons: false
    });

    listenOnce(EVENTS.MODAL_SHOW, (event) => {
        if (modalId === event.detail.modalId && selectedLevel) {
            if (selectedLevel) {
                // If there's a selected level, mark it in the dom
                dispatch$1(EVENTS.LEVEL_SELECT_DOM, {level: selectedLevel});
            } else {
                // if not, make sure the local state reflects that.
                dispatch$1(EVENTS.LEVEL_SELECT_DOM, {level: ''});
            }
        }
    });

    forEachQuery('.level-image-container a', level => {
        level.addEventListener('click', (event) => {
            event.preventDefault();
            selectedLevel = event.target.id;
            dispatch$1(EVENTS.LEVEL_SELECT_DOM, {level: selectedLevel, element: event.target});
            socket.emit('level:select', {selectedLevel});

        }, false);
    });

    $('start').addEventListener('click',(event) => {
        event.preventDefault();
        if ($('app').querySelectorAll('.level-image-container a.selected').length === 0) {
            alert(language.notification.selectLevel);
            return false;
        }

        dispatch$1(EVENTS.GAME_START);
    }, false);
}

function createNewModal(options) {
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

    $('app').append(modal);

    return modal;
}

function createNewGameModal({modalId = 'newGameModal'}) {
    return createNewModal({
        id: modalId,
        message: language.modal.newGame.body,
        buttons: {
            cancel: {
                id: modalId + 'Cancel',
                label: language.label.cancel,
                callback(event) {
                    event.preventDefault();
                    dispatch$1(EVENTS.MODAL_TOGGLE, {modalId});
                }
            },
            ok: {
                id: modalId + 'Confirm',
                label: language.label.ok,
                callback(event) {
                    event.preventDefault();
                    // hide the modal first
                    dispatch$1(EVENTS.MODAL_TOGGLE, {modalId});
                    // Reset the game
                    dispatch$1(EVENTS.GAME_NEW);
                }
            }
        }
    });
}

class Notify {
    static TRANSITION_DELAY = 200;
    constructor() {

    }

    static hide(opts) {
        const {id, timeout = 400} = opts;
        if (!$(id)) {
            return;
        }

        $(id).classList.remove('show');
        setTimeout(() => {
            const element = $(id);
            if (element) {
                element.remove();
            }
        }, timeout);
    }

    static removePrevious() {
        let activeNotifications = document.querySelectorAll('.notification.show').length;

        if (activeNotifications > 0) {
            // Get rid of active notifications first
            let timeout = 200;
            forEachQuery('.notification.show', notification => {
                Notify.hide({id: notification.id, timeout});
                timeout += 200;
            });
        }

        return activeNotifications;
    }

    static show(opts) {
        const delay = Notify.removePrevious();
        const execute = (opts) => {
            if (typeof opts === 'string') {
                opts = {title: opts};
            }

            let {
                message,
                title = 'No message specified.',
                timeout = 4000,
                autoHide = false
            } = opts;

            const notification = Notify.createTemplate(message, title);

            document.body.append(notification);
            setTimeout(() => {
                $(notification.id).classList.toggle('show');
            }, 1);

            if (autoHide) {
                setTimeout(() => {
                    Notify.hide({id: notification.id});
                }, timeout);
            }
        };

        if (delay > 0) {
            setTimeout(() => {
                execute(opts);
            }, (delay * 200) + 200);
        } else {
            execute(opts);
        }
    }

    static createTemplate(message, title = false) {
        const notificationId = 'notification_' + randomString(5);
        const template = `
            <div class="notification" id="${notificationId}">
                ${title ? `
                <h2>${title}</h2>
                ` : ``}
                ${message ? `
                <p>${message}</p>
                ` : ``}
            </div>
        `;

        return renderTemplate(template);
    }
}

class GameStorage {
    static prefix = 'kok_';

    static removeItem(key) {
        return localStorage.removeItem(GameStorage.prefix + key);
    }

    static setItem(key, value = '') {
        return localStorage.setItem(GameStorage.prefix + key, JSON.stringify(value));
    }

    static getItem(key, defaultValue = false) {
        let value = localStorage.getItem(GameStorage.prefix + key);

        if (value === null) {
            return defaultValue;
        }

        return JSON.parse(value);
    }
}

class Lobby {
    #lobby = false;
    state = false;

    constructor(lobbyData) {
        this.lobby = lobbyData;

        socket.on('player:stats', ({player}) => {
            Lobby.setLobbyCodeDom({code: player.lobbyCode});
        });

        socket.on('lobby:updated', ({lobby}) => {
            this.lobby = lobby;
            Lobby.setLobbyCodeDom({code: this.lobby.code});
        });

        socket.once('lobby:joined', ({lobby}) => {
            this.lobby = lobby;
        });

        socket.once('lobby:created', ({lobby}) => {
            this.lobby = lobby;
        });
    }

    static async joinOrCreate(lobbyCode) {
        if (lobbyCode) {
            // Join lobby
            socket.emit('lobby:join', {lobbyCode});
        } else {
            // Create lobby
            const lobbyCode = prompt(language.notification.createLobby, randomString(4).toUpperCase());
            socket.emit('lobby:create', {lobbyCode});
        }

        return new Promise((resolve, reject) => {
            socket.once('lobby:joined', ({lobby}) => {
                resolve(new Lobby(lobby));
            });

            socket.once('lobby:created', ({lobby}) => {
                resolve(new Lobby(lobby));
            });

            setTimeout(() => {
                reject('Lobby creation timeout.');
            }, 10000);
        });
    }

    static setLobbyCodeDom({code}) {
        const lobbyEl = $('lobbyCode');
        if (lobbyEl) {
            lobbyEl.innerText = code;
        }
    }

    static setState(state) {
        socket.emit('lobby:state', {key: 'state', value: state});
    }

    leave() {
        socket.emit('lobby:leave', {lobbyCode: this.code});
    }

    get players() {
        return this.lobby?.players || [];
    }

    get code() {
        return this.lobby?.code;
    }

    static get cachedLobbyCode() {
        return GameStorage.getItem('lobby', false);
    }

    get state() {
        return this.lobby?.state;
    }

    set lobby(newLobby) {
        if (newLobby.code !== this.#lobby.code) {
            // Store the new value in the local storage as well.
            GameStorage.setItem('lobby', newLobby.code);
        }

        this.#lobby = newLobby;
    }

    get lobby() {
        return this.#lobby;
    }

    get playerNames() {
        return this.players.map(p => p.username).join(', ');
    }

    static template(gameKey = '', playerId = -1) {
        const newLobby = {...lobbyTemplate};
        newLobby.code = gameKey;
        newLobby.playerId = playerId;

        return newLobby;
    }
}

const lobbyTemplate = {
    "members": [],
    "playerId": -1,
    "code": "KOK123",
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

const level1 = [
    {
        column: 'A',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'B',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'C',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'D',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'E',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'F',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'G',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'H',
        score: [
            {
                value: 1
            },{
                value: 0
            }
        ],
        grid: [
            {
                color: 'green',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'I',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'J',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'K',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'L',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'M',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'green',
                star: true
            }
        ]
    },
    {
        column: 'N',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'O',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            }
        ]
    }
];
const level2 = [
    {
        column: 'A',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green',
                star: true
            }
        ]
    },
    {
        column: 'B',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'C',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'D',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'E',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'green',
                star: true
            }
        ]
    },
    {
        column: 'F',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'G',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'H',
        score: [
            {
                value: 1
            },{
                value: 0
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'I',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange',
                star: true
            }
        ]
    },
    {
        column: 'J',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'K',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'L',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'M',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'N',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'O',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            }
        ]
    }
];
const level3 = [
    {
        column: 'A',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'B',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'C',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'orange',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'D',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'E',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'F',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            }
        ]
    },
    {
        column: 'G',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'H',
        score: [
            {
                value: 1
            },{
                value: 0
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'I',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'blue'
            },
            {
                color: 'red'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'J',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'K',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'yellow'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'L',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'M',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green',
                star: true
            }
        ]
    },
    {
        column: 'N',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'red',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            }
        ]
    },
    {
        column: 'O',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            }
        ]
    }
];
const level4 = [
    {
        column: 'A',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'orange',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'red'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            }
        ]
    },
    {
        column: 'B',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'C',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'D',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'E',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'F',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'G',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red',
                star: true
            },
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'H',
        score: [
            {
                value: 1
            },{
                value: 0
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'I',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'orange'
            },
            {
                color: 'yellow',
                star: true
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'green'
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'J',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'red',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'green'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'K',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'yellow'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'L',
        score: [
            {
                value: 2
            },{
                value: 1
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'green',
                star: true
            },
            {
                color: 'red'
            },
            {
                color: 'red'
            },
            {
                color: 'blue'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            }
        ]
    },
    {
        column: 'M',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'orange'
            },
            {
                color: 'orange'
            },
            {
                color: 'yellow'
            },
            {
                color: 'red',
                star: true
            }
        ]
    },
    {
        column: 'N',
        score: [
            {
                value: 3
            },{
                value: 2
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue',
                star: true
            },
            {
                color: 'red'
            }
        ]
    },
    {
        column: 'O',
        score: [
            {
                value: 5
            },{
                value: 3
            }
        ],
        grid: [
            {
                color: 'green'
            },
            {
                color: 'yellow'
            },
            {
                color: 'orange',
                star: true
            },
            {
                color: 'orange'
            },
            {
                color: 'blue'
            },
            {
                color: 'blue'
            },
            {
                color: 'red'
            }
        ]
    }
];

class Level {
    selectedLevel = false;
    static levelMap = {
        level1,
        level2,
        level3,
        level4
    };

    constructor() {
        listen(EVENTS.LEVEL_SELECT_DOM, (event) => {
            const {level, element} = event.detail;
            Level.selectInDom(level, element);
        });
        listen(EVENTS.GAME_START, () => {
            dispatch$1(EVENTS.MODAL_HIDE, {modalId: 'selectLevelModal'});
        });

        socket.on('level:selected', ({selectedLevel}) => {
            this.level = selectedLevel;
            dispatch$1(EVENTS.GAME_CREATE_STATE);
        });
    }

    static selectInDom(level, element = false) {
        forEachQuery('.level-image-container a', level => {
            level.classList.remove('selected');
        });

        if (level !== '') {
            if (!element) {
                element = $(level);
            }
            if (!element) {
                return;
            }

            element.parentElement.classList.add('selected');
        }
    }

    reset() {
        GameStorage.removeItem('level');
        this.selectedLevel = false;
    }

    select({Player, Lobby}) {
        const modalId = 'selectLevelModal';

        // Check if modal already exists in the DOM
        if ($(modalId)) {
            // Show modal
            dispatch$1(EVENTS.MODAL_SHOW, {modalId: modalId});
            return;
        }

        createLevelSelectModal({modalId, Player, Lobby, Level: this});
        dispatch$1(EVENTS.MODAL_SHOW, {modalId});
    }

    set level(level) {
        this.selectedLevel = level;
        dispatch$1(EVENTS.LEVEL_SELECT_DOM, {level});
    }

    get level() {
        return Level.levelMap[this.selectedLevel];
    }
}

class Score {
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

class Session {
    constructor() {
    }

    static get cachedId() {
        return GameStorage.getItem('sessionId');
    }

    static set cachedId(newValue) {
        return GameStorage.setItem('sessionId', newValue);
    }
}

class Player {
    #cachedPlayer = false;

    constructor() {
        const sessionId = Session.cachedId;
        if (sessionId !== false) {
            socket.auth = {
                sessionId,
                username: Player.cachedName
            };
            socket.connect();
        } else {
            // No player exists. Create a new one.
            this.createPlayer();
        }

        socket.once('player:created', ({player}) => {
            this.player = player;
        });

        socket.on('player:updated', ({player}) => {
            this.player = player;
        });

        socket.on('player:stats', ({totalPlayers, players}) => {
            Player.setPlayerNamesDom({players});
            Player.setPlayerTotalDom({totalPlayers});
        });

        socket.on('player:connected', (player) => {
            Notify.show({
                title: language.notification.playerJoined.title,
                message: language.notification.playerJoined.message(player.username),
                autoHide: true
            });
        });
    }

    static setPlayerTotalDom({totalPlayers}) {
        const totalEl = $('playerTotal');
        if (totalEl) {
            totalEl.innerText = totalPlayers;
        }
    }

    static setPlayerNamesDom({players}) {
        const namesEl = $('playerNames');
        if (namesEl) {
            namesEl.innerText = players.join(', ');
        }
    }

    static setPlayerNameDom({player}) {
        const playerEl = $('playerName');
        if (playerEl) {
            playerEl.innerText = player.username;
        }
    }

    createPlayer() {
        const username = prompt(language.notification.playerName);
        this.player = {username};
        this.connectPlayer(this.player);
    }

    connectPlayer(player) {
        console.log('Connecting player!', player);
        socket.auth = player;
        socket.connect();
    }

    delete() {
        return GameStorage.removeItem('player');
    }

    set player(value) {
        if (!value.username) {
            throw new Error('Invalid player object. No username.');
        }

        this.#cachedPlayer = value;
        GameStorage.setItem('player', value.username);
        Player.setPlayerNameDom(value.username);
    }

    get player() {
        return this.#cachedPlayer;
    }

    static get cachedName() {
        return GameStorage.getItem('player');
    }

    get name() {
        return this.#cachedPlayer.username;
    }

    get id() {
        return this.#cachedPlayer?.id || randomString(6).toLowerCase();
    }
}

class Game {
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];
    static TOTAL_JOKERS = 8;

    static STATE = {
        LEVEL_SELECT: 'levelSelect',
        IN_GAME: 'inGame'
    };

    Lobby;
    Level;
    Score;
    Player;

    #cachedState = false;
    constructor() {
        // Load state from localstorage
        this.state = GameStorage.getItem('state');

        // Create player and connect to socket
        this.Player = new Player();

        socket.on('game:start', () => {
            this.start();
        });

        socket.on('lobby:updated', ({lobby}) => {
            switch (lobby.state) {
                            }
        });

        socket.on('connect', () => {
            console.clear();
            this.initialize();
        });

        listen(EVENTS.GAME_CREATE_STATE, () => {
            this.state = this.createState();
        });
        listen(EVENTS.GAME_NEW, () => {
            this.new();
        });
        listen(EVENTS.GAME_START, () => {
            // Level is loaded, state is created, now we need to go
            // ahead and render the game
            this.continue();
        });
    }

    initialize() {
        /*
        Do we have a local state?
        - Yes
        --- Load the current level
        --- Load the current state
        --- Continue where we left off
        - No
        --- Display level selector
        --- Let user set sync game optionally
         */

        // Create new Lobby first
        Lobby.joinOrCreate(Lobby.cachedLobbyCode)
            .then(LobbyInstance => {
                this.Lobby = LobbyInstance;
                // Select new level
                this.Level = new Level({Lobby: LobbyInstance, Game: this});
                this.Score = new Score();

                // All ready now, start the game
                this.start();
            })
            .catch(err => {
                console.error('Failed to create lobby', err);
            });
    }

    start() {
        if (!this.state) {
            // No state, select a level first.
            //this.new();
            this.Level.select({Player: this.Player, Lobby: this.Lobby});
        } else {
            this.continue();
        }
    }

    new() {
        // Reset state, continue game
        this.resetState();
        // Continue rendering the newly created level
        this.start();
    }

    continue() {
        this.state = GameStorage.getItem('state');
        // Load state from localstorage and trigger events to render level
        dispatch$1(EVENTS.RENDER_LEVEL);
    }

    resetState() {
        this.Level.reset();
        this.state = false;
    }

    createState() {
        let state = {
            grid: this.Level.level,
            jokers: [],
            colorScores: {
                high: [],
                low: []
            }
        }, i;
        for (i = 0; i < Game.TOTAL_JOKERS; i++) {
            state.jokers.push({selected: false});
        }
        Game.COLORS.forEach(color => {
            state.colorScores.high.push({
                color: color,
                value: 0
            });
            state.colorScores.low.push({
                color: color,
                value: 0
            });
        });

        return state;
    }

    get state() {
        // If there is no locally cached state value, try to load one from the
        // localStorage and return false if none exist.
        if (!this.#cachedState) {
            this.#cachedState = GameStorage.getItem('state', false);
        }

        return this.#cachedState;
    }

    set state(value) {
        this.#cachedState = value;
        if (!value) {
            console.log('Clearing local state');
            GameStorage.removeItem('state');
        } else {
            GameStorage.setItem('state', value);
        }
    }

    updateState(column, index, key, value, type = 'grid') {
        let currentState = this.state;
        let found = false;
        currentState.grid.forEach((stateColumn, stateIndex) => {
            if (stateColumn.column === column) {
                currentState.grid[stateIndex][type][index][key] = value;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
            dispatch$1(EVENTS.RENDER_LEVEL);
        }
    }

    updateBlockState(col, row, key, value) {
        let currentState = this.state;
        let found = false;
        currentState.grid.forEach((stateColumn, stateIndex) => {
            if (stateColumn.column === col) {
                currentState.grid[stateIndex].grid[row][key] = value;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
            dispatch$1(EVENTS.RENDER_LEVEL);
        }
    }

    updateJokerState(row, selected) {
        let currentState = this.state;
        let found = false;
        currentState.jokers.forEach((joker, index) => {
            if (index === row) {
                joker.selected = selected;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
            dispatch$1(EVENTS.RENDER_LEVEL);
        }
    }

    updateColorScoreState(group, color, value) {
        let found = false;
        let currentState = this.state;
        currentState.colorScores[group].forEach((colorScore) => {
            if (colorScore.color === color) {
                colorScore.value = value;
                found = true;
            }
        });

        if (found) {
            this.state = currentState;
            dispatch$1(EVENTS.RENDER_LEVEL);
        }
    }
}

class Engine {
    currentGame = false;
    version;
    constructor() {
        registerModalEvents();

        this.currentGame = new Game();
        this.parseOrientationOverlay();
        this.parseGenericLoading();

        listen(EVENTS.LOADING, () => {
            dispatch$1(EVENTS.MODAL_SHOW, {modalId: 'genericLoading'});
        });
        listen(EVENTS.RENDER_LEVEL, () => {
            this.render();
        });
        listen(EVENTS.RENDER_JOKER_SCORE, (event) => {
            this.renderJokerScore(event.detail.value);
        });
        listen(EVENTS.RENDER_SCORES, (event) => {
            const {scores} = event.detail;
            if (typeof scores.bonus !== 'undefined') {
                this.renderBonusScore(scores.bonus);
            }
            if (typeof scores.columns !== 'undefined') {
                this.renderColumnScore(scores.columns);
            }
            if (typeof scores.jokers !== 'undefined') {
                this.renderJokerScore(scores.jokers);
            }
            if (typeof scores.stars !== 'undefined') {
                this.renderStarScore(scores.stars);
            }
        });

        socket.on('version', version => {
            GameStorage.setItem('version', version);
        });

        socket.on('session', ({sessionId}) => {
            Session.cachedId = sessionId;
        });

        socket.on('disconnect', () => {
            // Nothing yet?
        });
    }

    renderBonusScore(value) {
        $('bonusTotal').innerText = value;
    }

    renderColumnScore(value) {
        $('columnsTotal').innerText = value;
    }

    renderJokerScore(value) {
        $('jokerTotal').innerText = value;
    }

    renderStarScore(value) {
        $('starsTotal').innerText = value;
    }

    parseOrientationOverlay() {
        createNewModal({
            id: 'orientationModal',
            message: language.notification.landscapeMode
        });
    }

    parseGenericLoading() {
        createNewModal({
            visible: false,
            id: 'genericLoading',
            message: 'Aan het laden.. een moment geduld.'
        });
    }

    parseColumnGrid(state) {
        $('blockGrid').innerHTML = '';
        state.grid.forEach(column => {
            $('blockGrid').append(this.parseColumn(column));
        });

        // Colored blocks
        let scoreBlocks = document.querySelectorAll('.score-block:not(.final-score)');
        Array.prototype.forEach.call(scoreBlocks, (block) => {
            block.addEventListener('click', () => {
                let selected = !block.classList.contains('selected');
                this.currentGame.updateBlockState(block.data.column, block.data.row, 'selected', selected);
                dispatch$1(EVENTS.GRID_BLOCK_SELECTED, {selected, block});
                if (block.querySelectorAll('.star').length > 0) {
                    // Has a star, update star score.
                    dispatch$1(EVENTS.STAR_SELECTED, {selected, block});
                }
            }, false);
        });
    }

    parseJokerColumn(state) {
        let jokerContainer = $('jokerContainer');
        jokerContainer.innerHTML = '';
        state.jokers.forEach(joker => {
            let renderedJoker = createElement('span', {className: 'joker', innerText: '!'});
            if (joker.selected) {
                renderedJoker.classList.add('used');
            }
            jokerContainer.append(renderedJoker);
        });

        // Joker events
        let jokers = document.getElementsByClassName('joker');
        Array.prototype.forEach.call(jokers, (joker, index) => {
            joker.addEventListener('click', () => {
                let selected = !joker.classList.contains('used');
                this.currentGame.updateJokerState(index, selected);
                dispatch$1(EVENTS.JOKER_SELECTED, {joker, selected});
            }, false);
        });
    }

    parseScoreColumns(state) {
        $('scoreColumn1').innerHTML = '';
        state.colorScores.high.forEach(colorScore => {
            let element = createElement('span', {className: 'score-block final-score ' + colorScore.color});
            if (colorScore.value === -1) {
                element.classList.add('selected');
            }
            if (colorScore.value === 5) {
                element.classList.add('final-selected');
            }
            createElement('span', {innerText: 5}, element);
            $('scoreColumn1').append(element);
        });

        $('scoreColumn2').innerHTML = '';
        state.colorScores.low.forEach(colorScore => {
            let element = createElement('span', {className: 'score-block final-score ' + colorScore.color});
            if (colorScore.value === -1) {
                element.classList.add('selected');
            }
            if (colorScore.value === 3) {
                element.classList.add('final-selected');
            }
            createElement('span', {innerText: 3}, element);
            $('scoreColumn2').append(element);
        });


        // Final score toggles
        let getValueFromClass = function (element, high = 5, low = -1) {
            if (!element.classList.contains('final-selected') && !element.classList.contains('selected')) {
                // Not selected yet, value = 5
                return high;
            }
            if (element.classList.contains('final-selected') && !element.classList.contains('selected')) {
                // Already selected, toggle disabled state, value = -1
                return low
            }

            return 0;
        };
        let getColorFromElement = function (element) {
            let color = '';
            Game.COLORS.forEach(mappedColor => {
                if (element.classList.contains(mappedColor)) {
                    color = mappedColor;
                }
            });

            return color;
        };
        let highScores = document.querySelectorAll('#scoreColumn1 .final-score');
        Array.prototype.forEach.call(highScores, (highScore) => {
            highScore.addEventListener('click', () => {
                this.currentGame.updateColorScoreState(
                    'high',
                    getColorFromElement(highScore),
                    getValueFromClass(highScore, 5, -1)
                );

                dispatch$1(EVENTS.SCORE_RELOAD);
            }, false);
        });
        let lowScores = document.querySelectorAll('#scoreColumn2 .final-score');
        Array.prototype.forEach.call(lowScores, (lowScore) => {
            lowScore.addEventListener('click', () => {
                this.currentGame.updateColorScoreState(
                    'low',
                    getColorFromElement(lowScore),
                    getValueFromClass(lowScore, 3, -1)
                );

                dispatch$1(EVENTS.SCORE_RELOAD);
            }, false);
        });

        // Column scores
        let columnScores = document.querySelectorAll('span.column-score');
        Array.prototype.forEach.call(columnScores, (columnScore) => {
            columnScore.addEventListener('click', () => {
                let col = columnScore.data.column, row = columnScore.data.row, state;

                if (!columnScore.classList.contains('active') && !columnScore.classList.contains('taken')) {
                    state = 'active';
                } else if (columnScore.classList.contains('active') && !columnScore.classList.contains('taken')) {
                    state = 'taken';
                } else {
                    state = 'default';
                }

                this.currentGame.updateState(col, row, 'state', state, 'score');
                dispatch$1(EVENTS.SCORE_RELOAD);
            }, false);
        });
    }

    parseGrid() {
        this.parseColumnGrid(this.currentGame.state);
        this.parseJokerColumn(this.currentGame.state);
        this.parseScoreColumns(this.currentGame.state);

        dispatch$1(EVENTS.GRID_RENDER_COMPLETE);
    }

    parseTotalScores() {
        if ($('totalScores')) {
            return;
        }

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

        $('totals').addEventListener('click', () => {
            dispatch$1(EVENTS.SCORE_SHOW);
        }, false);
    }

    renderNewGameButton(callback) {
        const id = 'newGame';
        if ($(id)) {
            return;
        }

        const button = renderButton({
            callback, id,
            label: language.label.newGame,
            className: 'new-game',
        });

        // New game button
        $('grid').append(button);

        return button;
    }

    render(state) {
        this.parseGrid(state);
        this.parseTotalScores();

        const modalId = 'newGameModal';
        createNewGameModal({modalId});
        this.renderNewGameButton((event) => {
            event.preventDefault();
            dispatch$1(EVENTS.MODAL_SHOW, {modalId});
        });

        dispatch$1(EVENTS.SCORE_RELOAD);
    }

    parseColumn(column) {
        let columnTemplate = createElement('div', {className: 'column' + (column.column === 'H' ? ' highlight' : '')});
        // create header
        createElement('span', {className: 'letter rounded-block', innerText: column.column}, columnTemplate);

        // create grid blocks
        column.grid.forEach((block, index) => {
            const row = createElement('span', {
                className: 'score-block ' + block.color,
                data: {
                    column: column.column,
                    row: index
                }
            });
            if (block.star) {
                createElement('span', {className: 'star', innerText: '*'}, row);
            }
            if (block.selected) {
                row.classList.add('selected');
            }

            columnTemplate.append(row);
        });
        // create score columns
        let score = createElement('div', {className: 'column-score'});
        column.score.forEach((scoreObject, index) => {
            let state = (scoreObject.state && scoreObject.state !== 'default') ? ' ' + scoreObject.state : '';
            createElement('span', {
                className: 'rounded-block column-score' + state,
                innerText: scoreObject.value,
                data: {
                    column: column.column,
                    row: index
                }
            }, score);
        });
        columnTemplate.append(score);

        let blocks = columnTemplate.querySelectorAll('.score-block');
        let selectedBlocks = columnTemplate.querySelectorAll('.selected');
        let columnLetter = columnTemplate.querySelector('.letter').innerText.toUpperCase();
        if (blocks.length === selectedBlocks.length) {
            socket.emit('grid:column-complete', {columnLetter});
        }

        return columnTemplate;
    }
}

try {
    new Engine();
} catch (err) {
    console.error('Failed to load game. Reset state!', err);
}

window.socket = socket;
