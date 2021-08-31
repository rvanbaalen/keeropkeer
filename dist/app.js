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
    messages: {
        connecting: 'Bezig met verbinden ...'
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
    RENDER_TOTAL_SCORE: 'render-total-score',
    RENDER_LEVEL: 'render-level',
    RENDER_SCORES: 'render-scores',
    LOADING: 'loading',
    SCORE_TOGGLE_COLUMN: 'score-toggle-column',
    NAVIGATE_FROM: 'navigate-from',
    NAVIGATE_TO: 'navigate-to',
    NAVIGATE: 'navigate'

};

const app = $('app');
const register = {};

function dispatch(eventName, eventData) {
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

const SOCKET_SERVER = 'http://192.168.1.111:3000/';

const io = window.io;
const socket = io(SOCKET_SERVER, { autoConnect: false });

socket.onAny((event, ...args) => {
    console.log(event, args);
});

console.log('Setup socket server ', SOCKET_SERVER);

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

class Layout {
    static render() {
        return `
            ${ Layout.renderViewGame() }
            ${ Layout.renderViewLevelSelect() }
        `;
    }

    static applicationWindow(id, content) {
        return `
            <div id="${id}" class="applicationWindow hidden">${content}</div>
        `;
    }

    static renderViewGame() {
        return Layout.applicationWindow('gameView', `
            <div class="gameViewRows">
                <div class="columns">
                    <div class="jokers" id="jokerContainer"></div>
                    <div id="blockGrid"></div>
                    <div class="scoreContainer">
                        <div class="column" id="scoreColumn">
                            <div id="scoreColumn1"></div>
                        </div>
                        <div class="column" id="scoreColumn2"></div>
                    </div>
                </div>
                <div id="gameData">
                    <ul id="activePlayers" class="blockList playerList"></ul>
                    <a id="newGameButton">Nieuw spel</a>
                </div>
            </div>
       `);
    }

    static renderViewLevelSelect() {
        return Layout.applicationWindow('levelSelect', `
            <div id="playerContainer">
                <h2 class="rainbow">Spelers</h2>
                <ul id="players" class="blockList playerList"></ul>
                <h2 class="rainbow">Lobby</h2>
                <a href="#" id="lobbyCode">Cool</a>
            </div>
            <div id="levelContainer">
                <h2 class="rainbow">Selecteer een level</h2>
                <ul id="levels" class="blockList">
                    <li class="level">
                        <a href="#" class="level1" data-level="level1">
                            <img src="/images/level1.png" alt="level1" />
                            <span class="label">Level 1</span>
                        </a>
                    </li>
                    <li class="level">
                        <a href="#" class="level2" data-level="level2">
                            <img src="/images/level2.png" alt="level2" />
                            <span class="label">Level 2</span>
                        </a>
                    </li>
                    <li class="level">
                        <a href="#" class="level3" data-level="level3">
                            <img src="/images/level3.png" alt="level3" />
                            <span class="label">Level 3</span>
                        </a>
                    </li>
                    <li class="level">
                        <a href="#" class="level4" data-level="level4">
                            <img src="/images/level4.png" alt="level4" />
                            <span class="label">Level 4</span>
                        </a>
                    </li>
                </ul>
            </div>
        `);
    }

    static renderPlayer(player) {
        return `<li class="player" data-player="${player.username}" data-player-id="${player.userId}">${player.username}</li>`;
    }
    static renderPlayerAvatar({url, playerName}) {
        return `<img src="${url}" alt="${playerName}"/><span>${playerName}</span>`;
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
        });

        socket.once('lobby:joined', ({lobby}) => {
            this.lobby = lobby;
        });

        socket.once('lobby:created', ({lobby}) => {
            this.lobby = lobby;
        });

        socket.on('player:connected', ({player}) => {
            Lobby.addPlayerToLobby(player);
        });

        socket.on('player:disconnected', ({player}) => {
            Lobby.removePlayerFromLobby(player);
        });
    }

    static loadAvatars() {
        forEachQuery('#players .player:not(.avatar), #activePlayers .player:not(.avatar)', player => {
            const playerName = player.innerText;
            const url = new URL(`https://avatars.dicebear.com/api/bottts/${playerName}.svg?mood[]=happy`);
            player.innerHTML = Layout.renderPlayerAvatar({url, playerName});
            player.classList.add('avatar');
        });
    }

    static getPlayerElement(player) {
        return document.querySelectorAll(`[data-player-id="${player.userId}"]`)[0];
    }

    static addPlayerToLobby(player) {
        const playerElement = Lobby.getPlayerElement(player);
        if (!playerElement) {
            forEachQuery('#players, #activePlayers', playerContainer => {
                playerContainer.innerHTML += Layout.renderPlayer(player);
            });
            Lobby.loadAvatars();
        }
    }

    static removePlayerFromLobby(player) {
        const playerElement = Lobby.getPlayerElement(player);
        if (playerElement) {
            // Player element exists in the DOM
            playerElement.remove();
        }
    }

    static setPlayers(players) {
        forEachQuery('#players, #activePlayers', playerContainer => {
            playerContainer.innerHTML = '';
        });
        players.forEach(player => {
            Lobby.addPlayerToLobby(player);
        });
    }

    static async joinOrCreate(lobbyCode) {
        if (lobbyCode) {
            // Join lobby
            socket.emit('lobby:join', {lobbyCode});
        } else {
            // Create lobby
            let lobbyCode = prompt(language.notification.createLobby, randomString(4).toUpperCase());
            lobbyCode = lobbyCode.toUpperCase();
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

        Lobby.setLobbyCodeDom({code: newLobby.code});
        if (newLobby.players.length > 0) {
            Lobby.setPlayers(newLobby.players);
        }

        this.#lobby = newLobby;
    }

    get lobby() {
        return this.#lobby;
    }

    get playerNames() {
        return this.players.map(p => p.username).join(', ');
    }
}

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
        socket.on('level:selected', ({selectedLevel}) => {
            if (this.level !== selectedLevel) {
                this.level = selectedLevel;
                dispatch(EVENTS.GAME_CREATE_STATE);
            }
        });

        this.registerEventHandlers();
    }

    static selectInDom(level) {
        const levels = document.querySelectorAll('#levels .level a');
        const levelElement = document.querySelectorAll('#levels .level a.' + level)[0];

        // Clear state
        Array.prototype.forEach.call(levels, (lvl) => {
            lvl.classList.remove('selected');
            document.getElementById('startGame')?.remove();
        });

        if (levelElement) {
            // Set new state if element exists.
            levelElement.classList.toggle('selected');
            levelElement.innerHTML += `<span id="startGame">Start Spel &rarr;</span>`;
        }
    }

    registerEventHandlers() {
        const levels = document.querySelectorAll('li.level > a');
        Array.prototype.forEach.call(levels, (level) => {
            level.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                const selectedLevel = level.dataset.level;
                if (level.classList.contains('selected')) {
                    // Start the game!
                    socket.emit('game:start');
                    //dispatch(EVENTS.GAME_START);
                } else {
                    this.level = selectedLevel;
                    socket.emit('level:select', {selectedLevel});
                }
            }, false);
        });
    }

    reset() {
        GameStorage.removeItem('level');
        this.selectedLevel = false;
    }

    select({Player, Lobby}) {
        dispatch(EVENTS.NAVIGATE, {page: 'levelSelect'});
    }

    getGrid() {
        return Level.levelMap[this.selectedLevel];
    }

    set level(level) {
        this.selectedLevel = level;
        Level.selectInDom(level);
    }

    get level() {
        return this.selectedLevel;
    }
}

