"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let mainWindow;
const debug = true;
function createWindow() {
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
    let mainMenuTemplate = [{
            label: "File",
            submenu: [
                { label: "open" },
                { label: "save" },
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