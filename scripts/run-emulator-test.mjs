import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const isWindows = process.platform === 'win32';
const command = isWindows ? 'cmd.exe' : 'firebase';
const firebaseArgs = [
    'emulators:exec',
    '--project',
    'tasks-untrusted-test',
    '--only',
    'firestore',
    '--non-interactive',
    'node tests/emulator/firestore-roundtrip.mjs'
];
const args = isWindows ? ['/d', '/s', '/c', 'firebase.cmd', ...firebaseArgs] : firebaseArgs;
const configHome = mkdtempSync(join(tmpdir(), 'tasks-firebase-config-'));
const debugLog = join(process.cwd(), 'firestore-debug.log');
const hadDebugLog = existsSync(debugLog);
const env = { ...process.env, XDG_CONFIG_HOME: configHome };

function cleanup() {
    rmSync(configHome, { recursive: true, force: true });
    if (!hadDebugLog) rmSync(debugLog, { force: true });
}

const child = spawn(command, args, { env, stdio: 'inherit', shell: false });
child.on('error', error => {
    console.error(`Unable to start Firebase Emulator Suite: ${error.message}`);
    cleanup();
    process.exitCode = 1;
});
child.on('exit', (code, signal) => {
    if (signal) {
        console.error(`Firebase Emulator Suite exited with signal ${signal}`);
        process.exitCode = 1;
    } else {
        process.exitCode = code ?? 1;
    }
    cleanup();
});
