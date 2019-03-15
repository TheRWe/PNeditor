import * as d3 from 'd3';
import * as p from './Helpers/Purify';
import { PNEditor as PNE } from './Editor/Editor';
import { ipcRenderer } from 'electron';

window.addEventListener('load', main);


async function main()
{
    const div = d3.select(".editor");
    const editor = new PNE(div);

    ipcRenderer.on("new PNet", (e: any, msg: any) => {
        console.log("new net");
        //todo: msg -> typ sítě atd...
        editor.NewNet();
    });
    ipcRenderer.on('load PNet', (e: any, msg: any) => {
        if (msg.path)
            editor.Load(msg.path);
    });
    ipcRenderer.on('save PNet', (e: any, msg: any) => {
        if (msg)
            editor.Save(msg.path);
    });

    ipcRenderer.on('quick-load PNet', (e: any) => {
        editor.AutoLoad();
    });
    ipcRenderer.on('quick-save PNet', (e: any) => {
        editor.AutoSave();
    });

    ipcRenderer.on("undo Net", (e: any) => {
        editor.Undo();
    });
    ipcRenderer.on("redo Net", (e: any) => {
        editor.Redo();
    });
}

