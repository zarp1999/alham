const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || (process.platform === 'win32' ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : path.join(process.env.HOME, 'Library', 'Android', 'sdk'));
const adb = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
if (fs.existsSync(adb)) spawnSync(adb, ['reverse', 'tcp:8081', 'tcp:8081'], { stdio: 'inherit' });
const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
const child = spawn(process.execPath, [cli, 'start', '--android', '--lan', '--port', '8081'], { stdio: 'inherit', env: { ...process.env, ANDROID_HOME: sdk, REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1', PATH: process.env.PATH + path.delimiter + path.join(sdk, 'platform-tools') } });
child.on('exit', code => process.exit(code ?? 0));
