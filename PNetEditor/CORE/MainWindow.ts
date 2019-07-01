import { app, dialog, ipcRenderer } from 'electron';
import { TabControl } from "./TabControl/TabControl";
import d3 = require("d3");
import { html } from "../CORE/Constants";
import * as file from 'fs';
import * as path from 'path';
import { PNModel } from "../Editor/Models/PNet/PNModel";
import { PNEditor } from '../Editor/PNEditor';
import { TabGroup } from './TabControl/TabGroup';
import { TabKeyDownEvent } from './TabControl/Tab';
import { showModal } from './Modal';

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

const TabActions = {
    new: () => {
        const tab = tabControl.addTab();

        const net = new PNModel();
        const editor = new PNEditor(tab, net);
    },
    load: (path: string) => {
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

            editor.Path = path;
        } catch (ex) {
            showModal("cannot open file", "OK");

            console.error("cannot read file " + path);
            console.error(ex)
            return false;
        }

        return true;
    },
    save: (path: string) => {
        try {
            const obj = groupmap.get(tabControl.SelectedTab.parentTabGroup);
            if (!obj.IsSaveable())
                return;

            file.writeFileSync(path, obj.GetStringToSave(), { encoding: "utf8" });

            obj.Path = path;

            console.log("%c Saved net", "color: rgb(0, 0, 255)");
        } catch (ex) {
            showModal("cannot save file", "OK");

            console.error("cannot save file " + path);
            console.error(ex);
            return false;
        }

        return true;
    },
    close: () => {
        const tab = tabControl.SelectedTab;
        if (tab) {
            tab.remove();
        }
    },
    initDialog: {
        save: () => {

            const tab = tabControl.SelectedTab;
            if (!tab) {
                showModal("No tab selected, nothing to save.", "OK");
                return;
            }

            const obj = groupmap.get(tab.parentTabGroup);
            if (!obj.IsSaveable()) {
                showModal("Selected tab cannnot be saved.", "OK");
                return;
            }
            ipcRenderer.send('save-dialog');
        },
        load: () => { ipcRenderer.send('load-dialog'); },
    },
}

function InitFileButtons() {
    const buttonNew = d3.select("#buttonNew");
    const buttonLoad = d3.select("#buttonLoad");
    const buttonSave = d3.select("#buttonSave");
    const buttonClose = d3.select("#buttonClose");

    buttonNew.on("click", TabActions.new)
    buttonLoad.on("click", TabActions.initDialog.load);
    buttonSave.on("click", TabActions.initDialog.save);
    buttonClose.on("click", TabActions.close);

    ipcRenderer.on("load-dialog-response", (e: any, path: string) => {
        console.debug(path);
        TabActions.load(path);
    });

    ipcRenderer.on("save-dialog-response", (e: any, path: string) => {
        TabActions.save(path);
    });



    groupmap = new Map();
}


function InitTabControl() {
    const tabsButtons = d3.select("." + html.classes.page.controlPanelTabs);
    const content = d3.select("#content");

    tabControl = new TabControl(tabsButtons, content);

    document.addEventListener("keypress", (e) => {
        console.debug(e);

        const tab = tabControl.SelectedTab;
        if (tab) {
            const handler = (tab as any)._onKeyDownWhenOpened as (e: TabKeyDownEvent) => void;
            handler(e);
        }

        if (e.ctrlKey) {
            // todo: keycode
            // N
            if (e.keyCode === 14)
                TabActions.new();
            // O
            if (e.keyCode === 15)
                TabActions.initDialog.load();
            // S
            if (e.keyCode === 19)
                TabActions.initDialog.save();
        }
    });

    //const tab = tabControl.addTab();
    //tabControl.addTab(tab.parentTabGroup);
}

export interface TabInterface {
    IsSaveable(): boolean;
    GetStringToSave(): string;
    Path: string;
}

// todo: mapovat Tab ne tabgroup
export var groupmap: Map<TabGroup, TabInterface>;
