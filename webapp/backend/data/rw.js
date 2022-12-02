const fs = require('fs');
const FILENAME = './data/data.json';

const readData = () => {
    try {
        const data = fs.readFileSync(FILENAME);
        return JSON.parse(data.toString());
    } catch (e) {
        console.log('Error reading data.');
        return null;
    };
};

const writeData = (data) => {
    try {
        data = JSON.stringify(data);
        fs.writeFileSync(FILENAME, data);
        return true;
    } catch (e) {
        console.log('Error writing data.');
        return false;
    };
};

module.exports = {
    readData, writeData
};