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
    clone() {
        return new Save(this.board.clone(), this.turn, this.history.slice());
    }
    get = (pos_or_row: (IPos | number), col?: number): ITile => this.board.get(pos_or_row, col);

    play(word: IPos[]): Save {
        let flip = new Flip(this, word);
        while (flip.hasNext()) flip.next();
        return flip.curr();
    }
}

export class Info {
    id: string;
    p1: string;
    p2: string;
    status: Player;
    progress: number[];

    constructor(id: string, p1: string, p2: string, status: Player, progress: number[]) {
        Object.assign(this, {id, p1, p2, status, progress});
    }
    static local() {
        return new Info('local', 'blue', 'orange', Player.none, [0, 100]);
    }
    clone() {
        return new Info(this.id, this.p1, this.p2, this.status, this.progress.slice());
    }

    updateProgress(board: Board): Info {
        let p0 = Board.ROWS;
        board.do(tile => {
            if (tile.owner === 0) {
                p0 = Math.min(p0, tile.row);
            }
        });
        let p1 = 0;
        board.do(tile => {
            if (tile.owner === 1) {
                p1 = Math.max(p1, tile.row);
            }
        });
        let total = Math.max(Board.ROWS, p1 + (Board.ROWS - p0));

        let newProgress = [p1/total, (p0+1)/total].map(x => Math.round(x * 100));
        return new Info(this.id, this.p1, this.p2, board.gameStatus(), newProgress);
    }
}

export class Flip {
    private save: Save;
    private tiles: ITile[];
    private flips: ITile[][];

    constructor(save: Save, word: IPos[]) {
        this.save = save.clone();
        this.tiles = word.map(pos => this.save.get(pos));
        this.flips = [];

        let deep = save.board.deep();
        let { player, opponent } = save;

        let toFlip: ITile[][] = word.map(pos => [deep.get(pos)]);
        while (toFlip.length) {
            let newFlip = [];
            toFlip.map(ts => {
                this.flips.push(ts);
                ts.map(t => {
                    t.owner = player;
                    if (t.isBomb) {
                        t.isBomb = false;
                        newFlip.push(deep.square(t));
                    }
                });
            });
            toFlip = newFlip;
        }
        let oppoSafe = deep.bfs(opponent);
        let oppoLose = deep.tiles()
            .filter(t => t.owner === opponent && !Tile.has(oppoSafe, t))
            .map(t => {
                t.owner = Player.none;
                return t;
            });
        this.flips.push(oppoLose);

        this.flips.forEach(ts => ts.forEach(t => {
            save.get(t).flipped = false;
        }));
    }

    curr = () => this.save.clone();
    hasNext = () => this.flips.length;
    next(swapMs?: number, swapCallback?: () => any): Save {
        let swaps = [];
        let swap = () => swapMs
            ? setTimeout(() => { swaps.forEach(a => a()); swapCallback(); }, swapMs)
            : swaps.forEach(action => action());

        if (this.flips.length) {
            this.flips.shift().forEach(t => {
                let actual = this.save.get(t);
                actual.flipped = true;
                swaps.push(() => {
                    actual.owner = t.owner;
                    actual.isBomb = t.isBomb;
                });
            });
            swap();
            if (!this.flips.length) {
                this.save = new Save(this.save.board, this.save.turn + 1, [this.tiles].concat(this.save.history));
            }
        }
        return this.save.clone();
    }
}