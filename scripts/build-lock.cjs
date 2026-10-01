'use strict';

const fs = require('node:fs');

// Keep this outside dist: a full build replaces that directory.
function acquireBuildLock(lockPath) {
    let descriptor;
    try {
        descriptor = fs.openSync(lockPath, 'wx');
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        let owner = '';
        try {
            const metadata = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
            if (Number.isInteger(metadata.pid)) owner = ` (PID ${metadata.pid})`;
        } catch (_) {}
        throw new Error(`Another FilterTube build owns ${lockPath}${owner}. Wait for it to finish. If it was forcibly terminated, confirm no build is running before removing this lock file.`);
    }
    try {
        fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
    } catch (error) {
        fs.closeSync(descriptor);
        fs.unlinkSync(lockPath);
        throw error;
    }
    fs.closeSync(descriptor);
    let released = false;
    return () => {
        if (released) return;
        fs.unlinkSync(lockPath);
        released = true;
    };
}

module.exports = { acquireBuildLock };
