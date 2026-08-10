import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const projectId = 'tasks-untrusted-test';
const emulatorHost = '127.0.0.1:8080';
const command = process.execPath;
const firebaseCli = join(process.cwd(), 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
const testScript = join(process.cwd(), 'tests', 'emulator', 'firestore-roundtrip.mjs');
const configHome = mkdtempSync(join(tmpdir(), 'tasks-firebase-config-'));
const debugLog = join(process.cwd(), 'firestore-debug.log');
const hadDebugLog = existsSync(debugLog);
const env = {
    ...process.env,
    APPDATA: configHome,
    XDG_CONFIG_HOME: configHome
};

let emulatorProcess;

function cleanupFiles() {
    rmSync(configHome, { recursive: true, force: true });
    if (!hadDebugLog) rmSync(debugLog, { force: true });
}

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitForFirestore() {
    for (let attempt = 0; attempt < 120; attempt += 1) {
        try {
            const response = await fetch(`http://${emulatorHost}`);
            if (response.ok) return;
        } catch {
            // The emulator is still starting.
        }
        await wait(250);
    }
    throw new Error('Firestore Emulator did not become ready within 30 seconds.');
}

function stopEmulator() {
    if (!emulatorProcess) return;
    if (process.platform === 'win32' && emulatorProcess.pid) {
        try {
            const processCleanup = `$ids=@(Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess); $ids += @(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'java.exe' -and $_.CommandLine -like '*google_cloud_firestore.debug_log_level*' } | Select-Object -ExpandProperty ProcessId); $root=Get-CimInstance Win32_Process -Filter 'ProcessId = ${emulatorProcess.pid}'; if ($root -and $root.CommandLine -like '*firebase.js*') { $ids += $root.ProcessId }; $ids | Sort-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }`;
            execFileSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', processCleanup], {
                stdio: 'ignore',
                windowsHide: true,
                timeout: 10000
            });
        } catch {
            // The process may already have exited during graceful shutdown.
        }
    } else {
        emulatorProcess.kill('SIGINT');
    }
}

async function main() {
    emulatorProcess = spawn(command, [
        firebaseCli,
        'emulators:start',
        '--project',
        projectId,
        '--only',
        'firestore'
    ], { env, stdio: 'inherit', shell: false, windowsHide: true });

    await waitForFirestore();

    process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
    await import(pathToFileURL(testScript).href);
}

try {
    await main();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    stopEmulator();
    cleanupFiles();
    process.exit(process.exitCode ?? 0);
}
