const electron = require('electron');
const { app } = electron;
const { BrowserWindow } = electron;
const { ipcMain } = electron;
const { dialog } = electron;
const path = require('path');
const url = require('url');

const folderProcessor = require('./backend/folder-processor.js');

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({width: 800, height: 600, x: 560, y: -1057});

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
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

function showSelectDialog(event, files, ignored, invalid) {
    event.sender.send('files-exist', files, ignored, invalid);
}

function showProgress(event, values, done) {
    event.sender.send('upload-progress', values, done);
}

function showError(event, message) {
    event.sender.send('error', message);
}

ipcMain.on('show-dialog', event => {
    dialog.showOpenDialog(mainWindow, {properties: ['openDirectory', 'multiSelections']}, folders => {
        folderProcessor.reset();
        folderProcessor.readFolders(folders, (files, ignored, invalid) => {
            if(files.error) {
               return showError(event, files.error);
            }

            const existing = files;
            if(existing.length > 0 || invalid.length > 0) {
                showSelectDialog(event, existing, ignored, invalid);
            } else {
                folderProcessor.upload(null, (progress, allDone) => {
                    showProgress(event, progress, allDone);

                    if(allDone) {
                        folderProcessor.reset();
                    }
                });
            }
        });
    });
});

ipcMain.on('exclude-files', (event, files) => {
    let excludedFolders = null;

    folderProcessor.upload(files, (progress, allDone) => {
        showProgress(event, progress, allDone);

        if(allDone) {
            folderProcessor.reset();
        }
    });
});