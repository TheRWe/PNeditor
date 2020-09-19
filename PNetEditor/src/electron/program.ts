import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import { cwd } from "process";

let mainWindow: BrowserWindow;
const debug: boolean = false;

const createWindow = () => {
  // todo: frameless window
  mainWindow = new BrowserWindow({
    width: 1600, height: 900,
    title: "PetriNet Editor",
    minWidth: 900, minHeight: 500,
    webPreferences: { nodeIntegration: true },
  });

  const userDefaultNetSavePath = path.join(app.getPath("userData"), "User_saved_nets");
  const userQuickNetSavePath = path.join(userDefaultNetSavePath, "quicksave.pnet");

  if (!fs.existsSync(userDefaultNetSavePath))
    fs.mkdirSync(userDefaultNetSavePath);

  (mainWindow as any).custom = { savePath: userQuickNetSavePath };

  mainWindow.loadURL(`file://${__dirname}/../ui/index.html`);

  mainWindow.on("closed", () => {
    // delete reference for unused object
    mainWindow = null;
    // close app when mainWindow closes
    app.quit();
  });

  ipcMain.on("load-dialog", (e: any, arg: any) => {
    const dialogOprions: Electron.OpenDialogOptions = {
      title: "Select PNet to LOAD",
      // todo: více možností pro user data dle nastavení
      defaultPath: userDefaultNetSavePath,
      filters: [
        { name: "PNet/JSON file", extensions: ["pnet", "json"] },
        { name: "PNet file", extensions: ["pnet"] },
        { name: "JSON file", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
      // todo: možnost otevřených více sítí v různých záložkách
      properties: ["openFile" /*, 'multiSelections' */],
    };

    const dialoRes = dialog.showOpenDialog(mainWindow, dialogOprions);
    if (dialoRes)
      e.sender.send("load-dialog-response", (dialoRes as any)[0]);
  });

  ipcMain.on("save-dialog", (e: any, arg: any) => {
    const dialogOprions: Electron.SaveDialogOptions = {
      title: "Save PNet to",
      // todo: více možností pro user data dle nastavení
      defaultPath: userDefaultNetSavePath,
      filters: [
        { name: "PNet file", extensions: ["pnet"] },
        { name: "JSON file", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    };

    const dialoRes = dialog.showSaveDialog(mainWindow, dialogOprions);
    if (dialoRes)
      e.sender.send("save-dialog-response", dialoRes);
  });

  if (debug)
    mainWindow.webContents.openDevTools();

  Menu.setApplicationMenu(null);
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin")
    app.quit();
});

app.on("activate", () => {
  if (mainWindow === null)
    createWindow();
});
