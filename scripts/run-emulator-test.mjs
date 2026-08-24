import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const projectId = 'tasks-untrusted-test';
const command = process.execPath;
const firebaseCli = join(process.cwd(), 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
const testScript = join(process.cwd(), 'tests', 'emulator', 'run-all.mjs');
const configHome = mkdtempSync(join(tmpdir(), 'tasks-firebase-config-'));
const firebaseConfigPath = join(configHome, 'firebase.json');
const debugLogs = ['firestore-debug.log', 'firebase-debug.log']
    .map(filename => join(process.cwd(), filename));
const hadDebugLogs = new Set(debugLogs.filter(existsSync));
const env = {
    ...process.env,
    APPDATA: configHome,
    XDG_CONFIG_HOME: configHome
};

let emulatorProcess;
let emulatorPort;
let emulatorHost;

function findAvailablePort() {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            const port = typeof address === 'object' && address ? address.port : null;
            server.close(error => error ? reject(error) : resolve(port));
        });
    });
}

async function configureEmulator() {
    emulatorPort = await findAvailablePort();
    emulatorHost = `127.0.0.1:${emulatorPort}`;
    writeFileSync(firebaseConfigPath, JSON.stringify({
        emulators: {
            firestore: {
                host: '127.0.0.1',
                port: emulatorPort
            }
        }
    }));
}

function cleanupFiles() {
    rmSync(configHome, { recursive: true, force: true });
    for (const debugLog of debugLogs) {
        if (!hadDebugLogs.has(debugLog)) rmSync(debugLog, { force: true });
    }
}

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitForFirestore() {
    const queryUrl = `http://${emulatorHost}/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    for (let attempt = 0; attempt < 480; attempt += 1) {
        try {
            const response = await fetch(queryUrl, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    structuredQuery: {
                        from: [{ collectionId: 'emulatorReadinessProbe' }],
                        limit: 1
                    }
                })
            });
            if (response.ok) return;
        } catch {
            // The emulator is still starting.
        }
        await wait(250);
    }
    throw new Error('Firestore Emulator did not become ready within 120 seconds.');
}

function runPowerShell(script) {
    return execFileSync('powershell.exe', [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        script
    ], {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 10000
    });
}

function getWindowsEmulatorProcessIds() {
    const processQuery = [
        '$ids = @()',
        `$listener = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort ${emulatorPort} -State Listen -ErrorAction SilentlyContinue`,
        'if ($listener) { $ids += $listener.OwningProcess }',
        "$ids += @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'java.exe' -and $_.CommandLine -like '*google_cloud_firestore.debug_log_level*' } | Select-Object -ExpandProperty ProcessId)",
        '$ids | Where-Object { $_ } | Sort-Object -Unique | ConvertTo-Json -Compress'
    ].join('; ');
    const output = runPowerShell(processQuery).trim();
    if (!output) return [];
    const parsed = JSON.parse(output);
    return (Array.isArray(parsed) ? parsed : [parsed])
        .map(Number)
        .filter(Number.isInteger);
}

function stopWindowsProcesses(processIds) {
    const ids = [...new Set(processIds)].filter(Number.isInteger);
    if (ids.length === 0) return;
    const processCleanup = `$ids=@(${ids.join(',')}); foreach ($id in $ids) { if (Get-Process -Id $id -ErrorAction SilentlyContinue) { Stop-Process -Id $id -Force -ErrorAction Stop } }`;
    runPowerShell(processCleanup);
}

function isProcessAlive(pid) {
    if (!pid) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

async function waitForEmulatorShutdown() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
        const remaining = process.platform === 'win32'
            ? getWindowsEmulatorProcessIds()
            : [];
        if (remaining.length === 0 && !isProcessAlive(emulatorProcess?.pid)) return;
        await wait(250);
    }
    const remaining = process.platform === 'win32'
        ? getWindowsEmulatorProcessIds()
        : [emulatorProcess?.pid].filter(Boolean);
    throw new Error(`Firestore Emulator cleanup left process(es): ${remaining.join(', ')}.`);
}

async function stopEmulator() {
    if (process.platform === 'win32') {
        const processIds = getWindowsEmulatorProcessIds();
        if (emulatorProcess?.pid) processIds.push(emulatorProcess.pid);
        stopWindowsProcesses(processIds);
        await waitForEmulatorShutdown();
        return;
    }
    if (!emulatorProcess) return;
    emulatorProcess.kill('SIGINT');
    await waitForEmulatorShutdown();
}

async function main() {
    await configureEmulator();
    emulatorProcess = spawn(command, [
        firebaseCli,
        'emulators:start',
        '--config',
        firebaseConfigPath,
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
    try {
        await stopEmulator();
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
    cleanupFiles();
    process.exit(process.exitCode ?? 0);
}
