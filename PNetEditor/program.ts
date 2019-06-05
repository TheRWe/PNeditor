import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { messageType } from './Helpers/ProgramEventType';

let mainWindow: BrowserWindow;
const debug: boolean = true;

function createWindow() {
    //todo: může být frameless window
    mainWindow = new BrowserWindow({
        width: 1600, height: 900,
        title: 'PetriNetEdit'
    });

    const userDefaultNetSavePath = path.join(app.getPath('userData'), 'User_saved_nets');
    const userQuickNetSavePath = path.join(userDefaultNetSavePath, 'quicksave.pnet');

    if (!fs.existsSync(userDefaultNetSavePath)) {
        fs.mkdirSync(userDefaultNetSavePath);
    }

    (mainWindow as any).custom = { savePath: userQuickNetSavePath };

    mainWindow.loadURL(`file://${__dirname}/index.html`);


    mainWindow.on('closed', function () {
        // delete reference for not used object
        mainWindow = null;
        // close app when mainWindow closes
        app.quit();
    });

    ipcMain.on('load-dialog', (e:any,arg:any) => {
        const dialogOprions: Electron.OpenDialogOptions = {
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

        const dialoRes = dialog.showOpenDialog(mainWindow, dialogOprions);
        if (dialoRes)
            e.sender.send('load-dialog-response', dialoRes[0]);
    });


    const mainMenuTemplate: Electron.MenuItemConstructorOptions[] =
        [{
            label: "File",
            submenu: [
                {
                    label: "new PNet",
                    accelerator: 'Ctrl+N',
                    click: () => {
                        // todo: confirmace, nabídnutí uložení
                        mainWindow.webContents.send("user-event", { type: messageType.PNetNew, args: {} });
                    }
                },
                {
                    label: "load PNet",
                    accelerator: 'Ctrl+O',
                    click: () => {
                        const dialogOprions: Electron.OpenDialogOptions = {
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

                        const dialoRes = dialog.showOpenDialog(mainWindow, dialogOprions);
                        if (dialoRes)
                            mainWindow.webContents.send("user-event", { type: messageType.PNetLoad, args: { path: dialoRes[0] } });
                    }
                },
                {
                    // todo: save as / save
                    label: "save PNet",
                    accelerator: 'Ctrl+S',
                    click: () => {
                        const dialogOprions: Electron.SaveDialogOptions = {
                            title: 'Save PNet to',
                            // todo: více možností pro user data dle nastavení
                            defaultPath: userDefaultNetSavePath,
                            filters: [
                                { name: 'PNet file', extensions: ['pnet'] },
                                { name: 'JSON file', extensions: ['json'] },
                                { name: 'All Files', extensions: ['*'] }
                            ],
                            // todo: možnost otevřených více sítí v různých 
                            //       záložkách(propojování mezi nimim, ukládání propojených do jednoho souboru nebo do více)
                        };

                        const dialoRes = dialog.showSaveDialog(mainWindow, dialogOprions);
                        if (dialoRes)
                            mainWindow.webContents.send("user-event", { type: messageType.PNetSave, args: { path: dialoRes } });
                    }
                },
                { label: "close" },
                {
                    label: "quick",
                    submenu:
                        [
                            {
                                label: "load",
                                accelerator: 'Ctrl+Shift+O',
                                click: () => {
                                    mainWindow.webContents.send("user-event", { type: messageType.PNetLoad, args: { path: userQuickNetSavePath } });
                                }
                            },
                            {
                                label: "save",
                                accelerator: 'Ctrl+Shift+S',
                                click: () => {
                                    mainWindow.webContents.send("user-event", { type: messageType.PNetSave, args: { path: userQuickNetSavePath } });
                                }
                            }
                        ]
                },
                {
                    label: "Quit",
                    accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                },
            ]
        },
        {
            label: "Net",
            submenu: [
                {
                    label: "Undo",
                    accelerator: 'Ctrl+Z',
                    click: () => {
                        mainWindow.webContents.send("user-event", { type: messageType.Undo, args: {} });
                    }
                },
                {
                    label: "Redo",
                    accelerator: 'Ctrl+Shift+Z',
                    click: () => {
                        mainWindow.webContents.send("user-event", { type: messageType.Redo, args: {} });
                    }
                },
            ]
        }];

    if (process.platform === 'darwin') { mainMenuTemplate.unshift({}); }
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
        })
    }

    //const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

    //Menu.setApplicationMenu(mainMenu);

    Menu.setApplicationMenu(null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
