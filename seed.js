
import fs from 'fs';
const db = JSON.parse(fs.readFileSync('./data/db.json','utf-8'));
db.orders = [];
fs.writeFileSync('./data/db.json', JSON.stringify(db, null, 2));
console.log('DB reset.');
