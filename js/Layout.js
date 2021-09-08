import {$, R} from "./utilities";
import {GridBlock, ColumnScoreBlock, JokerScoreBlock, Grid} from "./Block";

export class Layout {
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
                    <div>
                        <h2 class="rainbow">Spelers</h2>
                        <ul id="activePlayers" class="blockList playerList"></ul>
                    </div>
                    <a id="newGameButton">Nieuw spel</a>
                </div>
            </div>
       `);
    }

    static renderViewChangeLobby() {
        return Layout.applicationWindow('changeLobby', `
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

    static renderPlayer({player}) {
        return `<li class="player" data-player="${player.username}" data-player-id="${player.userId}">${player.username}</li>`;
    }
    static renderPlayerAvatar({url, playerName}) {
        return `<img src="${url}" alt="${playerName}"/><span>${playerName}</span>`;
    }
    static renderJokers({jokers}) {
        $('jokerContainer').innerHTML = jokers
            .map((joker, index) => new JokerScoreBlock({joker, row: index}).render())
            .join('');
    }
    static renderGrid({columns}) {
        const blockGrid = $('blockGrid');
        blockGrid.innerHTML = '';
        columns.forEach(column => {
            blockGrid.append(Layout.renderGridColumn({column}));
            Grid.setColumnScoreState({letter: column.column, shouldEmit: false});
        });
    }
    static renderGridColumn({column}) {
        const letter = column.column;
        return R(`
            <div class="column${column.column === 'H' ? ' highlight' : ''}">
                <span class="rounded-block header" data-letter="${letter}">${letter}</span>
                ${ Layout.renderGridColumnBlocks({blocks: column.grid, column}) }
                ${ Layout.renderColumnScores({column}) }
            </div>
        `);
    }
    static renderGridColumnBlocks({blocks, column}) {
        return blocks.map((block, index) => {
            return new GridBlock({
                letter: column.column,
                row: index,
                color: block.color,
                star: block.star,
                selected: block.selected
            }).render();
        }).join('')
    }
    static renderColumnScores({column}) {
        return `<div class="column-score">${
            column.score.map((scoreObject, row) => {
                const {value, state} = scoreObject, 
                    letter = column.column;
                return new ColumnScoreBlock({ letter, row, value, state }).render();
            }).join('') 
        }</div>`;
    }
}
