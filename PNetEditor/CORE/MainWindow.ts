import { app, dialog, ipcRenderer } from 'electron';
import { TabControl } from "./TabControl/TabControl";
import d3 = require("d3");
import { html } from "../CORE/Constants";
import * as file from 'fs';
import * as path from 'path';
import { PNModel } from "../Editor/Models/PNet/PNModel";
import { PNEditor } from '../Editor/PNEditor';
import { TabGroup } from './TabControl/TabGroup';

export var tabControl: TabControl;



export function InitWindow() {
    InitSettings();
    InitTabControl();
    InitFileButtons();
}


export var userDefaultNetSavePath: string;
export var userQuickNetSavePath: string;
function InitSettings() {
}

function InitFileButtons() {
    const buttonNew = d3.select("#buttonNew");
    const buttonLoad = d3.select("#buttonLoad");
    const buttonSave = d3.select("#buttonSave");
    const buttonClose = d3.select("#buttonClose");

    buttonNew.on("click", () => {
        const tab = tabControl.addTab();

        const net = new PNModel();
        const editor = new PNEditor(tab, net);
    })

    function load(path: string) {
        try {
            const objString = file.readFileSync(path, { encoding: "utf8" });
            const jsonNet = JSON.parse(objString);
            const net = new PNModel();

            // todo: eskalace
            if (net.fromJSON(jsonNet)) { }

            console.log("%c LOADED net", "color: rgb(0, 0, 255)");

            const tab = tabControl.addTab();
            const editor = new PNEditor(tab, net);
            console.log(editor);
        } catch (ex) {
            console.error("cannot read file " + path);
            console.error(ex)
            return false;
        }

        return true;
    };
    ipcRenderer.on("load-dialog-response", (e: any, path: string) => {
        console.debug(path);
        load(path);
    });
    buttonLoad.on("click", () => {
        ipcRenderer.send('load-dialog');
    });



    function save(path: string) {
        try {
            const obj = groupmap.get(tabControl.SelectedTab.parentTabGroup);
            if (!obj.IsSaveable())
                return;

            file.writeFileSync(path, obj.GetStringToSave(), { encoding: "utf8" });

            console.log("%c Saved net", "color: rgb(0, 0, 255)");
        } catch (ex) {
            console.error("cannot save file " + path);
            console.error(ex);
            return false;
        }

        return true;
    };
    ipcRenderer.on("save-dialog-response", (e: any, path: string) => {
        save(path);
    });
    buttonSave.on("click", () => {
        ipcRenderer.send('save-dialog');
    });


    groupmap = new Map();
}


function InitTabControl() {
    const tabsButtons = d3.select("." + html.classes.page.controlPanelTabs);
    const content = d3.select("#content");

    tabControl = new TabControl(tabsButtons, content);

    //const tab = tabControl.addTab();
    //tabControl.addTab(tab.parentTabGroup);
}

export interface TabInterface {
    IsSaveable(): boolean;
    GetStringToSave(): string;
}
export var groupmap: Map<TabGroup, TabInterface>;
