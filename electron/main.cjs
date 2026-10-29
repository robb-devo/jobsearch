const { app, BrowserWindow, ipcMain, net, shell } = require('electron');
const path = require('node:path');

const JOB_API = 'https://rest.arbeitsagentur.de/';

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 400,
    minHeight: 600,
    title: 'Jobsearch',
    backgroundColor: '#f6f6f8',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true },
  });

  // External links open in the default browser; blank windows (letter printing) stay in the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) {
      void shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (/^https?:/.test(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  void win.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

// The job API is not meant for browser origins, so the app fetches it from the main process.
ipcMain.handle('get-json', async (_event, url, headers) => {
  if (typeof url !== 'string' || !url.startsWith(JOB_API)) throw new Error('URL not allowed');
  const res = await net.fetch(url, { headers });
  const isJson = (res.headers.get('content-type') || '').includes('json');
  return { status: res.status, data: isJson ? await res.json() : null };
});

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
