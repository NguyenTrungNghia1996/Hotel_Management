import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dgram from 'dgram';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NTP_SERVERS = ['vn.pool.ntp.org', 'time.google.com', 'time.cloudflare.com', 'pool.ntp.org'];
const NTP_PORT = 123;
const NTP_TIMEOUT_MS = 2500;
const NTP_UNIX_EPOCH = 2208988800;
const HANOI_OFFSET_MS = 7 * 60 * 60 * 1000;
const EXPIRY_DATE = new Date('2026-01-15T59:59:59.999+07:00');

let ntpStatus = {
  checked: false,
  ok: false,
  reason: 'pending',
  timestamp: null,
  expiryTimestamp: null
};

const formatHanoiIso = (date) => {
  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
};

const getExpiryTimestamp = () =>
  formatHanoiIso(new Date(EXPIRY_DATE.getTime() + HANOI_OFFSET_MS));

const queryNtpTime = (host) => new Promise((resolve, reject) => {
  const socket = dgram.createSocket('udp4');
  const packet = Buffer.alloc(48);
  packet[0] = 0x1b;

  const timeout = setTimeout(() => {
    socket.close();
    reject(new Error('timeout'));
  }, NTP_TIMEOUT_MS);

  socket.on('error', (err) => {
    clearTimeout(timeout);
    socket.close();
    reject(err);
  });

  socket.on('message', (msg) => {
    clearTimeout(timeout);
    socket.close();
    if (msg.length < 48) {
      reject(new Error('invalid'));
      return;
    }
    const seconds = msg.readUInt32BE(40);
    const fraction = msg.readUInt32BE(44);
    const ms = (seconds - NTP_UNIX_EPOCH) * 1000 + Math.round((fraction / 2 ** 32) * 1000);
    resolve(new Date(ms));
  });

  socket.send(packet, 0, packet.length, NTP_PORT, host, (err) => {
    if (err) {
      clearTimeout(timeout);
      socket.close();
      reject(err);
    }
  });
});

const resolveNtpTime = async () => {
  let lastError;
  for (const host of NTP_SERVERS) {
    try {
      return await queryNtpTime(host);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('ntp_failed');
};

const checkNtpStatus = async () => {
  if (ntpStatus.checked) return ntpStatus;
  try {
    const ntpTime = await resolveNtpTime();
    const hanoiTime = new Date(ntpTime.getTime() + HANOI_OFFSET_MS);
    const isExpired = ntpTime > EXPIRY_DATE;
    ntpStatus = {
      checked: true,
      ok: !isExpired,
      reason: isExpired ? 'expired' : 'ok',
      timestamp: formatHanoiIso(hanoiTime),
      expiryTimestamp: getExpiryTimestamp()
    };
  } catch (_err) {
    ntpStatus = {
      checked: true,
      ok: false,
      reason: 'unreachable',
      timestamp: null,
      expiryTimestamp: getExpiryTimestamp()
    };
  }
  return ntpStatus;
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  // Load the index.html of the app.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  await checkNtpStatus();
  createWindow();
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('ntp:get-status', async () => {
  return checkNtpStatus();
});
