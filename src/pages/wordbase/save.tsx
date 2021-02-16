import { IPos, Player, Tile, Board } from './board';

export class Save {
    board: Board;
    turn: number;
    history: Tile[][];
    player: Player;
    opponent: Player;

    constructor(board: Board, turn: number, history: Tile[][]) {
        this.board = board;
        this.turn = turn;
        this.history = history;
        this.player = this.turn % 2;
        this.opponent = 1 - this.player;
    }
    static new() {
        return new Save(Board.new(), 0, []);
    }
    clone() {
        return new Save(this.board.clone(), this.turn, this.history.slice());
    }

    play(word: IPos[]): Save {
        let tiles = word.map(pos => this.board.get(pos));

        let newBoard = this.board.clone();
        let toFlip = tiles.slice();
        while (toFlip.length) {
            let nextFlip = [];
            toFlip.forEach(tile => {
                tile.owner = this.player;
                if (tile.isBomb) {
                    newBoard.get(tile).isBomb = false;
                    nextFlip.push(...newBoard.square(tile));
                }
            })
            toFlip = nextFlip;
        }
        let otherSafe = newBoard.bfs(this.opponent);
        newBoard.do(tile => {
            if (tile.owner === this.opponent && !Tile.has(otherSafe, tile)) {
                tile.owner = Player.none;
            }
        });

        return new Save(newBoard, this.turn + 1, this.history.concat(tiles));
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