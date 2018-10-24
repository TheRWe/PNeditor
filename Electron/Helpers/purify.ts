import * as file from 'fs';

export function readObjectFromFileSync<T>(path: string | number | Buffer | URL)
{
    let objString = file.readFileSync(path, { encoding: "utf8" });


}

/*
export function readObjectFromFile<T>(path: string | number | Buffer | URL, handler)
{
    file.readFile(path, { encoding: "utf8" }, (err, data: string) =>
    {
        if (err)
            console.error('failed to read');
        else
            console.log(data);
    });
}
*/

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
