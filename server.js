
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';

const app = express();
app.use(cors());
app.use(express.json());

const db = new Low(new JSONFile('./data/db.json'), { orders: [], menu: {}, config: {} });
await db.read();
db.data ||= { orders: [], menu: {}, config: {} };

// Load shared config
import fs from 'fs';
const sharedConfig = JSON.parse(fs.readFileSync('../sharma-config.json','utf-8'));
db.data.menu = { pricing: sharedConfig.pricing };
db.data.config = { delivery: sharedConfig.delivery, upiId: process.env.UPI_ID || sharedConfig.upiId, businessName: process.env.BUSINESS_NAME || sharedConfig.businessName };

// Helpers
const priceForType = (type) => {
  const p = db.data.menu.pricing;
  switch(type){
    case 'daily': return p.dailyMeal;
    case 'breakfast': return p.breakfast;
    case 'monthlyVeg': return p.monthlyVeg;
    case 'monthlyNonVeg': return p.monthlyNonVeg;
    default: return 0;
  }
};

const deliveryFeeForKm = (km) => {
  const slabs = db.data.config.delivery.slabs;
  for(const s of slabs){
    if(km <= s.maxKm) return s.fee;
  }
  return slabs[slabs.length-1].fee;
};

const upiUrl = ({payeeVpa, payeeName, amount, note}) => {
  // UPI deep link
  const params = new URLSearchParams({
    pa: payeeVpa,
    pn: payeeName || 'Sharma Tiffin',
    am: String(amount),
    cu: 'INR',
    tn: note || 'Tiffin order'
  });
  return `upi://pay?${params.toString()}`;
};

// Routes
app.get('/', (req,res)=> res.json({ ok:true, name: db.data.config.businessName }));

app.get('/menu', async (req,res)=>{
  res.json(db.data.menu);
});

app.get('/delivery/fee', async (req,res)=>{
  const km = Math.max(0, parseFloat(req.query.km||'0'));
  const fee = deliveryFeeForKm(km);
  res.json({ km, fee });
});

app.post('/orders', async (req,res)=>{
  const { mobile, type, qty=1, distanceKm=0, note='' } = req.body;
  const unitPrice = priceForType(type);
  const deliveryFee = deliveryFeeForKm(distanceKm);
  const amount = unitPrice * qty + deliveryFee;
  const order = {
    id: nanoid(8),
    createdAt: new Date().toISOString(),
    mobile, type, qty, distanceKm, note,
    unitPrice, deliveryFee, amount,
    status: 'pending_payment'
  };
  db.data.orders.unshift(order);
  await db.write();

  const payUrl = upiUrl({ payeeVpa: db.data.config.upiId, payeeName: db.data.config.businessName, amount, note: `Order ${order.id}` });
  res.json({ ok:true, order, payment: { upiUrl: payUrl, amount } });
});

// Admin
app.post('/admin/login', (req,res)=>{
  const ok = (req.body.pin || '') === (process.env.ADMIN_PIN || '1234');
  res.json({ ok });
});

app.get('/admin/orders', async (req,res)=>{
  res.json(db.data.orders);
});

app.post('/admin/orders/:id/status', async (req,res)=>{
  const id = req.params.id;
  const { status } = req.body;
  const o = db.data.orders.find(x=>x.id===id);
  if(!o) return res.status(404).json({ ok:false, error:'not_found' });
  o.status = status;
  await db.write();
  res.json({ ok:true });
});

app.listen(process.env.PORT || 4000, ()=>{
  console.log('API listening on', process.env.PORT || 4000);
});
