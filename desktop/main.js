const { app, dialog, BrowserWindow } = require('electron');
require('electron-reloader')(module);

let appWindow;

function initWindow() {
    appWindow = new BrowserWindow({
        // fullscreen: true,
        height: 800,
        width: 1000,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    // Electron Build Path
    // const path = `file://${__dirname}/dist/index.html#/home`;
    // appWindow.loadURL(path);
    appWindow.loadFile('dist/index.html');

    appWindow.setMenuBarVisibility(false);

    // Initialize the DevTools.
    // appWindow.webContents.openDevTools()

    appWindow.on('closed', function () {
        appWindow = null;
    });
}

app.on('ready', function () {
    initWindow();
});

// Close when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS specific close process
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (appWindow === null) {
        initWindow();
    }
});

app.on('window-all-closed', (closeEvent) => {
    closeEvent.preventDefault();
    dialog
        .showMessageBox({
            type: 'info',
            buttons: ['Quitter', 'Annuler'],
            cancelId: 1,
            defaultId: 0,
            title: 'Attention',
            detail: "Vous êtes sur le point de quitter l'application",
        })
        .then(({ response, checkboxChecked }) => {
            console.log(`response: ${response}`);
            if (!response) {
                app.quit();
            }
        });
});
