const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Determine data storage directory and file path
function getDataPaths() {
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  let dataDir;
  
  if (isDev) {
    dataDir = path.join(process.cwd(), 'data');
  } else {
    dataDir = path.join(app.getPath('userData'), 'data');
  }

  const dataFile = path.join(dataDir, 'backlog.json');
  return { dataDir, dataFile, isDev };
}

function ensureBacklogFile() {
  const { dataDir, dataFile, isDev } = getDataPaths();
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    // Try copying from example data
    const localExample = path.join(process.cwd(), 'data', 'backlog.example.json');
    const bundledExample = path.join(__dirname, '../data/backlog.example.json');
    
    if (fs.existsSync(localExample)) {
      fs.copyFileSync(localExample, dataFile);
    } else if (fs.existsSync(bundledExample)) {
      fs.copyFileSync(bundledExample, dataFile);
    } else {
      // Create minimal default
      const defaultData = {
        version: 1,
        lastModified: new Date().toISOString(),
        zones: [],
        projects: []
      };
      fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  }

  return dataFile;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    title: 'TLDR Whiteboard',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  const isDev = !app.isPackaged && process.env.ELECTRON_DEV === 'true';
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const distPath = path.join(__dirname, '../dist/index.html');

  if (isDev) {
    mainWindow.loadURL(devUrl).catch(() => {
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      }
    });
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL(devUrl);
  }

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    ensureBacklogFile();

    // IPC Handlers
    ipcMain.handle('get-backlog', async () => {
      try {
        const filePath = ensureBacklogFile();
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      } catch (err) {
        console.error('Electron IPC get-backlog error:', err);
        return null;
      }
    });

    ipcMain.handle('save-backlog', async (event, data) => {
      try {
        const filePath = ensureBacklogFile();
        data.lastModified = new Date().toISOString();
        // Safe write: write to temp file then rename to ensure atomic write
        const tempPath = `${filePath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tempPath, filePath);
        return true;
      } catch (err) {
        console.error('Electron IPC save-backlog error:', err);
        return false;
      }
    });

    ipcMain.handle('open-data-folder', async () => {
      const { dataDir } = getDataPaths();
      shell.openPath(dataDir);
    });

    ipcMain.handle('window-minimize', () => {
      if (mainWindow) mainWindow.minimize();
    });

    ipcMain.handle('window-maximize', () => {
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
      }
    });

    ipcMain.handle('window-close', () => {
      if (mainWindow) mainWindow.close();
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