class Score {
    static JOKER_VALUE = 1;
    static STAR_VALUE = -2;
    Game;

    constructor({Game}) {
        this.Game = Game;

        if (!Game.initialized) {
            listen(EVENTS.JOKER_SELECTED, () => {
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
        }

        socket.on('grid:column-completed', ({columnLetter, player, first}) => {
            const row = first ? 0 : 1;
            const el = document.querySelectorAll(`.column-score[data-column="${columnLetter}"][data-row="${row}"]`)[0];
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

        socket.on('player:connected', ({player}) => {
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

class Application {
    currentView;
    defaultView = 'levelSelect';
    constructor() {
        this.currentView = document.querySelectorAll('.applicationWindow:not(.hidden)')[0];

        listen(EVENTS.NAVIGATE, (event) => {
            const {page} = event.detail;
            if ($(page)) {
                this.navigate(page);
            }
        });
    }

    hideCurrent() {
        if (this.currentView) {
            dispatch(EVENTS.NAVIGATE_FROM, {page: this.currentView});
            this.currentView.classList.add('hidden');
        }
    }

    navigate(page) {
        if (this.currentView?.id === page) return;
        this.hideCurrent();
        this.currentView = $(page);
        this.currentView.classList.remove('hidden');
        dispatch(EVENTS.NAVIGATE_TO, {page: this.currentView});
    }

    static navigateTo(page) {
        dispatch(EVENTS.NAVIGATE, {page});
    }
}

class Game {
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];
    static TOTAL_JOKERS = 8;

    initialized = false;

    Lobby;
    Level;
    Score;
    Player;

    #cachedState = false;
    constructor() {
        // Create player and connect to socket
        this.Player = new Player();

        socket.on('game:start', () => {
            dispatch(EVENTS.GAME_START);
        });

        socket.on('lobby:updated', ({lobby}) => {
            switch (lobby.state) {
                            }
        });

        socket.on('connect', () => {
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
        listen(EVENTS.SCORE_TOGGLE_COLUMN, ({element, row, column}) => {
            this.updateState(column, row, 'state', Score.getColumnScoreState(element), 'score');
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
                this.Score = new Score({Game: this});

                // All ready now, start the game
                this.start();
                this.initialized = true;
            })
            .catch(err => {
                console.error('Failed to create lobby', err);
                this.initialized = false;
            });
    }

    start() {
        if (!this.state) ; else {
            this.continue();
        }
    }

    new() {
        // Reset state, continue game
        this.resetState();
        Application.navigateTo('levelSelect');
        // Continue rendering the newly created level
        this.start();
    }

    continue() {
        // Load state from localstorage and trigger events to render level
        Application.navigateTo('gameView');
        dispatch(EVENTS.RENDER_LEVEL);
    }

    resetState() {
        this.Level.reset();
        this.state = false;
    }

    createState() {
        let state = {
            grid: this.Level.getGrid(),
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
            dispatch(EVENTS.RENDER_LEVEL);
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
            dispatch(EVENTS.RENDER_LEVEL);
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
            dispatch(EVENTS.RENDER_LEVEL);
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
            dispatch(EVENTS.RENDER_LEVEL);
        }
    }
}

class Engine {
    currentGame = false;
    application;
    version;
    constructor() {
        $('app').innerHTML += Layout.render();
        this.application = new Application();

        registerModalEvents();

        this.currentGame = new Game();
        this.parseOrientationOverlay();
        this.parseGenericLoading();

        $('connecting-message').innerText = language.messages.connecting;

        listen(EVENTS.LOADING, () => {
            dispatch(EVENTS.MODAL_SHOW, {modalId: 'genericLoading'});
        });
        listen(EVENTS.RENDER_LEVEL, () => {
            this.render();
        });
        listen(EVENTS.RENDER_SCORES, (event) => {
            const {scores} = event.detail, Score = this.currentGame.Score;
            if (typeof scores.bonus !== 'undefined') {
                Score.renderBonusScore(scores.bonus);
            }
            if (typeof scores.columns !== 'undefined') {
                Score.renderColumnScore(scores.columns);
            }
            if (typeof scores.jokers !== 'undefined') {
                Score.renderJokerScore(scores.jokers);
            }
            if (typeof scores.stars !== 'undefined') {
                Score.renderStarScore(scores.stars);
            }
        });

        socket.on('grid:column-completed', ({columnLetter, player}) => {
            console.log(`Player ${player.username} completed column ${columnLetter}`);
        });

        socket.on('version', version => {
            GameStorage.setItem('version', version);
        });

        socket.on('session', ({sessionId}) => {
            Session.cachedId = sessionId;
        });

        socket.on('connect', () => {
            document.body.classList.add('connected');
        });
        socket.on('disconnect', () => {
            document.body.classList.remove('connected');
        });

        $('newGameButton').addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const modalId = 'newGameModal';
            createNewModal({
                id: modalId,
                visible: true,
                selfDestruct: true,
                message: language.modal.newGame.body,
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
                        }
                    }
                }
            });

            dispatch(EVENTS.MODAL_SHOW, {modalId: 'newGameModal'});
        }, false);
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
        const blockGrid = $('blockGrid');
        blockGrid.innerHTML = '';
        state.grid.forEach(column => {
            blockGrid.innerHTML += this.parseColumn(column);
        });

        // Colored blocks
        let scoreBlocks = document.querySelectorAll('.score-block:not(.final-score)');
        Array.prototype.forEach.call(scoreBlocks, (block) => {
            block.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                let selected = !block.classList.contains('selected');
                this.currentGame.updateBlockState(block.dataset.column, block.dataset.row, 'selected', selected);
                dispatch(EVENTS.GRID_BLOCK_SELECTED, {selected, block});
                if (block.querySelectorAll('.star').length > 0) {
                    // Has a star, update star score.
                    dispatch(EVENTS.STAR_SELECTED, {selected, block});
                }
            }, false);
        });
    }

    parseJokerColumn(state) {
        let jokerContainer = $('jokerContainer');
        jokerContainer.innerHTML = state.jokers.map(joker => {
            return `<span class="joker${joker.selected ? ' used' : ''}">!</span>`
        }).join('');

        // Joker events
        let jokers = document.getElementsByClassName('joker');
        Array.prototype.forEach.call(jokers, (joker, index) => {
            joker.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                let selected = !joker.classList.contains('used');
                this.currentGame.updateJokerState(index, selected);
                dispatch(EVENTS.JOKER_SELECTED, {joker, selected});
            }, false);
        });
    }

