function $(id) {
    return document.getElementById(id);
}

function randomString(length = 6) {
    return Math.random().toString(16).substr(-length);
}

function forEachQuery(query, callback) {
    Array.prototype.forEach.call(
        document.querySelectorAll(query), callback
    );
}

const EVENTS = {
    GAME_NEW: 'new-game',
    GAME_RESET: 'state-reset',
    GAME_START: 'start-game',
    LEVEL_RESET: 'reset-level',
    LEVEL_SELECTED: 'level-selected',
    SCORE_SHOW: 'show-score',
    MODAL_TOGGLE: 'modal-toggle',
    MODAL_HIDE: 'modal-hide',
    MODAL_SHOW: 'modal-show',
    LOBBY_CREATED: 'lobby-created',
    LOBBY_JOINED: 'lobby-joined'
};
function dispatch(eventName, eventData) {
    console.log('Fired event: ' + eventName, eventData);
    let event = new CustomEvent(eventName, { detail: eventData });
    $('app').dispatchEvent(event);
}
function listen(eventName, callback) {
    $('app').addEventListener(eventName, callback, false);
}
function registerEvents(events = []) {
    events.forEach(event => {
        listen(event.name, event.callback);
    });
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
        selectLevel: 'Selecteer een level.'
    }
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

function renderNewGameButton(cb) {
    const buttonId = 'newGame';
    if ($(buttonId)) {
        return;
    }

    const button = renderButton({
        callback: cb,
        label: language.label.newGame,
        className: 'new-game',
        id: buttonId
    });

    // New game button
    $('grid').append(button);

    return button;
}

function renderTotalScores() {
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
        dispatch(EVENTS.SCORE_SHOW);
    }, false);
}

function registerModalEvents() {
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

function createNewGameModal() {
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
        'level1': level1,
        'level2': level2,
        'level3': level3,
        'level4': level4
    };

    constructor() {
        listen(EVENTS.LEVEL_RESET, () => {
            this.selectedLevel = false;
        });
        listen(EVENTS.LEVEL_SELECTED, () => {
            dispatch(EVENTS.MODAL_HIDE, {modalId: 'selectLevelModal'});
        });

        let savedLevel = localStorage.getItem('kok_level');
        if (savedLevel) {
            this.level = savedLevel;
        }
    }

    reset() {
        localStorage.removeItem('kok_level');
    }

    select() {
        if (this.selectedLevel !== false) {
            dispatch(EVENTS.LEVEL_SELECTED, {level: this.selectedLevel});
            return;
        }

        let self = this, levelModalId = 'selectLevelModal';
        if ($(levelModalId)) {
            // Show modal
            dispatch(EVENTS.MODAL_SHOW, {modalId: levelModalId});
            return;
        }

        createNewModal({
            id: 'selectLevelModal',
            visible: true,
            message: false,
            body: `
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
            `,
            buttons: false
        });

        forEachQuery('.level-image-container a', level => {
            level.addEventListener('click', (event) => {
                event.preventDefault();
                self.level = event.target.id;
            }, false);
        });
    }

    set level(value) {
        localStorage.setItem('kok_level', value);
        this.selectedLevel = Level.levelMap[value];
        this.notify();
    }

    get level() {
        return this.selectedLevel;
    }

    notify() {
        dispatch(EVENTS.LEVEL_SELECTED, {level: this.selectedLevel});
    }
}

class EventRegistry {
    constructor() {
        registerModalEvents();
    }
}

