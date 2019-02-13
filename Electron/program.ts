import { app, BrowserWindow, Menu, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

let mainWindow: BrowserWindow;
const debug: boolean = true;

function createWindow()
{
    //todo: může být frameless window
    mainWindow = new BrowserWindow({
        width: 1200, height: 900,
        title: 'PetriNetEdit'
    });

    mainWindow.loadFile('index.html');


    mainWindow.on('closed', function ()
    {
        // delete reference for not used object
        mainWindow = null;
        // close app when mainWindow closes
        app.quit();
    });

    const userDefaultNetSavePath = path.join(app.getPath('userData'), 'User_saved_nets')
    if (!fs.existsSync(userDefaultNetSavePath)) {
        fs.mkdirSync(userDefaultNetSavePath);
    }

    let mainMenuTemplate: Electron.MenuItemConstructorOptions[] =
        [{
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
                    label: "load PNet",
                    click: () =>
                    {
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
                        mainWindow.webContents.send("load PNet", { path: (dialoRes ? dialoRes[0] : undefined) });
                    }
                },
                {
                    // todo: save as / save
                    label: "save PNet",
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
                        mainWindow.webContents.send("save PNet", { path: dialoRes });
                    }
                },
                { label: "close" },
                {
                    label: "quick",
                    submenu:
                        [
                            {
                                label: "load",
                                click: () => {
                                    mainWindow.webContents.send("quick-load PNet");
                                }
                            },
                            {
                                label: "save",
                                click: () => {
                                    mainWindow.webContents.send("quick-save PNet");
                                } }
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
                    click: () =>
                    {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        })
    }

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

    Menu.setApplicationMenu(mainMenu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () =>
{
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () =>
{
    if (mainWindow === null) {
        createWindow();
    }
});
