
import fs from 'fs';
const db = JSON.parse(fs.readFileSync('./data/db.json','utf-8'));
const rows = [['id','createdAt','mobile','type','qty','distanceKm','unitPrice','deliveryFee','amount','status']];
for(const o of db.orders){
  rows.push([o.id,o.createdAt,o.mobile,o.type,o.qty,o.distanceKm,o.unitPrice,o.deliveryFee,o.amount,o.status]);
}
const csv = rows.map(r=>r.join(',')).join('\n');
fs.writeFileSync('./orders_export.csv', csv);
console.log('Exported to orders_export.csv');