const newGameData = {
    "code": "",
    "members": [],
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

class Game {
    static JOKER_VALUE = 1;
    static STAR_VALUE = 2;
    static TOTAL_JOKERS = 8;
    static COLORS = ['green', 'yellow', 'blue', 'red', 'orange'];

    constructor() {
        new EventRegistry();
    }

    static newGameData(gameKey = '') {
        const newGame = {...newGameData};
        newGame.code = gameKey;

        return newGame;
    }
}

function parseColumn(column) {
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

    return columnTemplate;
}

function createState() {
    let state = {
        grid: LevelState.level,
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
function resetState() {
    localStorage.removeItem('kok_state');
    LevelState.reset();
    dispatch(EVENTS.GAME_RESET);
}
function getState() {
    return JSON.parse(localStorage.getItem('kok_state')) || createState();
}
function setState(state) {
    localStorage.setItem('kok_state', JSON.stringify(state));
}
function updateState(column, index, key, value, type = 'grid') {
    let currentState = getState();
    let found = false;
    currentState.grid.forEach((stateColumn, stateIndex) => {
        if (stateColumn.column === column) {
            currentState.grid[stateIndex][type][index][key] = value;
            found = true;
        }
    });

    if (found) {
        setState(currentState);
    }

    render(currentState);
}
function updateBlockState(col, row, key, value) {
    let currentState = getState();
    let found = false;
    currentState.grid.forEach((stateColumn, stateIndex) => {
        if (stateColumn.column === col) {
            currentState.grid[stateIndex].grid[row][key] = value;
            found = true;
        }
    });

    if (found) {
        setState(currentState);
    }

    render(currentState);
}
function updateJokerState(row, selected) {
    let currentState = getState();
    let found = false;
    currentState.jokers.forEach((joker, index) => {
        if (index === row) {
            joker.selected = selected;
            found = true;
        }
    });

    if (found) {
        setState(currentState);
        render(currentState);
    }
}
function updateColorScoreState(group, color, value) {
    let found = false;
    let currentState = getState();
    currentState.colorScores[group].forEach((colorScore) => {
        if (colorScore.color === color) {
            colorScore.value = value;
            found = true;
        }
    });

    if (found) {
        setState(currentState);
        render(currentState);
    }

}

function registerEventListeners() {
    // Colored blocks
    let scoreBlocks = document.querySelectorAll('.score-block:not(.final-score)');
    Array.prototype.forEach.call(scoreBlocks, (scoreBlock) => {
        scoreBlock.addEventListener('click', () => {
            let blockSelected = !scoreBlock.classList.contains('selected');
            updateBlockState(scoreBlock.data.column, scoreBlock.data.row, 'selected', blockSelected);
            setStarTotal();
        }, false);
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
        COLORS.forEach(mappedColor => {
            if (element.classList.contains(mappedColor)) {
                color = mappedColor;
            }
        });

        return color;
    };
    let highScores = document.querySelectorAll('#scoreColumn1 .final-score');
    Array.prototype.forEach.call(highScores, (highScore) => {
        highScore.addEventListener('click', () => {
            updateColorScoreState(
                'high',
                getColorFromElement(highScore),
                getValueFromClass(highScore, 5, -1)
            );
            setBonusTotal();
        }, false);
    });
    let lowScores = document.querySelectorAll('#scoreColumn2 .final-score');
    Array.prototype.forEach.call(lowScores, (lowScore) => {
        lowScore.addEventListener('click', () => {
            updateColorScoreState(
                'low',
                getColorFromElement(lowScore),
                getValueFromClass(lowScore, 3, -1)
            );
            setBonusTotal();
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

            updateState(col, row, 'state', state, 'score');
            setColumnTotal();
        }, false);
    });

    // Jokers
    let jokers = document.getElementsByClassName('joker');
    Array.prototype.forEach.call(jokers, (joker, index) => {
        joker.addEventListener('click', () => {
            let state = !joker.classList.contains('used');
            updateJokerState(index, state);
            setJokerTotal();
        }, false);
    });
}

function getTotalScore() {
    return getBonusTotal() + getColumnTotal() + getJokerTotal() - getStarTotal();
}
function setTotalScore() {
    let element = $('totalScore');
    if (element.classList.contains('hide')) {
        element.innerText = getTotalScore();
        element.classList.remove('hide');
    } else {
        element.innerText = '';
        element.classList.add('hide');
    }
}
function getBonusTotal() {
    let bonuses = document.querySelectorAll('.final-selected span');
    let bonusTotal = 0;
    Array.prototype.forEach.call(bonuses, (bonus) => {
        bonusTotal += parseInt(bonus.innerText);
    });

    return bonusTotal;
}
function setBonusTotal() {
    $('bonusTotal').innerText = getBonusTotal();
}
function getJokerTotal() {
    let jokers = document.getElementsByClassName('joker');
    let totalJokers = jokers.length;
    let usedJokers = 0;
    Array.prototype.forEach.call(jokers, (joker) => {
        if (joker.classList.contains('used')) {
            usedJokers++;
        }
    });

    return (totalJokers - usedJokers) * Game.JOKER_VALUE;
}
function setJokerTotal() {
    $('jokerTotal').innerText = getJokerTotal();
}
function getColumnTotal() {
    let activeColumns = document.querySelectorAll('span.column-score.active');
    let totalValue = 0;
    Array.prototype.forEach.call(activeColumns, (activeColumn) => {
        let value = parseInt(activeColumn.innerText);
        totalValue += value;
    });

    return totalValue;
}
function setColumnTotal() {
    $('columnsTotal').innerText = getColumnTotal();
}

function getStarTotal() {
    let activeStars = document.querySelectorAll('span.selected span.star').length;
    let totalStars = document.querySelectorAll('span.star').length;

    return (totalStars - activeStars) * Game.STAR_VALUE;
}
function setStarTotal() {
    $('starsTotal').innerText = getStarTotal();
}

function render(state) {
    if (typeof state === 'undefined') {
        state = getState();
    }

    $('blockGrid').innerHTML = '';
    state.grid.forEach(column => {
        $('blockGrid').append(parseColumn(column));
    });

    let jokerContainer = $('jokerContainer');
    jokerContainer.innerHTML = '';
    state.jokers.forEach(joker => {
        let renderedJoker = createElement('span', {className: 'joker', innerText: '!'});
        if (joker.selected) {
            renderedJoker.classList.add('used');
        }
        jokerContainer.append(renderedJoker);
    });

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

    renderTotalScores();

    let newGameModal = createNewGameModal();
    renderNewGameButton((event) => {
        event.preventDefault();
        dispatch(EVENTS.MODAL_TOGGLE, {modalId: newGameModal.id});
    });

    registerEventListeners();
    setBonusTotal();
    setJokerTotal();
    setColumnTotal();
    setStarTotal();
}

const LevelState = new Level();

listen(EVENTS.GAME_NEW, () => {
    resetState();
});
listen(EVENTS.GAME_RESET, () => {
    dispatch(EVENTS.GAME_START);
});
listen(EVENTS.GAME_START, () => {
    LevelState.select();
});
listen(EVENTS.LEVEL_SELECTED, () => {
    render(getState());
});
listen(EVENTS.SCORE_SHOW, () => {
    setTotalScore();
});

new Game();


dispatch(EVENTS.GAME_START);
//init();

createNewModal({
    id: 'orientationModal',
    message: language.notification.landscapeMode
});
