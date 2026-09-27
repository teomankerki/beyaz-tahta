const { app, BrowserWindow, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

if (process.platform === 'win32') {
  app.setAppUserModelId('com.beyaztahta.app');
}

let mainWindow = null;

function resolveAppIcon() {
  const candidates = [
    path.join(__dirname, '../public/icon.ico'),
    path.join(__dirname, '../assets/icon.ico'),
    path.join(__dirname, '../dist/icon.ico'),
    path.join(__dirname, '../public/icon.png'),
    path.join(__dirname, '../assets/icon.png'),
    path.join(__dirname, '../dist/icon.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) return img;
    }
  }
  return undefined;
}

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
  const { dataDir, dataFile } = getDataPaths();
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    // Check legacy userData folders or local data/backlog.json first so user data is preserved after rename
    const appDataRoot = app.getPath('appData');
    const migrationCandidates = [
      path.join(appDataRoot, 'TLDR Beyaz Tahta', 'data', 'backlog.json'),
      path.join(appDataRoot, 'tldr-whiteboard', 'data', 'backlog.json'),
      path.join(appDataRoot, 'TLDR Whiteboard', 'data', 'backlog.json'),
      path.join(process.cwd(), 'data', 'backlog.json'),
      path.join(process.cwd(), 'data', 'backlog.example.json'),
      path.join(__dirname, '../data/backlog.example.json'),
    ];

    let copied = false;
    for (const candidate of migrationCandidates) {
      if (fs.existsSync(candidate)) {
        try {
          fs.copyFileSync(candidate, dataFile);
          copied = true;
          break;
        } catch {
          // continue to next candidate
        }
      }
    }

    if (!copied) {
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
  const appIcon = resolveAppIcon();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    title: 'Beyaz Tahta',
    icon: appIcon,
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  if (appIcon && process.platform === 'win32') {
    mainWindow.setIcon(appIcon);
  }

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

    ipcMain.on('ensure-window-focus', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (!mainWindow.isFocused()) {
          mainWindow.focus();
        }
        mainWindow.webContents.focus();
      }
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
