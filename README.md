
# Sharma Tiffin — Real App Starter (Your Details Pre-filled)

This starter contains:
- **Mobile App (Expo React Native)** with UPI intent payments to `prince190992-1@okicici` and Admin screen.
- **API Server (Node/Express + JSON storage)** with delivery fee slabs and order management.

## How to run (Local)
1) API: `cd api_server_node && npm install && cp .env.example .env && npm start`
2) App: `cd mobile_app_expo && npm install && npm run start`  
   - If testing on a physical phone, change API base in `mobile_app_expo/src/App.js` to your **computer's LAN IP**, e.g. `http://192.168.1.10:4000`.

## Next Up (when you're ready)
- Add real payment gateway (Razorpay/Cashfree) for **in-app** payments and automatic status updates.
- Replace distance field with **Google Maps distance** from your kitchen to customer address.
- Add **auth** (customer login with OTP) and **order history**.
- Deploy API to a cheap VPS and use a domain like `api.sharmatiffin.in`.

Your business info is set in `sharma-config.json`. Change prices or fees anytime.
