﻿import * as d3 from 'd3';
import * as p from './Helpers/Purify';
import { PNEditor as PNE } from './Editor/Editor';
import { ipcRenderer, remote } from 'electron';
import { messageType } from './Helpers/ProgramEventType';

window.addEventListener('load', main);

async function main() {

    const custom = (remote.getCurrentWindow() as any).custom;

    const div = d3.select(".editor");
    const editor = new PNE(div, custom.savePath);

    ipcRenderer.on("user-event", (e: any, msg: { type: messageType, args: any }) => {
        const { type: msgType, args: msgArgs } = msg;
        console.debug("user-event")
        console.debug(msg);

        switch (msgType) {

            case messageType.PNetNew:
                editor.NewNet();
                break;
            case messageType.PNetLoad:
                editor.Load(msgArgs.path);
                break;
            case messageType.PNetSave:
                editor.Save(msgArgs.path);
                break;
            case messageType.Undo:
                editor.Undo();
                break;
            case messageType.Redo:
                editor.Redo();
                break;

            default:
        }
    });
}
