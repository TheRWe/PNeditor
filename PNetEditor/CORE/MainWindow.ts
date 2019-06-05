import { TabControl } from "./TabControl/TabControl";
import d3 = require("d3");

export var tabControl: TabControl;



export function InitWindow() {
    InitTabControl();
    InitFileButtons();
}

function InitFileButtons() {
    const buttonNew = d3.select("#buttonNew");
    const buttonLoad = d3.select("#buttonLoad");
    const buttonSave = d3.select("#buttonSave");
    const buttonClose = d3.select("#buttonClose");

    buttonNew.on("click", () => {
        tabControl.addTab();
    })
}


function InitTabControl() {
    const tabsButtons = d3.select(".control-panel-tabs");
    const content = d3.select("#content");

    tabControl = new TabControl(tabsButtons, content);

    tabControl.addTab().label = "lab1";
    const tabbb = tabControl.addTab();
    tabControl.addTab(tabbb.parentTabGroup).label = "sss";
    tabControl.addTab(tabbb.parentTabGroup).container.append("div").text("asddd");
    tabControl.addTab(tabbb.parentTabGroup).container.append("div").text("sssasddd");
    tabControl.addTab(tabbb.parentTabGroup).container.append("div").text("asdasdasdddddd");


    tabControl.addTab().remove();
    const aaa = tabControl.addTab();
    aaa.label = "aaaaaa";
    aaa.addOnBeforeRemove(e => {
        console.debug(e);
        e.cancelClose = true;
    });
    aaa.remove();
}
