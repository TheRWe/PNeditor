import { app, BrowserWindow, Menu } from 'electron';

let mainWindow: BrowserWindow;
const debug: boolean = true;

function createWindow()
{
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


    let mainMenuTemplate: Electron.MenuItemConstructorOptions[] =
        [{
            label: "File",
            submenu: [
                { label: "open" },
                { label: "save" },
                { label: "close" },
                { label: "recent" },
                {
                    label: "Quit",
                    accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                    click: () =>
                    {
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