    parseScoreColumns(state) {
        $('scoreColumn1').innerHTML = state.colorScores.high.map(colorScore => {
            const valueClass = (value) => {
                if (value === -1) return ' selected';
                if (value === 5) return ' final-selected';
                return '';
            };

            return `<span class="score-block final-score ${colorScore.color}${valueClass(colorScore.value)}"><span>5</span></span>`;
        }).join('');
        // state.colorScores.high.forEach(colorScore => {
        //     let element = createElement('span', {className: 'score-block final-score ' + colorScore.color});
        //     if (colorScore.value === -1) {
        //         element.classList.add('selected');
        //     }
        //     if (colorScore.value === 5) {
        //         element.classList.add('final-selected');
        //     }
        //     createElement('span', {innerText: 5}, element);
        //     $('scoreColumn1').append(element);
        // });

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
            highScore.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                this.currentGame.updateColorScoreState(
                    'high',
                    getColorFromElement(highScore),
                    getValueFromClass(highScore, 5, -1)
                );

                dispatch(EVENTS.SCORE_RELOAD);
            }, false);
        });
        let lowScores = document.querySelectorAll('#scoreColumn2 .final-score');
        Array.prototype.forEach.call(lowScores, (lowScore) => {
            lowScore.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                this.currentGame.updateColorScoreState(
                    'low',
                    getColorFromElement(lowScore),
                    getValueFromClass(lowScore, 3, -1)
                );

                dispatch(EVENTS.SCORE_RELOAD);
            }, false);
        });

        // Column scores
        let columnScores = document.querySelectorAll('span.column-score');
        Array.prototype.forEach.call(columnScores, (columnScore) => {
            columnScore.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                dispatch(EVENTS.SCORE_TOGGLE_COLUMN, {
                    column: columnScore.dataset.column,
                    element: columnScore
                });
                dispatch(EVENTS.SCORE_RELOAD);
            }, false);
        });
    }

    parseGrid() {
        this.parseColumnGrid(this.currentGame.state);
        this.parseJokerColumn(this.currentGame.state);
        this.parseScoreColumns(this.currentGame.state);

        dispatch(EVENTS.GRID_RENDER_COMPLETE);
    }

    parseTotalScores() {
        if ($('totalScores')) {
            return;
        }

        const totalScoresTemplate = `
            <div id="totalScores">
                <div class="totals" id="bonus"><label class="rainbow">${language.label.bonus}</label><span class="label">=</span><span id="bonusTotal" class="totalValue">15</span></div>
                <div class="totals" id="columns"><label>${language.label.columns}</label><span class="label">+</span><span id="columnsTotal" class="totalValue"></span></div>
                <div class="totals" id="jokers"><label>${language.label.jokers}</label><span class="label">+</span><span id="jokerTotal" class="totalValue"></span></div>
                <div class="totals" id="stars"><label>${language.label.stars}</label><span class="label">-</span><span id="starsTotal" class="totalValue"></span></div>
                <div class="totals" id="totals">
                    <label>${language.label.totals}</label><span class="label">&nbsp;</span><span id="totalScore" class="totalValue hide"></span>
                </div>
            </div>
        `;

        $('scoreColumn').innerHTML += totalScoresTemplate;

        $('totals').addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            dispatch(EVENTS.SCORE_TOTAL_TOGGLE);
        }, false);
    }

    renderNewGameButton(callback) {
        const id = 'newGameButton';
        if ($(id)) {
            return;
        }

        const button = renderButton({
            callback, id,
            label: language.label.newGame,
            className: 'new-game',
        });

        // New game button
        $('gameView').append(button);

        return button;
    }

    render() {
        this.parseGrid();
        this.parseTotalScores();

        dispatch(EVENTS.SCORE_RELOAD);
    }

    parseColumn(column) {
        let blocks = column.grid.length, selectedBlocks = 0;

        let tpl = `
            <div class="column${column.column === 'H' ? ' highlight' : ''}">
                <span class="rounded-block" data-letter="${column.column}">${column.column}</span>
                ${renderColumnBlocks(column.grid)}
                <div class="column-score">${renderColumnScores(column.score)}</div>
            </div>
        `;

        // create grid blocks
        function renderColumnBlocks(blocks) {
            return blocks.map((block, index) => {
                if (block.selected) selectedBlocks++;

                return `
                    <span class="score-block${block.selected ? ' selected' : ''} ${block.color}" data-column="${column.column}" data-row="${index}">
                        ${block.star ? `<span class="star">*</span>` : ``}
                    </span>
                `;
            }).join('');
        }
        // create score columns
        //let score = createElement('div', {className: 'column-score'});
        function renderColumnScores(scores) {
            return scores.map((scoreObject, index) => {
                let state = (scoreObject.state && scoreObject.state !== 'default') ? ' ' + scoreObject.state : '';
                return `<span class="rounded-block column-score${state}" data-column="${column.column}" data-row="${index}">${scoreObject.value}</span>`;
            }).join('');
        }

        if (blocks === selectedBlocks) {
            socket.emit('grid:column-complete', {columnLetter: column.column});
        }

        return tpl;
    }
}

try {
    window.engine = new Engine();
} catch (err) {
    console.error('Failed to load game. Reset state!', err);
}
