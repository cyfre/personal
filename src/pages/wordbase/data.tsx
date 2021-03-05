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
                info: Info.of(data.info),
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
        api.post(`/wordbase/g/${info.id}`, { info, state: save.serialize() });
    }
}

export function rematchGame(info: Info): Promise<{info: Info}> {
    return new Promise(resolve => {
        let newSave = Save.new();
        if (info.id === localInfo.id) {
            localInfo = Info.local();
            localSave = newSave;
            resolve({ info: localInfo });
        } else {
            api.post(`/wordbase/g/${info.id}/rematch`, {
                state: newSave.serialize()
            }).then(data => {
                console.log(data);
                resolve({ info: data.info });
            });
        }
    });
}