import api from '../../lib/api';
import { Info, Save } from './save';
import { ITile, Tile, Board } from './board';

export let localInfo = Info.local();
export let localSave = Save.new();

export async function fetchInfo(gameId: string): Promise<{info: Info}> {
    return new Promise(resolve => {
        if (gameId === localInfo.id) resolve({ info: localInfo });
        else api.get(`/wordbase/g/${gameId}`).then(data => {
            resolve({
                info: Info.of(data.info)
            });
        }).catch(err => console.log(err, err.error));
    });
}

export async function fetchGame(gameId: string): Promise<{info: Info, save: Save}> {
    return new Promise(resolve => {
        if (gameId === localInfo.id) resolve({ info: localInfo, save: localSave });
        else api.get(`/wordbase/g/${gameId}/board`).then(data => {
            let save = Save.deserialize(data.state);
            resolve({
                info: Info.play(Info.of(data.info), save),
                save,
            });
        }).catch(err => console.log(err, err.error));
    });
}

export function updateGame(info: Info, save: Save) {
    if (info.id === localInfo.id) {
        localInfo = info;
        localSave = save;
    } else {
        api.post(`/wordbase/g/${info.id}`, { info, state: save.serialize() }).then(data => {
            console.log(data);
        });
    }
}

export function rematchGame(info: Info, callback: (i:Info, s:Save)=>any) {
    let newSave = Save.new();
    if (info.id === localInfo.id) {
        localInfo = Info.local();
        localSave = newSave;
        callback(localInfo, localSave);
    } else {
        api.post(`/wordbase/g/${info.id}/rematch`, {
            state: Save.new().serialize()
        }).then(data => {
            console.log(data);
            callback(data.info, newSave);
        });
    }
}