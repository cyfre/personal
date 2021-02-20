import { initArr, randi, dist } from './util';
import { randAlpha } from './dict';

export enum Player { none = -1, p1 = 0, p2 = 1 }

export interface IPos {
    row: number,
    col: number,
}
export class Pos implements IPos {
    row: number; col: number;

    constructor(row: number, col: number) { Object.assign(this, {row, col}); }
    static new = (props: IPos): Pos => new Pos(props.row, props.col)
    static from = (coord: number[]): Pos => new Pos(coord[1], coord[0]);
    static eq = (a: IPos, b: IPos) => (a && b && a.row === b.row && a.col === b.col);
    static add = (a: IPos, b: IPos) => new Pos(a.row + b.row, a.col + b.col);
}
export class Dirs {
    static UP: Pos = Pos.from([0, -1]);
    static DOWN: Pos = Pos.from([0, 1]);
    static LEFT: Pos = Pos.from([-1, 0]);
    static RIGHT: Pos = Pos.from([1, 0]);
    static LIST: Pos[] = [Dirs.UP, Dirs.RIGHT, Dirs.DOWN, Dirs.LEFT];
    static map = (func: (dir: IPos) => any) => Dirs.LIST.map(func);
}

export interface Swap {
    from: ITile,
    ms: number,
    new: boolean,
}
export interface ITile extends IPos {
    letter: string,
    owner: number,
    isBomb: boolean,
    swap?: Swap,
}
export class Tile extends Pos implements ITile {
    letter: string; owner: number; isBomb: boolean; swap?: Swap;

    constructor(row: number, col: number, letter: string, owner: number, isBomb: boolean) {
        super(row, col);
        Object.assign(this, { letter, owner, isBomb });
    }
    static new = (props: ITile) => Object.assign({}, props);

    static has = (arr: any[], tile: ITile): boolean =>
        arr.some(t => Tile.eq(t, tile));

    static isAdj = (p1: IPos, p2: IPos): boolean =>
        dist(p1.row, p1.col, p2.row, p2.col) < 2;
}

export class Board {
    static readonly ROWS = 13;
    static readonly COLS = 10;
    static readonly BASE = [0, Board.ROWS - 1];
    board: ITile[][];

    constructor(board: ITile[][]) {
        this.board = board;
    }
    static new() {
        let board = initArr(Board.ROWS, row => initArr(Board.COLS, col => {
            const inField = !Board.BASE.includes(row);
            return Tile.new({
                row,
                col,
                letter: randAlpha(),
                owner: inField ? Player.none : (row === 0) ? Player.p2 : Player.p1,
                isBomb: inField ? randi(33) === 0 : false,
            });
        }));
        return new Board(board);
    }

    get(pos_or_row: (IPos | number), col?: number): ITile {
        let pos = (col === undefined) ? pos_or_row as IPos : { row: pos_or_row as number, col };
        return this.board[pos.row] ? this.board[pos.row][pos.col] : undefined;
    }

    do(func: (tile: ITile, r_i?: number, c_i?: number) => any): any[][] {
        return this.board.map((row, r_i) => row.map((tile, c_i) => func(tile, r_i, c_i)));
    }
    rows(func: (row: ITile[], r_i?: number) => any): any[][] {
        return this.board.map((row, r_i) => func(row, r_i));
    }
    tiles = () => this.board.flat();

    clone(): Board {
        return new Board(this.board);
    }
    deep(): Board {
        return new Board(this.do(tile => Tile.new(tile)));
    }

    adj(pos: IPos): ITile[] {
        let tiles: ITile[] = [];
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                if (i === 0 && j === 0) continue;
                tiles.push(this.get({
                    row: pos.row + i,
                    col: pos.col + j
                }));
            }
        }
        return tiles.filter(t => t);
    }
    square(pos: IPos): ITile[] {
        return Dirs.map(dir => this.get(Pos.add(pos, dir))).filter(t => t);
    }
    bfs(player: Player): ITile[] {
        let base = (player === Player.p1) ? Board.BASE[1] : Board.BASE[0];
        let frontier = this.board[base].slice();
        let connected = new Set(this.board[base]);
        while (frontier.length) {
            this.adj(frontier.pop())
                .filter(tile => tile.owner === player && !connected.has(tile))
                .forEach(tile => {
                    frontier.push(tile);
                    connected.add(tile);
                });
        }

        return Array.from(connected);
    }

    gameStatus(): Player {
        if (this.board[Board.BASE[1]].some(tile => tile.owner === Player.p2)) return Player.p2;
        if (this.board[Board.BASE[0]].some(tile => tile.owner === Player.p1)) return Player.p1;
        return Player.none;
    }
}
