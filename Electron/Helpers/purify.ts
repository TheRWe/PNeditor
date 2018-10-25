import * as file from 'fs';
import { promises } from 'fs';

//todo: testování
export function readObjectFromFileSync<T extends object>(path: string | number | Buffer | URL): T | null
{
    try {
        let objString = file.readFileSync(path, { encoding: "utf8" });
        const obj = JSON.parse(objString);
        const typedObj: T = {} as T;
        return Object.assign(typedObj, obj);
    } catch{
        return null;
    }
}
//todo: testování
export function writeObjectToFileSync<T>(path: string | number | Buffer | URL, obj: T): boolean
{
    try {
        file.writeFileSync(path, JSON.stringify(obj), { encoding: "utf8" });
    } catch{
        return false;
    }
    return true;
}

//todo: async

export function fileExample()
{
    const fileName = "settings.json";
    let sett = {
        autosave: true,
        dafults: [1, 2, 100]
    };

    file.writeFile(fileName, JSON.stringify(sett), (err) => { if (err) console.error("error writing data"); });
    sleep(10000);
    file.readFile(fileName, { encoding: "utf8" }, (err, data: string) =>
    {
        if (err)
            console.error('failed to read');
        else
            console.log(data);
    });
}


export async function sleep(ms: number)
{
    await _sleep(ms);
}
function _sleep(ms: number)
{
    return new Promise((resolve) => setTimeout(resolve, ms));
}
