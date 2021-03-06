export default {
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
        jokers: 'Jokers',
        startGame: 'Start Spel'
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
    }
}
