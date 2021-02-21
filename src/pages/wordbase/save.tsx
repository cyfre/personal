import { IPos, Player, ITile, Tile, Board } from './board';

export class Save {
    board: Board;
    turn: number;
    history: ITile[][];
    player: Player;
    opponent: Player;
    p1: boolean;
    p2: boolean;
    pN: string;
    oN: string;

    constructor(board: Board, turn: number, history: ITile[][]) {
        this.board = board;
        this.turn = turn;
        this.history = history;
        this.player = this.turn % 2;
        this.opponent = 1 - this.player;
        this.p1 = this.player === Player.p1;
        this.p2 = this.player === Player.p2;
        this.pN = this.p1 ? 'p1' : 'p2';
        this.oN = this.p1 ? 'p2' : 'p1';
    }
    static new() {
        return new Save(Board.new(), 0, []);
    }
    static empty = () => new Save(undefined, -1, []);
    clone() {
        return new Save(this.board.clone(), this.turn, this.history.slice());
    }
    get = (pos_or_row: (IPos | number), col?: number): ITile => this.board.get(pos_or_row, col);

    play(word: IPos[]): Save {
        let deep = this.board.deep();
        let tiles = word.map(pos => deep.get(pos));
        let msDelay = 300;
        let currMs = -msDelay;

        deep.do(t => {
            t.swap = undefined;
        });
        let flip = (t, player, ms, bombFlips?) => {
            if (!t.swap) {
                t.swap = { ms, from: Tile.new(t), new: true };
            }
            t.owner = player;
            if (t.isBomb) {
                t.isBomb = false;
                bombFlips && bombFlips.push(deep.square(t));
            }
        }

        let { player, opponent } = this;
        let bombFlips: ITile[][] = [];
        tiles.forEach(t => {
            currMs += msDelay;
            flip(t, player, currMs, bombFlips);
        });

        while (bombFlips.length) {
            currMs += 2 * msDelay;
            bombFlips.shift().forEach(t => flip(t, player, currMs, bombFlips));
        }

        currMs += 2 * msDelay;
        let oppoSafe = deep.bfs(opponent);
        deep.tiles()
            .filter(t => t.owner === opponent && !Tile.has(oppoSafe, t))
            .forEach(t => flip(t, Player.none, currMs));

        return new Save(deep, this.turn + 1, [tiles].concat(this.history));
    }

    serialize() {
        return JSON.stringify({
            board: this.board.board,
            turn: this.turn,
            history: this.history,
        });
    }
    static deserialize(str: string) {
        let save = JSON.parse(str);
        return new Save(new Board(save.board), save.turn, save.history);
    }
}

export class Info {
    id: string;
    p1: string;
    p2: string;
    status: Player;
    progress: number[];
    turn: number;
    lastWord?: string;
    lastUpdate?: number;

    constructor(id: string, p1: string, p2: string, status: Player, progress: number[], turn: number, lastWord?: string, lastUpdate?: number) {
        Object.assign(this, {id, p1, p2, status, progress, turn, lastWord, lastUpdate});
    }
    static local() {
        return new Info('local', 'blue', 'orange', Player.none, [0, 100], 0);
    }
    static empty = () => new Info('local', '', '', Player.none, [0, 100], -1);
    static of(info: Info) {
        return new Info(info.id, info.p1, info.p2, info.status, info.progress, info.turn, info.lastWord, info.lastUpdate);
    }
    static play(info: Info, save: Save): Info {
        let board = save.board
        let total = Board.ROWS - 1
        let p1 = total
        board.do(tile => {
            if (tile.owner === Player.p1) {
                p1 = Math.min(p1, tile.row);
            }
        });
        let p2 = 0;
        board.do(tile => {
            if (tile.owner === Player.p2) {
                p2 = Math.max(p2, tile.row);
            }
        });

        let progress;
        if (p2 >= p1) {
            p2 = total - p2;
            let ratio = p1 / (p1 + p2);
            progress = [ratio, ratio]
        } else {
            progress = [p2/total, p1/total]
        }

        return Info.of({ ...info,
            status: board.gameStatus(),
            progress: progress.map(x => Math.round(x * 100)),
            turn: save.turn,
            lastWord: save.history.length
                ? save.history[0].map(t => t.letter).join('')
                : undefined,
        });
    }
}
