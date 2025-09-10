
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, Linking, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import axios from 'axios';

const API_BASE = 'http://localhost:4000'; // change if needed

const Section = ({title, children}) => (
  <View style={{marginVertical:12, padding:12, borderWidth:1, borderColor:'#ddd', borderRadius:8}}>
    <Text style={{fontSize:18, fontWeight:'600', marginBottom:8}}>{title}</Text>
    {children}
  </View>
);

const Money = ({v}) => <Text>₹{Number(v).toFixed(0)}</Text>;

export default function App(){
  const [menu, setMenu] = useState(null);
  const [distanceKm, setDistanceKm] = useState('2');
  const [mobile, setMobile] = useState('');
  const [qty, setQty] = useState('1');
  const [note, setNote] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(()=>{
    axios.get(`${API_BASE}/menu`).then(r=>setMenu(r.data)).catch(e=>console.log(e.message));
  },[]);

  const calcFee = async () => {
    const km = parseFloat(distanceKm||'0');
    const r = await axios.get(`${API_BASE}/delivery/fee?km=${km}`);
    return r.data;
  };

  const placeOrder = async (type) => {
    try{
      const km = parseFloat(distanceKm||'0');
      const order = {
        mobile,
        type, // 'daily' | 'breakfast' | 'monthlyVeg' | 'monthlyNonVeg'
        qty: Number(qty||1),
        distanceKm: km,
        note,
      };
      const r = await axios.post(`${API_BASE}/orders`, order);
      const { upiUrl, amount } = r.data.payment;
      Alert.alert('Proceed to Pay', `Amount: ₹${amount}\nClick OK to open your UPI app.`,
        [{text:'OK', onPress:()=>Linking.openURL(upiUrl)}, {text:'Cancel'}]);
    }catch(e){
      Alert.alert('Error', e.message);
    }
  };

  const tryAdmin = async () => {
    try{
      const r = await axios.post(`${API_BASE}/admin/login`, { pin: adminPin });
      if(r.data.ok){ setIsAdmin(true); fetchOrders(); } else Alert.alert('Wrong PIN');
    }catch(e){ Alert.alert('Error', e.message); }
  };

  const fetchOrders = async () => {
    const r = await axios.get(`${API_BASE}/admin/orders`);
    setOrders(r.data);
  };

  const updateStatus = async (id, status) => {
    await axios.post(`${API_BASE}/admin/orders/${id}/status`, { status });
    fetchOrders();
  };

  return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView style={{padding:16}}>
        <Text style={{fontSize:24, fontWeight:'700'}}>Sharma Tiffin Service</Text>
        <Text>Jabalpur • Call: 8305484626</Text>

        <Section title="Menu & Pricing">
          {menu ? (
            <View>
              <Text>Daily Meal: <Money v={menu.pricing.dailyMeal}/> </Text>
              <Text>Breakfast: <Money v={menu.pricing.breakfast}/> </Text>
              <Text>Monthly Veg: <Money v={menu.pricing.monthlyVeg}/> </Text>
              <Text>Monthly Non-Veg: <Money v={menu.pricing.monthlyNonVeg}/> </Text>
            </View>
          ) : <Text>Loading menu...</Text>}
        </Section>

        <Section title="Place Order">
          <Text>Customer Mobile</Text>
          <TextInput value={mobile} onChangeText={setMobile} placeholder="10-digit mobile" keyboardType="phone-pad" style={{borderWidth:1,padding:8,borderRadius:6,marginVertical:6}}/>
          
          <Text>Quantity</Text>
          <TextInput value={qty} onChangeText={setQty} keyboardType="number-pad" style={{borderWidth:1,padding:8,borderRadius:6,marginVertical:6}}/>

          <Text>Approx Distance (km) from kitchen</Text>
          <TextInput value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" style={{borderWidth:1,padding:8,borderRadius:6,marginVertical:6}}/>

          <Text>Note (no onion, less spicy, etc.)</Text>
          <TextInput value={note} onChangeText={setNote} style={{borderWidth:1,padding:8,borderRadius:6,marginVertical:6}}/>

          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <TouchableOpacity onPress={()=>placeOrder('daily')}><Text style={{padding:12, borderWidth:1, borderRadius:6}}>Order Daily Meal</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>placeOrder('breakfast')}><Text style={{padding:12, borderWidth:1, borderRadius:6}}>Order Breakfast</Text></TouchableOpacity>
          </View>
          <View style={{height:8}}/>
          <View style={{flexDirection:'row', justifyContent:'space-between'}}>
            <TouchableOpacity onPress={()=>placeOrder('monthlyVeg')}><Text style={{padding:12, borderWidth:1, borderRadius:6}}>Subscribe Veg</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>placeOrder('monthlyNonVeg')}><Text style={{padding:12, borderWidth:1, borderRadius:6}}>Subscribe Non-Veg</Text></TouchableOpacity>
          </View>
        </Section>

        <Section title="Admin Login">
          {isAdmin ? <Text>Logged in</Text> : (
            <View>
              <Text>Enter Admin PIN</Text>
              <TextInput value={adminPin} onChangeText={setAdminPin} secureTextEntry style={{borderWidth:1,padding:8,borderRadius:6,marginVertical:6}}/>
              <Button title="Login" onPress={tryAdmin} />
            </View>
          )}
        </Section>

        {isAdmin && (
          <Section title="Admin • Orders">
            <Button title="Refresh" onPress={fetchOrders} />
            <FlatList
              style={{marginTop:12}}
              data={orders}
              keyExtractor={item=>String(item.id)}
              renderItem={({item})=>(
                <View style={{borderWidth:1, borderRadius:6, padding:8, marginBottom:8}}>
                  <Text>#{item.id} • {item.type} • Qty {item.qty}</Text>
                  <Text>Mobile: {item.mobile}</Text>
                  <Text>Amount: ₹{item.amount} • Delivery: ₹{item.deliveryFee}</Text>
                  <Text>Status: {item.status}</Text>
                  <View style={{flexDirection:'row', gap:8}}>
                    <Button title="Mark Preparing" onPress={()=>updateStatus(item.id,'preparing')} />
                    <Button title="Mark Out for Delivery" onPress={()=>updateStatus(item.id,'out_for_delivery')} />
                    <Button title="Mark Delivered" onPress={()=>updateStatus(item.id,'delivered')} />
                  </View>
                </View>
              )}
            />
          </Section>
        )}

        <View style={{height:40}}/>
      </ScrollView>
    </SafeAreaView>
  );
}
