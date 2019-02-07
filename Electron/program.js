"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs = require("fs");
const path = require("path");
let mainWindow;
const debug = true;
function createWindow() {
    //todo: může být frameless window
    mainWindow = new electron_1.BrowserWindow({
        width: 1200, height: 900,
        title: 'PetriNetEdit'
    });
    mainWindow.loadFile('index.html');
    mainWindow.on('closed', function () {
        // delete reference for not used object
        mainWindow = null;
        // close app when mainWindow closes
        electron_1.app.quit();
    });
    const userDefaultNetSavePath = path.join(electron_1.app.getPath('userData'), 'User_saved_nets');
    if (!fs.existsSync(userDefaultNetSavePath)) {
        fs.mkdirSync(userDefaultNetSavePath);
    }
    let mainMenuTemplate = [{
            label: "File",
            submenu: [
                {
                    label: "new PNet",
                    click: () => {
                        // todo: confirmace, nabídnutí uložení
                        mainWindow.webContents.send("new PNet");
                    }
                },
                {
                    label: "open PNet",
                    click: () => {
                        const dialogOprions = {
                            title: 'Select PNet to LOAD',
                            // todo: více možností pro user data dle nastavení
                            defaultPath: userDefaultNetSavePath,
                            filters: [
                                { name: 'PNet/JSON file', extensions: ['pnet', 'json'] },
                                { name: 'PNet file', extensions: ['pnet'] },
                                { name: 'JSON file', extensions: ['json'] },
                                { name: 'All Files', extensions: ['*'] }
                            ],
                            // todo: možnost otevřených více sítí v různých 
                            //       záložkách(propojování mezi nimim, ukládání propojených do jednoho souboru nebo do více)
                            properties: ['openFile' /*, 'multiSelections' */]
                        };
                        const dialoRes = electron_1.dialog.showOpenDialog(mainWindow, dialogOprions);
                        mainWindow.webContents.send("open PNet", { path: (dialoRes ? dialoRes[0] : undefined) });
                    }
                },
                {
                    // todo: save as / save
                    label: "save PNet",
                    click: () => {
                        const dialogOprions = {
                            title: 'Save PNet to',
                            // todo: více možností pro user data dle nastavení
                            defaultPath: userDefaultNetSavePath,
                            filters: [
                                { name: 'PNet file', extensions: ['pnet'] },
                                { name: 'JSON file', extensions: ['json'] },
                                { name: 'All Files', extensions: ['*'] }
                            ],
                        };
                        const dialoRes = electron_1.dialog.showSaveDialog(mainWindow, dialogOprions);
                        mainWindow.webContents.send("save PNet", { path: dialoRes });
                    }
                },
                { label: "close" },
                { label: "recent" },
                {
                    label: "Quit",
                    accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                    click: () => {
                        electron_1.app.quit();
                    }
                },
            ]
        }];
    if (process.platform === 'darwin') {
        mainMenuTemplate.unshift({});
    }
    if (debug) {
        mainWindow.webContents.openDevTools();
        mainMenuTemplate.push({
            label: "DEBUG",
            submenu: [
                {
                    label: "DevTools",
                    accelerator: "F12",
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        });
    }
    const mainMenu = electron_1.Menu.buildFromTemplate(mainMenuTemplate);
    electron_1.Menu.setApplicationMenu(mainMenu);
}
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
//# sourceMappingURL=program.js.map