const fs = require('fs');
const os = require('os');
const path = require('path');

function createDirectory(directory) {
    const parentDirectory = path.dirname(directory);

    if (!fs.existsSync(parentDirectory)) {
        createDirectory(parentDirectory);
    }

    if (fs.existsSync(parentDirectory) && !fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
}

function deleteAllFilesInDirectory(directory) {
    fs.readdirSync(directory).forEach(file => {
        fs.unlinkSync(path.join(directory, file));
    });
}

function removeDirectory(directory) {
    walkThrough(
        directory,
        () => {},
        (dir) => {
            deleteAllFilesInDirectory(dir);
            fs.rmdirSync(dir);
        }
    )
}

function writeObjectAsJson(path, object, options = {}) {
    fs.writeFileSync(path, JSON.stringify(object, '', 4).replace(/(\r)?\n/g, os.EOL), options);
}

function walkThrough(directory, callback, recursiveCallback) {
    if (!fs.statSync(directory).isDirectory()) {
        return;
    }

    fs.readdirSync(directory).forEach(file => {
        callback(directory, file);

        const nextDir = path.join(directory, file);
        if (fs.existsSync(nextDir)) {
            walkThrough(nextDir, callback, recursiveCallback);

        }
    });
    recursiveCallback && recursiveCallback(directory)
}

module.exports = {
    createDirectory,
    deleteAllFilesInDirectory,
    removeDirectory,
    writeObjectAsJson,
    walkThrough
};
