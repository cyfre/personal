import api from '../../lib/api';
import { Info, Save } from './save';
import { ITile, Tile, Board } from './board';

export let localInfo = Info.local();
export let localSave = Save.new();

export async function fetchInfo(gameId: string): Promise<Info> {
    return new Promise(resolve => {
        if (gameId === localInfo.id) resolve(localInfo);
        else api.read(`/wordbase/info/${gameId}`, data => {
            resolve(new Info(data.id, data.p1, data.p2, data.status, data.progress));
        });
    });
}

export async function fetchSave(gameId: string): Promise<Save> {
    return new Promise(resolve => {
        if (gameId === localInfo.id) resolve(localSave);
        else api.read(`/wordbase/save/${gameId}`, data => {
            let board = new Board((data.board as ITile[][])
                .map(row => row.map(tile => Tile.new(tile))));
            let history = (data.history as ITile[][])
                .map(entry => entry.map(tile => Tile.new(tile)));
            resolve(new Save(board, data.turn, history));
        });
    });
}

export function updateGame(gameInfo: Info, gameSave: Save) {
    if (gameInfo.id === localInfo.id) {
        localInfo = gameInfo;
        localSave = gameSave;
    } else {
        api.update(`/wordbase/info/${gameInfo.id}`, gameInfo);
        api.update(`/wordbase/save/${gameInfo.id}`, gameSave);
    }
}