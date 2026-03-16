import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Dimensions, Animated, StatusBar,
  SafeAreaView, Image, Platform,
} from 'react-native';
import { LinearGradient } from './LinearGradient';

const API_URL = '/api';
const TOKEN_KEY = 'basaffar_auth_token';
const USER_KEY  = 'basaffar_auth_user';

const webAlert = (title, msg, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmBtn = buttons.find(b => b.style !== 'cancel') || buttons[buttons.length - 1];
      const cancelBtn = buttons.find(b => b.style === 'cancel');
      if (window.confirm(`${title}\n\n${msg || ''}`)) {
        confirmBtn?.onPress?.();
      } else {
        cancelBtn?.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${msg || ''}`);
      buttons?.[0]?.onPress?.();
    }
  }
};

function getStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function storeAuth(token, user) {
  try {
    if (token) { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); }
    else { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
  } catch {}
}
function getStoredUser() {
  try { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null; } catch { return null; }
}

function authHeaders() {
  const token = getStoredToken();
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

async function apiFetch(path) {
  try {
    const res = await fetch(API_URL + path, { headers: authHeaders() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('[API]', path, e.message);
    return null;
  }
}
async function apiPost(path, body) {
  try {
    const res = await fetch(API_URL + path, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.warn('[API POST]', path, e.message);
    return null;
  }
}
async function apiPut(path, body) {
  try {
    const res = await fetch(API_URL + path, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.warn('[API PUT]', path, e.message);
    return null;
  }
}

const { width } = Dimensions.get('window');
const BW = Math.min(width - 32, 500);

const C = {
  blue:'#2463EB', blueL:'#DBEAFE', blueD:'#1A4AC4',
  navy:'#0A1628', navyM:'#0F2347', navyS:'#1A3A6B',
  bg:'#F0F6FF', bgD:'#DBEAFE',
  white:'#FFFFFF', txt:'#0A1628', txtM:'#1E3A6B', txtL:'#6B86AA',
  grn:'#2A8A45', grnL:'#EAF7EE', red:'#D03030', redL:'#FDEAEA',
};

const DEPTS = [
  { id:1, label:'الأسنان',         dept:'أسنان',    color:['#0A1628','#1A3A6B'], image:'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=300&q=80', active:true },
  { id:2, label:'الجلدية والليزر', dept:'جلدية',    color:['#0D2154','#1A4A8A'], image:'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=80', active:true },
  { id:3, label:'العيون',          dept:'عيون',     color:['#0A1840','#102060'], image:'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=300&q=80', active:true },
  { id:4, label:'التجميل',         dept:'تجميل',   color:['#0D1840','#1A2870'], image:'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=300&q=80', active:true },
  { id:5, label:'فروعنا',          dept:'branches', color:['#0A1530','#1A3070'], image:'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=300&q=80', active:true },
];
const OFFERS = [
  { id:1,dept:'أسنان', icon:'🦷',name:'زراعة الأسنان + تركيبة الزيركون', price:2590,orig:3200,color:['#0A1628','#1A3A6B'],desc:'زراعة الأسنان بالتقنية الحديثة مع تركيبة الزيركون. متوافقة بيولوجياً مع الجسم.' },
  { id:2,dept:'جلدية',icon:'✨',name:'جلسة ليزر إزالة الشعر الكامل',    price:890, orig:1200,color:['#0D2154','#1A4A8A'],desc:'إزالة شعر بالليزر الأمريكي لجميع مناطق الجسم. آمن وفعّال للبشرة العربية.' },
  { id:3,dept:'عيون', icon:'👁️',name:'تصحيح النظر بالليزر LASIK',       price:3200,orig:3200,color:['#0A1840','#102060'],desc:'عملية تصحيح النظر بتقنية الليزر الجديدة الآمنة والفعّالة للتخلص من النظارات.' },
  { id:4,dept:'أسنان',icon:'🦷',name:'زراعة الأسنان + تركيبة البورسلين',price:2390,orig:2800,color:['#0A1628','#0F2A5A'],desc:'زراعة مع تركيبة البورسلين ذات المظهر الطبيعي والجودة العالية.' },
  { id:5,dept:'تجميل',icon:'💄',name:'حقن البوتوكس للوجه',              price:1200,orig:1500,color:['#0D1840','#1A2870'],desc:'حقن البوتوكس لإزالة التجاعيد وتحسين مظهر الوجه. مادة معتمدة ومأمونة.' },
  { id:6,dept:'أسنان',icon:'🦷',name:'تبييض الأسنان بالليزر',           price:650, orig:900, color:['#0A1838','#1030A0'],desc:'جلسة تبييض بالليزر لنتائج فورية وملحوظة من أول جلسة.' },
  { id:7,dept:'جلدية',icon:'✨',name:'جلسة تقشير البشرة الكيميائي',     price:480, orig:600, color:['#061830','#0E2860'],desc:'تقشير كيميائي متخصص لتجديد البشرة وعلاج البقع والتجاعيد.' },
  { id:8,dept:'تجميل',icon:'💄',name:'فيلر الشفاه والخدود',             price:980, orig:1200,color:['#0A1530','#1A3070'],desc:'حقن الفيلر لتحسين حجم وشكل الشفاه والخدود بنتائج طبيعية.' },
];
const DOCTORS = [
  { id:1,name:'د. أحمد باصفار',  spec:'أسنان وزراعة',exp:15,rating:4.9,patients:2400,emoji:'👨‍⚕️',color:['#0A1628','#1A3A6B'],bio:'متخصص في زراعة الأسنان وتركيبات الزيركون، حاصل على زمالة من المجلس السعودي للتخصصات الصحية.',branches:['الرياض','جدة'] },
  { id:2,name:'د. سارة النجدي',  spec:'جلدية وليزر', exp:10,rating:4.8,patients:1800,emoji:'👩‍⚕️',color:['#0D2154','#1A4A8A'],bio:'متخصصة في الجلدية وعلاجات الليزر، عضو الجمعية السعودية للجلدية.',branches:['جدة'] },
  { id:3,name:'د. خالد العمري',  spec:'عيون وليزر',  exp:12,rating:4.9,patients:2100,emoji:'👨‍⚕️',color:['#0A1840','#102060'],bio:'استشاري عيون متخصص في تصحيح النظر بالليزر وعمليات الماء الأبيض.',branches:['الرياض','الدمام'] },
  { id:4,name:'د. ريم الزهراني',spec:'تجميل وحقن',  exp:8, rating:4.7,patients:1200,emoji:'👩‍⚕️',color:['#0D1840','#1A2870'],bio:'متخصصة في التجميل الطبي وحقن البوتوكس والفيلر، حاصلة على شهادة البورد الأوروبي.',branches:['جدة'] },
];
const BANNERS = [
  { id:1,title:'DR BASAFFAR',    subtitle:'رعاية طبية متخصصة بأحدث التقنيات', tag:'مركز باصفار 🏥',    color:['#0A1628','#1A3A6B'] },
  { id:2,title:'زراعة الأسنان', subtitle:'أحدث تقنيات الزراعة الفورية',        tag:'قسم الأسنان 🦷',   color:['#0D2154','#1A4A8A'] },
  { id:3,title:'جلسات الليزر',  subtitle:'تقنية الليزر بالأجهزة الأمريكية',    tag:'الجلدية والليزر ✨',color:['#0A1840','#102060'] },
];
const BRANCHES_LIST = [
  { id:1,name:'الرياض — حي النزهة',addr:'طريق الملك عبدالله، حي النزهة',phone:'011-234-5678',hours:'8 ص – 10 م',open:true, depts:['🦷','✨','👁️'] },
  { id:2,name:'جدة — حي الروضة',   addr:'شارع التحلية، حي الروضة',       phone:'012-345-6789',hours:'9 ص – 11 م',open:true, depts:['🦷','💄'] },
  { id:3,name:'الدمام — العزيزية', addr:'طريق الأمير محمد بن فهد',       phone:'013-456-7890',hours:'9 ص – 10 م',open:false,depts:['🦷','✨'] },
];
const BRANCH_NAMES = BRANCHES_LIST.map(b => b.name);
const BK_BRANCHES = BRANCH_NAMES;
const OFFER_LIST   = ['زراعة الأسنان + الزيركون','ليزر إزالة الشعر','تصحيح النظر LASIK','حقن البوتوكس','تبييض الأسنان','فيلر الشفاه'];

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [param,  setParam]  = useState(null);
  const [tab,    setTab]    = useState('home');
  const [cart,   setCart]   = useState([]);
  const [loggedIn,      setLoggedIn]      = useState(false);
  const [userName,      setUserName]      = useState('');
  const [userEmail,     setUserEmail]     = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  const [apiDepts,   setApiDepts]   = useState(DEPTS);
  const [apiOffers,  setApiOffers]  = useState(OFFERS);
  const [apiDoctors, setApiDoctors] = useState(DOCTORS);
  const [apiBanners, setApiBanners] = useState(BANNERS);
  const [apiBranches,setApiBranches]= useState(BRANCHES_LIST);
  const [apiLoaded,  setApiLoaded]  = useState(false);

  useEffect(() => {
    // Restore auth state from localStorage
    const stored = getStoredUser();
    const token  = getStoredToken();
    if (stored && token) {
      setLoggedIn(true);
      setUserName(stored.name || '');
      setUserEmail(stored.email || '');
      setEmailVerified(stored.emailVerified || false);
      // Verify token is still valid with server
      apiFetch('/auth/me').then(res => {
        if (res?.ok) {
          setUserName(res.user.name);
          setUserEmail(res.user.email);
          setEmailVerified(res.user.emailVerified);
          storeAuth(token, res.user);
        } else {
          // Token expired or invalid — log out
          storeAuth(null, null);
          setLoggedIn(false); setUserName(''); setUserEmail(''); setEmailVerified(false);
        }
      });
    }

    const loadData = async () => {
      const [depts, offers, doctors, banners, branches] = await Promise.all([
        apiFetch('/depts'),
        apiFetch('/offers'),
        apiFetch('/doctors'),
        apiFetch('/banners'),
        apiFetch('/branches'),
      ]);
      if (depts)    setApiDepts(depts.filter(d=>d.active));
      if (offers)   setApiOffers(offers.filter(o=>o.active!==false));
      if (doctors)  setApiDoctors(doctors);
      if (banners)  setApiBanners(banners);
      if (branches) setApiBranches(branches.filter(b=>b.active));
      setApiLoaded(true);
    };
    loadData();
  }, []);

  const handleLogin = (user, token) => {
    storeAuth(token, user);
    setLoggedIn(true);
    setUserName(user.name || '');
    setUserEmail(user.email || '');
    setEmailVerified(user.emailVerified || false);
  };
  const handleLogout = () => {
    storeAuth(null, null);
    setLoggedIn(false); setUserName(''); setUserEmail(''); setEmailVerified(false);
  };

  const go = (s, p=null) => { setScreen(s); setParam(p); };
  const goTab = (t) => { setScreen('tabs'); setTab(t); };

  const addToCart = (offer, qty, branch) =>
    setCart(c => [...c, { ...offer, qty, branch, cartId: Date.now() }]);
  const removeFromCart = (id) => setCart(c => c.filter(i => i.cartId !== id));
  const clearCart = () => setCart([]);

  if (screen==='splash') return <Splash onDone={()=>go('tabs')} />;
  if (screen==='offerDetail') return <OfferDetail offer={param} onBack={()=>go('tabs')} onAdd={(o,q,b)=>{addToCart(o,q,b);goTab('cart');}} />;
  if (screen==='doctorDetail') return <DoctorDetail doctor={param} onBack={()=>go('tabs')} onBook={()=>goTab('booking')} />;
  if (screen==='login') return <LoginScreen onBack={()=>go('tabs')} onLogin={(user,token)=>{handleLogin(user,token);go('tabs');}} onRegister={()=>go('register')} onForgot={()=>go('forgotPassword')} />;
  if (screen==='register') return <RegisterScreen onBack={()=>go('login')} onDone={(user,token)=>{handleLogin(user,token);go('tabs');}} />;
  if (screen==='forgotPassword') return <ForgotPasswordScreen onBack={()=>go('login')} />;
  if (screen==='branches') return <BranchesScreen onBack={()=>go('tabs')} branches={apiBranches} />;
  if (screen==='profile') return <ProfileScreen onBack={()=>go('tabs')} userName={userName} userEmail={userEmail} emailVerified={emailVerified} onVerifiedUpdate={()=>setEmailVerified(true)} />;
  if (screen==='myBookings') return <MyBookingsScreen onBack={()=>go('tabs')} loggedIn={loggedIn} onLogin={()=>go('login')} />;
  if (screen==='balance') return <BalanceScreen onBack={()=>go('tabs')} />;
  if (screen==='invoices') return <InvoicesScreen onBack={()=>go('tabs')} loggedIn={loggedIn} onLogin={()=>go('login')} />;
  if (screen==='services') return <ServicesScreen onBack={()=>go('tabs')} depts={apiDepts} />;
  if (screen==='notifications') return <NotificationsScreen onBack={()=>go('tabs')} />;
  if (screen==='guide') return <UsageGuideScreen onBack={()=>go('tabs')} />;
  if (screen==='about') return <AboutScreen onBack={()=>go('tabs')} />;
  if (screen==='contact') return <ContactScreen onBack={()=>go('tabs')} />;
  if (screen==='privacy') return <PrivacyScreen onBack={()=>go('tabs')} />;

  return (
    <View style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>
      {tab==='home'    && <HomeScreen    onOffer={o=>go('offerDetail',o)} onDoctor={d=>go('doctorDetail',d)} onBranches={()=>go('branches')} loggedIn={loggedIn} userName={userName} onLogin={()=>go('login')} depts={apiDepts} offers={apiOffers} doctors={apiDoctors} banners={apiBanners} />}
      {tab==='offers'  && <OffersScreen  onOffer={o=>go('offerDetail',o)} offers={apiOffers} />}
      {tab==='cart'    && <CartScreen    cart={cart} remove={removeFromCart} loggedIn={loggedIn} onLogin={()=>go('login')} clear={clearCart} />}
      {tab==='booking' && <BookingScreen loggedIn={loggedIn} onLogin={()=>go('login')} branches={apiBranches} />}
      {tab==='more'    && <MoreScreen    loggedIn={loggedIn} userName={userName} userEmail={userEmail} emailVerified={emailVerified} onLogin={()=>go('login')} onBranches={()=>go('branches')} onProfile={()=>go('profile')} onLogout={handleLogout} onBookings={()=>go('myBookings')} onBalance={()=>go('balance')} onInvoices={()=>go('invoices')} onServices={()=>go('services')} onNotifications={()=>go('notifications')} onGuide={()=>go('guide')} onAbout={()=>go('about')} onContact={()=>go('contact')} onPrivacy={()=>go('privacy')} />}
      <BottomNav tab={tab} setTab={setTab} badge={cart.length} />
    </View>
  );
}

function BottomNav({tab,setTab,badge}){
  const items=[{k:'home',i:'🏠',l:'الرئيسية'},{k:'offers',i:'🎁',l:'العروض'},{k:'cart',i:'🛒',l:'مشترياتي',b:badge},{k:'booking',i:'📅',l:'حجز موعد'},{k:'more',i:'☰',l:'المزيد'}];
  return (
    <View style={N.bar}>
      {items.map(it=>(
        <TouchableOpacity key={it.k} style={N.btn} onPress={()=>setTab(it.k)}>
          <View>
            <Text style={{fontSize:22,opacity:tab===it.k?1:.45}}>{it.i}</Text>
            {it.b>0&&<View style={N.badge}><Text style={N.badgeTxt}>{it.b}</Text></View>}
          </View>
          <Text style={[N.lbl,tab===it.k&&{color:C.blue}]}>{it.l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const N=StyleSheet.create({
  bar:{flexDirection:'row',backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.bgD,height:62,paddingBottom:6},
  btn:{flex:1,alignItems:'center',justifyContent:'center',gap:3},
  lbl:{fontSize:9,fontWeight:'600',color:C.txtL},
  badge:{position:'absolute',top:-4,right:-9,backgroundColor:C.red,borderRadius:8,minWidth:17,height:17,alignItems:'center',justifyContent:'center',paddingHorizontal:3},
  badgeTxt:{fontSize:9,fontWeight:'700',color:'white'},
});

function Splash({onDone}){
  const sc=useRef(new Animated.Value(0.5)).current;
  const fa=useRef(new Animated.Value(0)).current;
  const fb=useRef(new Animated.Value(0)).current;
  const pu=useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    Animated.sequence([
      Animated.parallel([
        Animated.spring(sc,{toValue:1,tension:55,friction:8,useNativeDriver:false}),
        Animated.timing(fa,{toValue:1,duration:800,useNativeDriver:false}),
      ]),
      Animated.timing(fb,{toValue:1,duration:500,delay:100,useNativeDriver:false}),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pu,{toValue:1.08,duration:1000,useNativeDriver:false}),
      Animated.timing(pu,{toValue:1,duration:1000,useNativeDriver:false}),
    ])).start();
  },[]);
  return (
    <LinearGradient colors={['#0A1628','#06101E','#0F2347']} style={{flex:1,alignItems:'center',justifyContent:'center'}}>
      <Animated.View style={{opacity:fa,transform:[{scale:sc}],alignItems:'center'}}>
        <Animated.View style={{transform:[{scale:pu}],marginBottom:24}}>
          <LinearGradient colors={['#0A1628','#0F2347']} style={{width:120,height:120,borderRadius:30,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'rgba(36,99,235,0.4)',gap:4}}>
            <View style={{width:70,height:3,backgroundColor:C.blue,borderRadius:2}}/>
            <Text style={{fontSize:11,fontWeight:'900',color:'white',letterSpacing:1.5}}>DR BASAFFAR</Text>
            <Text style={{fontSize:9,color:'rgba(255,255,255,0.5)',letterSpacing:1}}>حسالم باصفار</Text>
          </LinearGradient>
        </Animated.View>
        <Text style={{fontSize:36,fontWeight:'900',color:C.blue,letterSpacing:-1,marginBottom:4}}>باصفار</Text>
        <Text style={{fontSize:10,color:'rgba(36,99,235,0.5)',letterSpacing:3,marginBottom:10}}>DR BASAFFAR CLINIC</Text>
        <Text style={{fontSize:11,color:'rgba(255,255,255,0.4)',textAlign:'center',paddingHorizontal:50,marginBottom:60}}>مركز د. حسالم باصفار الطبي المتخصص</Text>
      </Animated.View>
      <Animated.View style={{opacity:fb,alignItems:'center',position:'absolute',bottom:90}}>
        <Text style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:14}}>اختر لغتك / Choose language</Text>
        <View style={{flexDirection:'row',gap:12}}>
          <TouchableOpacity style={{paddingHorizontal:28,paddingVertical:10,borderRadius:30,backgroundColor:C.blue,borderWidth:1,borderColor:C.blue}} onPress={onDone}>
            <Text style={{color:'white',fontSize:13,fontWeight:'800'}}>العربية</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{paddingHorizontal:28,paddingVertical:10,borderRadius:30,borderWidth:1,borderColor:'rgba(36,99,235,0.35)'}} onPress={onDone}>
            <Text style={{color:'rgba(255,255,255,0.6)',fontSize:13,fontWeight:'600'}}>English</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

function HomeScreen({onOffer,onDoctor,onBranches,loggedIn,userName,onLogin,depts:propDepts,offers:propOffers,doctors:propDoctors,banners:propBanners}){
  const localDepts   = propDepts   || DEPTS;
  const localOffers  = propOffers  || OFFERS;
  const localDoctors = propDoctors || DOCTORS;
  const localBanners = propBanners || BANNERS;
  const [bi,setBi]=useState(0);
  const ref=useRef(null);
  useEffect(()=>{
    const t=setInterval(()=>{
      setBi(p=>{const n=(p+1)%localBanners.length; ref.current?.scrollTo({x:n*BW,animated:true}); return n;});
    },3200);
    return ()=>clearInterval(t);
  },[localBanners.length]);
  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:10,backgroundColor:C.bg,borderBottomWidth:1,borderBottomColor:C.bgD}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <LinearGradient colors={['#0A1628','#0F2347']} style={{width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(36,99,235,0.35)'}}>
            <View style={{width:22,height:2.5,backgroundColor:C.blue,borderRadius:1,marginBottom:3}}/>
            <Text style={{fontSize:6.5,fontWeight:'900',color:'white',letterSpacing:0.8}}>BASAFFAR</Text>
          </LinearGradient>
          <View>
            <Text style={{fontSize:13,fontWeight:'700',color:C.navyM}}>باصفار</Text>
            <Text style={{fontSize:7,color:C.txtL,letterSpacing:0.5}}>DR BASAFFAR CLINIC</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogin} style={{flexDirection:'row',alignItems:'center',gap:7,backgroundColor:C.bgD,paddingHorizontal:10,paddingVertical:5,borderRadius:20}}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{width:26,height:26,borderRadius:13,alignItems:'center',justifyContent:'center'}}>
            <Text style={{color:'white',fontWeight:'700',fontSize:11}}>{loggedIn?(userName[0]||'ب'):'ب'}</Text>
          </LinearGradient>
          <Text style={{fontSize:11,fontWeight:'600',color:C.navyM}}>{loggedIn?`أهلاً، ${userName}`:'تسجيل الدخول'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{padding:12}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:24,paddingHorizontal:14,paddingVertical:10}}>
            <Text style={{fontSize:14,opacity:.4}}>🔍</Text>
            <TextInput placeholder="ابحث عن عروض، أطباء، خدمات..." placeholderTextColor={C.txtL} style={{flex:1,fontSize:12,color:C.txt}} textAlign="right"/>
          </View>
        </View>

        <View style={{marginHorizontal:16,marginBottom:14,borderRadius:20,overflow:'hidden'}}>
          <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e=>setBi(Math.round(e.nativeEvent.contentOffset.x/BW))}>
            {localBanners.map(b=>(
              <LinearGradient key={b.id} colors={b.color} style={{width:BW,height:158,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                <View style={{position:'absolute',width:130,height:130,borderRadius:65,borderWidth:1,borderColor:'rgba(36,99,235,0.12)',top:-35,left:-35}}/>
                <View style={{backgroundColor:'rgba(36,99,235,0.2)',borderWidth:1,borderColor:'rgba(36,99,235,0.4)',borderRadius:10,paddingHorizontal:10,paddingVertical:3,marginBottom:8}}>
                  <Text style={{fontSize:9,color:C.blue}}>{b.tag}</Text>
                </View>
                <Text style={{fontSize:22,fontWeight:'900',color:'white',marginBottom:4}}>{b.title}</Text>
                <Text style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{b.subtitle}</Text>
              </LinearGradient>
            ))}
          </ScrollView>
          <LinearGradient colors={[C.navy,C.navyM]} style={{flexDirection:'row',justifyContent:'center',gap:5,paddingVertical:8}}>
            {localBanners.map((_,i)=>(
              <TouchableOpacity key={i} onPress={()=>{ref.current?.scrollTo({x:i*BW,animated:true});setBi(i);}}
                style={{width:bi===i?14:6,height:6,borderRadius:3,backgroundColor:bi===i?C.blue:'rgba(255,255,255,0.3)'}}/>
            ))}
          </LinearGradient>
        </View>

        <SH title="أقسام العيادة"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:14,gap:12}}>
          {localDepts.filter(d=>d.active!==false).map(d=>(
            <TouchableOpacity key={d.id} style={{width:140,borderRadius:18,overflow:'hidden'}}
              onPress={()=>d.dept==='branches'?onBranches():null} activeOpacity={0.88}>
              <LinearGradient colors={d.color} style={{width:140,height:165,position:'relative',justifyContent:'flex-end'}}>
                <Image source={{uri:d.image}} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="cover"/>
                <LinearGradient colors={['transparent','rgba(10,22,40,0.88)']} style={{position:'absolute',bottom:0,left:0,right:0,height:75}}/>
                <Text style={{fontSize:13,fontWeight:'800',color:'white',textAlign:'center',paddingBottom:12,paddingHorizontal:8,zIndex:2}}>{d.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <SH title="أفضل العروض" more="تصفح الكل"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:14,gap:12}}>
          {localOffers.slice(0,5).map(o=>(
            <TouchableOpacity key={o.id} style={{width:158,borderRadius:16,overflow:'hidden',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD}} onPress={()=>onOffer(o)} activeOpacity={0.87}>
              <LinearGradient colors={o.color} style={{height:98,alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:32}}>{o.icon}</Text>
                <View style={{position:'absolute',top:8,right:8,backgroundColor:'rgba(36,99,235,0.85)',borderRadius:8,paddingHorizontal:7,paddingVertical:2}}>
                  <Text style={{fontSize:9,fontWeight:'700',color:'white'}}>{o.dept}</Text>
                </View>
              </LinearGradient>
              <View style={{padding:10}}>
                <Text style={{fontSize:11,fontWeight:'600',color:C.navy,lineHeight:16,marginBottom:6}} numberOfLines={2}>{o.name}</Text>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                  <Text style={{fontSize:13,fontWeight:'700',color:C.blueD}}>{o.price.toLocaleString()} ﷼</Text>
                  <View style={{width:28,height:28,borderRadius:14,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'}}>
                    <Text style={{fontSize:13}}>🛒</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <SH title="نخبة أطبائنا" more="عرض الكل"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:16,gap:12}}>
          {localDoctors.map(d=>(
            <TouchableOpacity key={d.id} style={{width:128,borderRadius:16,overflow:'hidden',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD}} onPress={()=>onDoctor(d)} activeOpacity={0.87}>
              <LinearGradient colors={d.color} style={{height:88,alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:38}}>{d.emoji}</Text>
              </LinearGradient>
              <View style={{padding:8}}>
                <Text style={{fontSize:11,fontWeight:'700',color:C.navy}}>{d.name}</Text>
                <Text style={{fontSize:9,color:C.txtL,marginBottom:2}}>{d.spec}</Text>
                <Text style={{fontSize:9,color:C.blueD,fontWeight:'600'}}>⭐ {d.exp} سنة</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{height:24}}/>
      </ScrollView>
    </SafeAreaView>
  );
}
function SH({title,more}){
  return(
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingBottom:10,paddingTop:4}}>
      <Text style={{fontSize:14,fontWeight:'700',color:C.navy}}>{title}</Text>
      {more&&<Text style={{fontSize:11,fontWeight:'600',color:C.blue}}>{more}</Text>}
    </View>
  );
}

function OffersScreen({onOffer,offers:propOffers}){
  const allOffers = propOffers || OFFERS;
  const FILTERS=['الكل','أسنان','جلدية','عيون','تجميل'];
  const [f,setF]=useState('الكل');
  const list=f==='الكل'?allOffers:allOffers.filter(o=>o.dept===f);
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <PH title="كل العروض"/>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingVertical:11,gap:8}}>
        {FILTERS.map(x=>(
          <TouchableOpacity key={x} onPress={()=>setF(x)} style={{paddingHorizontal:16,paddingVertical:7,borderRadius:20,borderWidth:1,borderColor:f===x?C.navy:C.bgD,backgroundColor:f===x?C.navyM:C.white}}>
            <Text style={{fontSize:11,fontWeight:'600',color:f===x?'white':C.txtM}}>{x}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{paddingHorizontal:16}} showsVerticalScrollIndicator={false}>
        {list.map(o=>(
          <TouchableOpacity key={o.id} style={{marginBottom:14,borderRadius:20,overflow:'hidden',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD}} onPress={()=>onOffer(o)} activeOpacity={0.88}>
            <LinearGradient colors={o.color} style={{height:158,alignItems:'center',justifyContent:'center',padding:20}}>
              <View style={{position:'absolute',width:120,height:120,borderRadius:60,borderWidth:1,borderColor:'rgba(36,99,235,0.1)',top:-30,left:-30}}/>
              <Text style={{fontSize:20,fontWeight:'900',color:C.blue,marginBottom:5,textAlign:'center'}}>
                {o.dept==='أسنان'?'عروض الأسنان':o.dept==='جلدية'?'عروض الجلدية':o.dept==='عيون'?'عروض العيون':'عروض التجميل'}
              </Text>
              <Text style={{fontSize:14,fontWeight:'600',color:'white',textAlign:'center',lineHeight:22}}>{o.name}</Text>
            </LinearGradient>
            <View style={{padding:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <View>
                <Text style={{fontSize:10,color:C.txtL,marginBottom:2}} numberOfLines={1}>{o.name}</Text>
                <View style={{flexDirection:'row',alignItems:'baseline',gap:6}}>
                  <Text style={{fontSize:20,fontWeight:'700',color:C.blueD}}>{o.price.toLocaleString()} ريال</Text>
                  {o.orig>o.price&&<Text style={{fontSize:11,color:C.txtL,textDecorationLine:'line-through'}}>{o.orig.toLocaleString()}</Text>}
                </View>
              </View>
              <TouchableOpacity style={{backgroundColor:C.blue,borderRadius:12,paddingHorizontal:18,paddingVertical:10}} onPress={()=>onOffer(o)}>
                <Text style={{fontSize:12,fontWeight:'700',color:'white'}}>اشتري الآن</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function OfferDetail({offer:o,onBack,onAdd}){
  const [qty,setQty]=useState(1);
  const [br,setBr]=useState(0);
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="تفاصيل العرض" onBack={onBack}/>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={o.color} style={{height:225,alignItems:'center',justifyContent:'center',padding:20,overflow:'hidden'}}>
          <View style={{position:'absolute',width:150,height:150,borderRadius:75,borderWidth:1,borderColor:'rgba(36,99,235,0.12)',top:-40,left:-40}}/>
          <Text style={{fontSize:20,fontWeight:'900',color:C.blue,marginBottom:6}}>
            {o.dept==='أسنان'?'عروض الأسنان':o.dept==='جلدية'?'عروض الجلدية':o.dept==='عيون'?'عروض العيون':'عروض التجميل'}
          </Text>
          <Text style={{fontSize:15,fontWeight:'600',color:'white',textAlign:'center',lineHeight:24}}>{o.name}</Text>
          <Text style={{fontSize:42,marginTop:10}}>{o.icon}</Text>
        </LinearGradient>
        <View style={{padding:18}}>
          <View style={{flexDirection:'row',alignItems:'baseline',gap:8,marginBottom:16}}>
            <Text style={{fontSize:30,fontWeight:'900',color:C.blueD}}>{o.price.toLocaleString()}</Text>
            <Text style={{fontSize:14,color:C.txtL}}>ريال سعودي</Text>
            {o.orig>o.price&&<Text style={{fontSize:12,color:C.txtL,textDecorationLine:'line-through'}}>{o.orig.toLocaleString()}</Text>}
          </View>
          <View style={{backgroundColor:C.bgD,borderRadius:12,padding:14,marginBottom:18}}>
            <Text style={{fontSize:12,color:C.txtM,lineHeight:22,textAlign:'right'}}>{o.desc}</Text>
          </View>
          <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:8}}>اختر الفرع</Text>
          {BK_BRANCHES.map((b,i)=>(
            <TouchableOpacity key={i} onPress={()=>setBr(i)}
              style={{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:10,borderWidth:1,borderColor:br===i?C.blue:C.bgD,backgroundColor:br===i?'rgba(36,99,235,0.05)':C.white,marginBottom:8}}>
              <Text style={{fontSize:13}}>📍</Text>
              <Text style={{flex:1,fontSize:12,color:br===i?C.blueD:C.txtM,fontWeight:br===i?'600':'400',textAlign:'right'}}>{b}</Text>
              {br===i&&<Text style={{color:C.blue}}>✓</Text>}
            </TouchableOpacity>
          ))}
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:16,marginBottom:16}}>
            <Text style={{fontSize:11,fontWeight:'700',color:C.txtM}}>الكمية</Text>
            <View style={{flexDirection:'row',alignItems:'center',gap:16}}>
              <TouchableOpacity onPress={()=>setQty(q=>Math.max(1,q-1))} style={{width:36,height:36,borderRadius:18,borderWidth:1,borderColor:C.bgD,backgroundColor:C.white,alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:20,color:C.navy,lineHeight:22}}>−</Text>
              </TouchableOpacity>
              <Text style={{fontSize:18,fontWeight:'700',color:C.navy,minWidth:24,textAlign:'center'}}>{qty}</Text>
              <TouchableOpacity onPress={()=>setQty(q=>q+1)} style={{width:36,height:36,borderRadius:18,borderWidth:1,borderColor:C.bgD,backgroundColor:C.white,alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:20,color:C.navy,lineHeight:22}}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:C.bgD,borderRadius:12,padding:14,marginBottom:20}}>
            <Text style={{fontSize:12,color:C.txtM,fontWeight:'600'}}>الإجمالي</Text>
            <Text style={{fontSize:22,fontWeight:'900',color:C.blueD}}>{(o.price*qty).toLocaleString()} ﷼</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={()=>onAdd(o,qty,BRANCH_NAMES[br])}>
            <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:14,padding:16,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10}}>
              <Text style={{fontSize:18}}>🛒</Text>
              <Text style={{fontSize:15,fontWeight:'700',color:'white'}}>إضافة إلى السلة</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={{height:28}}/>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CartScreen({cart,remove,loggedIn,onLogin,clear}){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const checkout=()=>{
    webAlert('تأكيد الشراء',`الإجمالي: ${total.toLocaleString()} ريال\nهل تريد إتمام الشراء؟`,[
      {text:'إلغاء',style:'cancel'},
      {text:'تأكيد',onPress:()=>{clear();webAlert('تم الشراء ✓','تم تأكيد طلبك! سيتم التواصل معك قريباً.',[{text:'حسناً'}]);}},
    ]);
  };
  if(!loggedIn) return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <PH title="مشترياتي 🛒"/>
      <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:30}}>
        <Text style={{fontSize:54,marginBottom:16}}>🔒</Text>
        <Text style={{fontSize:16,fontWeight:'700',color:C.navy,marginBottom:8}}>يرجى تسجيل الدخول</Text>
        <Text style={{fontSize:12,color:C.txtL,marginBottom:24,textAlign:'center'}}>سجّل دخولك لعرض مشترياتك وإتمام الشراء</Text>
        <TouchableOpacity onPress={onLogin} activeOpacity={0.85}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:14,paddingHorizontal:32,paddingVertical:12}}>
            <Text style={{fontSize:14,fontWeight:'700',color:'white'}}>تسجيل الدخول</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  if(cart.length===0) return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <PH title="مشترياتي 🛒"/>
      <View style={{flex:1,alignItems:'center',justifyContent:'center',gap:12}}>
        <Text style={{fontSize:58}}>🛒</Text>
        <Text style={{fontSize:16,fontWeight:'700',color:C.navy}}>السلة فارغة</Text>
        <Text style={{fontSize:12,color:C.txtL}}>أضف عروضاً لتظهر هنا</Text>
      </View>
    </SafeAreaView>
  );
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <PH title="مشترياتي 🛒"/>
      <ScrollView contentContainerStyle={{padding:16}}>
        {cart.map(item=>(
          <View key={item.cartId} style={{backgroundColor:C.white,borderRadius:14,marginBottom:12,borderWidth:1,borderColor:C.bgD,overflow:'hidden'}}>
            <View style={{flexDirection:'row',alignItems:'center',padding:12,gap:10}}>
              <Text style={{fontSize:28,width:44,textAlign:'center'}}>{item.icon}</Text>
              <View style={{flex:1}}>
                <Text style={{fontSize:12,fontWeight:'600',color:C.navy,marginBottom:2}} numberOfLines={1}>{item.name}</Text>
                <Text style={{fontSize:10,color:C.txtL}}>{item.dept} · {item.qty} قطعة · {item.branch}</Text>
              </View>
              <Text style={{fontSize:15,fontWeight:'700',color:C.blueD}}>{(item.price*item.qty).toLocaleString()} ﷼</Text>
            </View>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:10,paddingHorizontal:14,backgroundColor:C.bgD}}>
              <View style={{backgroundColor:'rgba(36,99,235,0.12)',borderRadius:8,paddingHorizontal:10,paddingVertical:3}}>
                <Text style={{fontSize:10,fontWeight:'700',color:C.blueD}}>قيد الانتظار</Text>
              </View>
              <TouchableOpacity onPress={()=>remove(item.cartId)}>
                <Text style={{fontSize:11,color:C.red}}>حذف ×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:14,padding:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4}}>
          <View>
            <Text style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:2}}>الإجمالي</Text>
            <Text style={{fontSize:24,fontWeight:'900',color:C.blue}}>{total.toLocaleString()} ريال</Text>
          </View>
          <TouchableOpacity style={{backgroundColor:C.blue,borderRadius:11,paddingHorizontal:20,paddingVertical:10}} onPress={checkout}>
            <Text style={{fontSize:13,fontWeight:'700',color:'white'}}>إتمام الشراء</Text>
          </TouchableOpacity>
        </LinearGradient>
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function BookingScreen({loggedIn,onLogin,branches:propBranches}){
  const BK_BR = (propBranches||BRANCHES_LIST).map(b=>b.name);
  const [nm,setNm]=useState('');
  const [ph,setPh]=useState('');
  const [id,setId]=useState('');
  const [nt,setNt]=useState('');
  const [br,setBr]=useState(-1);
  const [of,setOf]=useState(-1);
  const confirm=async()=>{
    if(!nm.trim()){webAlert('تنبيه','يرجى إدخال الاسم');return;}
    if(!ph.trim()){webAlert('تنبيه','يرجى إدخال رقم الهاتف');return;}
    if(br<0){webAlert('تنبيه','يرجى اختيار الفرع');return;}
    const brName = BK_BR[br] || BRANCH_NAMES[br] || '—';
    const bookingData = { name:nm, phone:ph, idNum:id, note:nt, branch:brName, offer:OFFER_LIST[of]||'—' };
    const result = await apiPost('/bookings', bookingData);
    const code = result?.booking?.code || ('BK-'+Math.floor(Math.random()*9000+1000));
    webAlert('تم الحجز بنجاح! 🎉',`رقم حجزك: ${code}\nالفرع: ${brName}\nسيتم التواصل معك للتأكيد.`,[
      {text:'حسناً',onPress:()=>{setNm('');setPh('');setId('');setNt('');setBr(-1);setOf(-1);}},
    ]);
  };
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <PH title="حجز موعد 📅"/>
      <ScrollView contentContainerStyle={{padding:16}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <FL>الاسم بالكامل *</FL>
        <TextInput style={B.inp} placeholder="أدخل اسمك الكامل" value={nm} onChangeText={setNm} textAlign="right" placeholderTextColor={C.txtL}/>
        <FL>رقم الهاتف *</FL>
        <TextInput style={B.inp} placeholder="05xxxxxxxx" keyboardType="phone-pad" value={ph} onChangeText={setPh} textAlign="right" placeholderTextColor={C.txtL}/>
        <FL>رقم الهوية (اختياري)</FL>
        <TextInput style={B.inp} placeholder="١٠ أرقام" keyboardType="number-pad" value={id} onChangeText={setId} textAlign="right" placeholderTextColor={C.txtL}/>
        <FL>اختر الفرع *</FL>
        {BRANCH_NAMES.map((b,i)=>(
          <TouchableOpacity key={i} onPress={()=>setBr(i)} style={[B.opt,br===i&&B.optA]}>
            <Text>📍</Text><Text style={[B.optT,br===i&&{color:C.blueD,fontWeight:'600'}]}>{b}</Text>
            {br===i&&<Text style={{color:C.blue}}>✓</Text>}
          </TouchableOpacity>
        ))}
        <FL>اختر العرض</FL>
        {OFFER_LIST.map((o,i)=>(
          <TouchableOpacity key={i} onPress={()=>setOf(i)} style={[B.opt,of===i&&B.optA]}>
            <Text>🎁</Text><Text style={[B.optT,of===i&&{color:C.blueD,fontWeight:'600'}]}>{o}</Text>
            {of===i&&<Text style={{color:C.blue}}>✓</Text>}
          </TouchableOpacity>
        ))}
        <FL>ملاحظات (اختياري)</FL>
        <TextInput style={[B.inp,{height:76,textAlignVertical:'top'}]} placeholder="أي ملاحظات..." multiline value={nt} onChangeText={setNt} textAlign="right" placeholderTextColor={C.txtL}/>
        <TouchableOpacity onPress={confirm} activeOpacity={0.85} style={{marginTop:20}}>
          <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:14,padding:15,alignItems:'center'}}>
            <Text style={{fontSize:15,fontWeight:'700',color:C.blue}}>تأكيد حجز الموعد ✓</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{height:30}}/>
      </ScrollView>
    </SafeAreaView>
  );
}
function FL({children}){return <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:6,marginTop:12}}>{children}</Text>;}
const B=StyleSheet.create({
  inp:{backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:10,padding:11,fontSize:13,color:C.txt,marginBottom:2},
  opt:{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:10,borderWidth:1,borderColor:C.bgD,backgroundColor:C.white,marginBottom:7},
  optA:{borderColor:C.blue,backgroundColor:'rgba(36,99,235,0.05)'},
  optT:{flex:1,fontSize:12,color:C.txtM,textAlign:'right'},
});

function MoreScreen({loggedIn,userName,userEmail,emailVerified,onLogin,onBranches,onProfile,onLogout,onBookings,onBalance,onInvoices,onServices,onNotifications,onGuide,onAbout,onContact,onPrivacy}){
  const [lang,setLang]=useState('ar');
  const [resendSent,setResendSent]=useState(false);
  const [resending,setResending]=useState(false);
  const resendVerification=async()=>{
    if(!userEmail||resending) return;
    setResending(true);
    await apiPost('/auth/resend-verification',{email:userEmail});
    setResending(false);
    setResendSent(true);
  };
  const rows=[
    {i:'👤',l:'البيانات الشخصية',s:'تعديل معلوماتك',p:onProfile},
    {i:'📋',l:'حجوزاتي',s:'عرض المواعيد',p:onBookings},
    {i:'💰',l:'رصيدي',s:'0 ريال',p:onBalance},
    {i:'🧾',l:'فواتيري',p:onInvoices},
    {i:'📍',l:'فروعنا',s:'3 فروع',p:onBranches},
    {i:'⚕️',l:'خدماتنا',p:onServices},
    {i:'🔔',l:'الإشعارات',p:onNotifications},
    {i:'📖',l:'إرشادات الاستخدام',p:onGuide},
    {i:'ℹ️',l:'معلومات عنّا',p:onAbout},
    {i:'💬',l:'تواصل معنا',p:onContact},
    {i:'🔒',l:'سياسة الخصوصية',p:onPrivacy},
  ];
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <LinearGradient colors={[C.navy,C.navyM]} style={{padding:20,flexDirection:'row',alignItems:'center',gap:14}}>
        <LinearGradient colors={[C.blue,C.blueD]} style={{width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'rgba(36,99,235,0.4)'}}>
          <Text style={{color:'white',fontSize:22,fontWeight:'700'}}>{loggedIn?(userName[0]||'ب'):'ب'}</Text>
        </LinearGradient>
        <View style={{flex:1}}>
          <Text style={{fontSize:15,fontWeight:'700',color:'white',marginBottom:2}}>{loggedIn?userName:'مرحباً بك'}</Text>
          <View style={{flexDirection:'row',alignItems:'center',gap:5}}>
            <Text style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>{loggedIn?'عميل مسجل':'غير مسجل'}</Text>
            {loggedIn&&(emailVerified
              ? <View style={{backgroundColor:'rgba(42,138,69,0.25)',borderRadius:6,paddingHorizontal:5,paddingVertical:1}}><Text style={{fontSize:9,color:'#7DFFA0',fontWeight:'700'}}>✓ موثّق</Text></View>
              : <View style={{backgroundColor:'rgba(208,48,48,0.25)',borderRadius:6,paddingHorizontal:5,paddingVertical:1}}><Text style={{fontSize:9,color:'#FFB0B0',fontWeight:'700'}}>⚠ غير موثّق</Text></View>
            )}
          </View>
        </View>
        {!loggedIn&&(
          <TouchableOpacity onPress={onLogin} style={{backgroundColor:C.blue,borderRadius:10,paddingHorizontal:14,paddingVertical:7}}>
            <Text style={{fontSize:12,fontWeight:'700',color:'white'}}>تسجيل الدخول</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
      <ScrollView showsVerticalScrollIndicator={false}>
        {loggedIn&&!emailVerified&&(
          <View style={{backgroundColor:'#FFF8E7',borderBottomWidth:1,borderBottomColor:'#F5D87A',padding:14}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'}}>
              <TouchableOpacity onPress={resendSent?null:resendVerification} disabled={resending}>
                <Text style={{fontSize:11,color:C.blue,fontWeight:'700'}}>{resendSent?'تم الإرسال ✓':resending?'جارٍ الإرسال...':'إعادة الإرسال'}</Text>
              </TouchableOpacity>
              <View style={{flex:1,marginRight:10}}>
                <Text style={{fontSize:12,fontWeight:'700',color:'#7A5500',textAlign:'right'}}>⚠️ البريد الإلكتروني غير موثّق</Text>
                <Text style={{fontSize:11,color:'#9A7520',textAlign:'right',marginTop:2}}>تحقق من بريدك لتفعيل حسابك والاستفادة من جميع المزايا.</Text>
              </View>
            </View>
          </View>
        )}
        {rows.map((r,i)=>(
          <TouchableOpacity key={i} onPress={r.p} activeOpacity={r.p?0.7:1}
            style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:13,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.bg}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
              <View style={{width:36,height:36,borderRadius:9,backgroundColor:'rgba(36,99,235,0.08)',alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:16}}>{r.i}</Text>
              </View>
              <View>
                <Text style={{fontSize:13,fontWeight:'600',color:C.navy}}>{r.l}</Text>
                {r.s&&<Text style={{fontSize:10,color:C.txtL,marginTop:1}}>{r.s}</Text>}
              </View>
            </View>
            <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
              {r.b&&<View style={{backgroundColor:C.red,borderRadius:8,paddingHorizontal:6,paddingVertical:2}}><Text style={{fontSize:9,fontWeight:'700',color:'white'}}>{r.b}</Text></View>}
              <Text style={{fontSize:16,color:C.txtL}}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:13,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.bg}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
            <View style={{width:36,height:36,borderRadius:9,backgroundColor:'rgba(36,99,235,0.08)',alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:16}}>🌐</Text>
            </View>
            <Text style={{fontSize:13,fontWeight:'600',color:C.navy}}>اللغة</Text>
          </View>
          <View style={{flexDirection:'row',backgroundColor:C.bgD,borderRadius:10,padding:2,gap:2}}>
            {['ar','en'].map(x=>(
              <TouchableOpacity key={x} onPress={()=>setLang(x)} style={{paddingHorizontal:14,paddingVertical:5,borderRadius:8,backgroundColor:lang===x?C.white:undefined}}>
                <Text style={{fontSize:11,fontWeight:'700',color:lang===x?C.blueD:C.txtL}}>{x==='ar'?'عربي':'EN'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {loggedIn&&(
          <TouchableOpacity onPress={()=>webAlert('تسجيل الخروج','هل تريد الخروج؟',[{text:'إلغاء',style:'cancel'},{text:'خروج',style:'destructive',onPress:onLogout}])}
            style={{margin:16,padding:14,borderRadius:12,backgroundColor:C.redL,borderWidth:1,borderColor:'rgba(208,48,48,0.15)',alignItems:'center'}}>
            <Text style={{fontSize:13,fontWeight:'700',color:C.red}}>تسجيل الخروج 👋</Text>
          </TouchableOpacity>
        )}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function DoctorDetail({doctor:d,onBack,onBook}){
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="الطبيب" onBack={onBack}/>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={d.color} style={{height:205,alignItems:'center',justifyContent:'center',gap:10}}>
          <View style={{width:84,height:84,borderRadius:42,backgroundColor:'rgba(255,255,255,0.12)',borderWidth:3,borderColor:C.blue,alignItems:'center',justifyContent:'center'}}>
            <Text style={{fontSize:44}}>{d.emoji}</Text>
          </View>
          <Text style={{fontSize:17,fontWeight:'700',color:'white'}}>{d.name}</Text>
          <Text style={{fontSize:12,color:C.blue}}>{d.spec}</Text>
        </LinearGradient>
        <View style={{flexDirection:'row',borderBottomWidth:1,borderBottomColor:C.bgD}}>
          {[{n:`${d.exp} سنة`,l:'خبرة'},{n:`${(d.patients/1000).toFixed(1)}K`,l:'مريض'},{n:`${d.rating} ⭐`,l:'تقييم'}].map((s,i)=>(
            <View key={i} style={{flex:1,padding:14,alignItems:'center',borderLeftWidth:i<2?1:0,borderLeftColor:C.bgD}}>
              <Text style={{fontSize:16,fontWeight:'700',color:C.navy}}>{s.n}</Text>
              <Text style={{fontSize:9,color:C.txtL}}>{s.l}</Text>
            </View>
          ))}
        </View>
        <View style={{padding:18}}>
          <Text style={{fontSize:12,fontWeight:'700',color:C.txtM,marginBottom:8}}>عن الطبيب</Text>
          <View style={{backgroundColor:C.bgD,borderRadius:12,padding:14,marginBottom:16}}>
            <Text style={{fontSize:12,color:C.txtM,lineHeight:22,textAlign:'right'}}>{d.bio}</Text>
          </View>
          <Text style={{fontSize:12,fontWeight:'700',color:C.txtM,marginBottom:8}}>الفروع المتاحة</Text>
          <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:22}}>
            {d.branches.map((b,i)=>(
              <View key={i} style={{backgroundColor:'rgba(36,99,235,0.1)',borderRadius:8,paddingHorizontal:12,paddingVertical:5}}>
                <Text style={{fontSize:11,color:C.blueD,fontWeight:'700'}}>📍 {b}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={onBook} activeOpacity={0.85}>
            <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:14,padding:15,alignItems:'center'}}>
              <Text style={{fontSize:14,fontWeight:'700',color:C.blue}}>احجز موعد مع الطبيب ←</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LoginScreen({onBack,onLogin,onRegister,onForgot}){
  const [em,setEm]=useState('');
  const [pw,setPw]=useState('');
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');
  const [showPw,setShowPw]=useState(false);
  const login=async()=>{
    setErr('');
    if(!em.trim()){setErr('يرجى إدخال البريد الإلكتروني');return;}
    if(!pw.trim()){setErr('يرجى إدخال كلمة المرور');return;}
    setLoading(true);
    const res = await apiPost('/auth/login', { email:em.trim(), password:pw });
    setLoading(false);
    if (res?.ok) {
      onLogin(res.user, res.token);
    } else {
      setErr(res?.msg || 'حدث خطأ، حاول مرة أخرى');
    }
  };
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="تسجيل الدخول" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:24,alignItems:'center'}} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#0A1628','#0F2347']} style={{width:80,height:80,borderRadius:22,alignItems:'center',justifyContent:'center',marginBottom:16,gap:5,borderWidth:2,borderColor:'rgba(36,99,235,0.4)'}}>
          <View style={{width:52,height:3,backgroundColor:C.blue,borderRadius:2}}/>
          <Text style={{fontSize:10,fontWeight:'900',color:'white',letterSpacing:1}}>DR BASAFFAR</Text>
        </LinearGradient>
        <Text style={{fontSize:20,fontWeight:'700',color:C.navy,marginBottom:4}}>مرحباً بك 👋</Text>
        <Text style={{fontSize:12,color:C.txtL,marginBottom:28}}>سجّل دخولك للمتابعة</Text>

        {err ? <View style={{width:'100%',backgroundColor:C.redL,borderRadius:10,padding:10,marginBottom:12}}><Text style={{fontSize:12,color:C.red,textAlign:'right'}}>{err}</Text></View> : null}

        <View style={{width:'100%',marginBottom:12}}>
          <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>البريد الإلكتروني</Text>
          <TextInput style={{width:'100%',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:12,padding:12,fontSize:13,color:C.txt}} placeholder="أدخل بريدك الإلكتروني" value={em} onChangeText={v=>{setEm(v);setErr('');}} keyboardType="email-address" textAlign="right" placeholderTextColor={C.txtL} autoCapitalize="none"/>
        </View>
        <View style={{width:'100%',marginBottom:6}}>
          <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>كلمة المرور</Text>
          <View style={{flexDirection:'row',alignItems:'center',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:12,paddingHorizontal:12}}>
            <TouchableOpacity onPress={()=>setShowPw(p=>!p)} style={{padding:4}}>
              <Text style={{fontSize:16,color:C.txtL}}>{showPw?'🙈':'👁️'}</Text>
            </TouchableOpacity>
            <TextInput style={{flex:1,padding:12,fontSize:13,color:C.txt}} placeholder="أدخل كلمة المرور" value={pw} onChangeText={v=>{setPw(v);setErr('');}} secureTextEntry={!showPw} textAlign="right" placeholderTextColor={C.txtL}/>
          </View>
        </View>
        <TouchableOpacity style={{alignSelf:'flex-start',marginBottom:22}} onPress={onForgot}>
          <Text style={{fontSize:11,color:C.blue,fontWeight:'600'}}>نسيت كلمة المرور؟</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{width:'100%'}} onPress={login} activeOpacity={0.85} disabled={loading}>
          <LinearGradient colors={loading?['#6B86AA','#4A6090']:[C.blue,C.blueD]} style={{borderRadius:14,padding:14,alignItems:'center',width:'100%'}}>
            <Text style={{fontSize:15,fontWeight:'700',color:'white'}}>{loading?'جارٍ التحقق...':'تسجيل الدخول'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRegister} style={{marginTop:20}}>
          <Text style={{fontSize:12,color:C.txtL}}>ليس لديك حساب؟ <Text style={{color:C.blue,fontWeight:'700'}}>أنشئ حساباً</Text></Text>
        </TouchableOpacity>
        <View style={{height:30}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function RegisterScreen({onBack,onDone}){
  const [v,setV]=useState({name:'',email:'',phone:'',age:'',id:'',pass:'',pass2:''});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');
  const [showPw,setShowPw]=useState(false);
  const [showPw2,setShowPw2]=useState(false);
  const s=(k)=>(val)=>setV(p=>({...p,[k]:val}));

  const validatePassword=(pw)=>{
    if(pw.length<8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if(!/[A-Za-z]/.test(pw)) return 'يجب أن تحتوي على حروف إنجليزية';
    if(!/[0-9]/.test(pw)) return 'يجب أن تحتوي على أرقام';
    return null;
  };
  const pwStrength=(pw)=>{
    if(!pw) return null;
    const s=validatePassword(pw);
    if(s) return {label:'ضعيفة',color:'#D03030',pct:33};
    if(pw.length>=12&&/[^A-Za-z0-9]/.test(pw)) return {label:'قوية جداً',color:'#2A8A45',pct:100};
    if(pw.length>=10) return {label:'قوية',color:'#2A8A45',pct:80};
    return {label:'مقبولة',color:'#E07800',pct:60};
  };
  const strength=pwStrength(v.pass);

  const reg=async()=>{
    setErr('');
    if(!v.name.trim()){setErr('يرجى إدخال الاسم الكامل');return;}
    const emailRx=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!v.email.trim()||!emailRx.test(v.email.trim())){setErr('يرجى إدخال بريد إلكتروني صحيح');return;}
    if(!v.phone.trim()){setErr('يرجى إدخال رقم الهاتف');return;}
    const pwErr=validatePassword(v.pass);
    if(pwErr){setErr(pwErr);return;}
    if(v.pass!==v.pass2){setErr('كلمتا المرور غير متطابقتين');return;}
    setLoading(true);
    const res = await apiPost('/auth/register', { name:v.name.trim(), email:v.email.trim(), phone:v.phone.trim(), password:v.pass, age:v.age, idNum:v.id });
    setLoading(false);
    if (res?.ok) {
      onDone(res.user, res.token);
    } else {
      setErr(res?.msg || 'حدث خطأ، حاول مرة أخرى');
    }
  };
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="إنشاء حساب جديد" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:20}} keyboardShouldPersistTaps="handled">
        {err ? <View style={{backgroundColor:C.redL,borderRadius:10,padding:10,marginBottom:12}}><Text style={{fontSize:12,color:C.red,textAlign:'right'}}>{err}</Text></View> : null}

        {[
          {k:'name', lbl:'الاسم الكامل *',        kb:'default',       sc:false},
          {k:'email',lbl:'البريد الإلكتروني *',    kb:'email-address', sc:false,cap:'none'},
          {k:'phone',lbl:'رقم الهاتف *',           kb:'phone-pad',     sc:false},
          {k:'age',  lbl:'العمر',                  kb:'number-pad',    sc:false},
          {k:'id',   lbl:'رقم الهوية أو الإقامة', kb:'number-pad',    sc:false},
        ].map((f,i)=>(
          <View key={i} style={{marginBottom:12}}>
            <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>{f.lbl}</Text>
            <TextInput style={{backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:10,padding:11,fontSize:13,color:C.txt}} placeholder={f.lbl.replace(' *','')} value={v[f.k]} onChangeText={val=>{s(f.k)(val);setErr('');}} keyboardType={f.kb} secureTextEntry={f.sc} textAlign="right" placeholderTextColor={C.txtL} autoCapitalize={f.cap||'words'}/>
          </View>
        ))}

        <View style={{marginBottom:6}}>
          <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>كلمة المرور * (8 أحرف + أرقام)</Text>
          <View style={{flexDirection:'row',alignItems:'center',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:10,paddingHorizontal:10}}>
            <TouchableOpacity onPress={()=>setShowPw(p=>!p)} style={{padding:4}}><Text style={{fontSize:16,color:C.txtL}}>{showPw?'🙈':'👁️'}</Text></TouchableOpacity>
            <TextInput style={{flex:1,padding:11,fontSize:13,color:C.txt}} placeholder="أدخل كلمة المرور" value={v.pass} onChangeText={val=>{s('pass')(val);setErr('');}} secureTextEntry={!showPw} textAlign="right" placeholderTextColor={C.txtL}/>
          </View>
          {strength&&<View style={{marginTop:5}}>
            <View style={{height:4,backgroundColor:C.bgD,borderRadius:4,overflow:'hidden'}}>
              <View style={{height:4,backgroundColor:strength.color,width:`${strength.pct}%`,borderRadius:4}}/>
            </View>
            <Text style={{fontSize:10,color:strength.color,textAlign:'right',marginTop:3}}>قوة كلمة المرور: {strength.label}</Text>
          </View>}
        </View>

        <View style={{marginBottom:16}}>
          <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>تأكيد كلمة المرور *</Text>
          <View style={{flexDirection:'row',alignItems:'center',backgroundColor:C.white,borderWidth:1,borderColor:v.pass2&&v.pass!==v.pass2?C.red:C.bgD,borderRadius:10,paddingHorizontal:10}}>
            <TouchableOpacity onPress={()=>setShowPw2(p=>!p)} style={{padding:4}}><Text style={{fontSize:16,color:C.txtL}}>{showPw2?'🙈':'👁️'}</Text></TouchableOpacity>
            <TextInput style={{flex:1,padding:11,fontSize:13,color:C.txt}} placeholder="أعد إدخال كلمة المرور" value={v.pass2} onChangeText={val=>{s('pass2')(val);setErr('');}} secureTextEntry={!showPw2} textAlign="right" placeholderTextColor={C.txtL}/>
          </View>
        </View>

        <View style={{backgroundColor:C.blueL,borderRadius:10,padding:10,marginBottom:16}}>
          <Text style={{fontSize:11,color:C.blueD,textAlign:'right',lineHeight:18}}>📧 سيتم إرسال رابط التحقق إلى بريدك الإلكتروني بعد إنشاء الحساب.</Text>
        </View>

        <TouchableOpacity onPress={reg} activeOpacity={0.85} disabled={loading} style={{marginTop:4}}>
          <LinearGradient colors={loading?['#6B86AA','#4A6090']:[C.blue,C.blueD]} style={{borderRadius:14,padding:14,alignItems:'center'}}>
            <Text style={{fontSize:15,fontWeight:'700',color:'white'}}>{loading?'جارٍ الإنشاء...':'إنشاء الحساب'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{height:30}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function ForgotPasswordScreen({onBack}){
  const [email,setEmail]=useState('');
  const [loading,setLoading]=useState(false);
  const [sent,setSent]=useState(false);
  const [err,setErr]=useState('');

  const send=async()=>{
    setErr('');
    const emailRx=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!email.trim()||!emailRx.test(email.trim())){setErr('يرجى إدخال بريد إلكتروني صحيح');return;}
    setLoading(true);
    const res=await apiPost('/auth/forgot-password',{email:email.trim()});
    setLoading(false);
    if(res?.ok) setSent(true);
    else setErr(res?.msg||'حدث خطأ، حاول لاحقاً');
  };
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="نسيت كلمة المرور" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:24,alignItems:'center'}} keyboardShouldPersistTaps="handled">
        <Text style={{fontSize:40,marginBottom:16}}>🔒</Text>
        <Text style={{fontSize:18,fontWeight:'700',color:C.navy,marginBottom:8,textAlign:'center'}}>استعادة كلمة المرور</Text>
        <Text style={{fontSize:12,color:C.txtL,marginBottom:28,textAlign:'center',lineHeight:20}}>أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة المرور</Text>
        {sent?(
          <View style={{backgroundColor:C.grnL,borderRadius:16,padding:24,alignItems:'center',width:'100%'}}>
            <Text style={{fontSize:36,marginBottom:12}}>✅</Text>
            <Text style={{fontSize:15,fontWeight:'700',color:C.grn,marginBottom:8,textAlign:'center'}}>تم إرسال الرابط!</Text>
            <Text style={{fontSize:12,color:C.grn,textAlign:'center',lineHeight:20}}>إذا كان البريد مسجلاً، ستجد رابط إعادة التعيين في صندوق البريد الوارد.</Text>
            <TouchableOpacity onPress={onBack} style={{marginTop:20}}>
              <Text style={{fontSize:13,color:C.blue,fontWeight:'700'}}>العودة لتسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        ):(
          <>
            {err?<View style={{width:'100%',backgroundColor:C.redL,borderRadius:10,padding:10,marginBottom:12}}><Text style={{fontSize:12,color:C.red,textAlign:'right'}}>{err}</Text></View>:null}
            <View style={{width:'100%',marginBottom:20}}>
              <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>البريد الإلكتروني</Text>
              <TextInput style={{width:'100%',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:12,padding:12,fontSize:13,color:C.txt}} placeholder="example@email.com" value={email} onChangeText={v=>{setEmail(v);setErr('');}} keyboardType="email-address" textAlign="right" placeholderTextColor={C.txtL} autoCapitalize="none"/>
            </View>
            <TouchableOpacity style={{width:'100%'}} onPress={send} disabled={loading} activeOpacity={0.85}>
              <LinearGradient colors={loading?['#6B86AA','#4A6090']:[C.blue,C.blueD]} style={{borderRadius:14,padding:14,alignItems:'center',width:'100%'}}>
                <Text style={{fontSize:15,fontWeight:'700',color:'white'}}>{loading?'جارٍ الإرسال...':'إرسال رابط الاسترداد'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BranchesScreen({onBack,branches:propBranches}){
  const brData = propBranches || BRANCHES_LIST;
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="فروعنا 📍" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        {brData.map(b=>(
          <View key={b.id} style={{backgroundColor:C.white,borderRadius:16,marginBottom:14,overflow:'hidden',borderWidth:1,borderColor:C.bgD}}>
            <LinearGradient colors={[C.navy,C.navyM]} style={{height:72,alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:30}}>🗺️</Text>
            </LinearGradient>
            <View style={{padding:14}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
                <View style={{backgroundColor:b.open?C.grnL:C.redL,borderRadius:8,paddingHorizontal:9,paddingVertical:3}}>
                  <Text style={{fontSize:10,fontWeight:'700',color:b.open?C.grn:C.red}}>{b.open?'مفتوح ●':'مغلق ●'}</Text>
                </View>
                <Text style={{fontSize:13,fontWeight:'700',color:C.navy}}>{b.name}</Text>
              </View>
              <Text style={{fontSize:11,color:C.txtL,marginBottom:3,textAlign:'right'}}>📍 {b.addr}</Text>
              <Text style={{fontSize:11,color:C.txtM,marginBottom:4,textAlign:'right'}}>📞 {b.phone}</Text>
              <Text style={{fontSize:10,fontWeight:'700',color:b.open?C.grn:C.red,marginBottom:10,textAlign:'right'}}>⏰ {b.hours}</Text>
              <View style={{flexDirection:'row',gap:7,justifyContent:'flex-end'}}>
                {b.depts.map((d,i)=>(
                  <View key={i} style={{backgroundColor:C.bgD,borderRadius:8,paddingHorizontal:10,paddingVertical:4}}>
                    <Text style={{fontSize:12}}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen({onBack,userName,userEmail,emailVerified,onVerifiedUpdate}){
  const [v,setV]=useState({name:userName||'',email:userEmail||'',phone:'',age:'',nat:'',id:''});
  const [loading,setLoading]=useState(true);
  const [savingPw,setSavingPw]=useState(false);
  const [pw,setPw]=useState({cur:'',next:'',next2:''});
  const [pwErr,setPwErr]=useState('');
  const [pwOk,setPwOk]=useState('');
  const [resendSent,setResendSent]=useState(false);

  useEffect(()=>{
    apiFetch('/auth/me').then(res=>{
      if(res?.ok) {
        const u=res.user;
        setV(p=>({...p,name:u.name||'',email:u.email||'',phone:u.phone||''}));
      }
      setLoading(false);
    });
  },[]);

  const changePassword=async()=>{
    setPwErr('');setPwOk('');
    if(!pw.cur){setPwErr('أدخل كلمة المرور الحالية');return;}
    if(pw.next.length<8){setPwErr('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');return;}
    if(pw.next!==pw.next2){setPwErr('كلمتا المرور الجديدة غير متطابقتين');return;}
    setSavingPw(true);
    const res=await apiPost('/auth/change-password',{currentPassword:pw.cur,newPassword:pw.next});
    setSavingPw(false);
    if(res?.ok){setPwOk('تم تغيير كلمة المرور بنجاح ✓');setPw({cur:'',next:'',next2:''});}
    else setPwErr(res?.msg||'حدث خطأ');
  };

  const resendVerification=async()=>{
    if(!userEmail) return;
    await apiPost('/auth/resend-verification',{email:userEmail});
    setResendSent(true);
  };

  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="البيانات الشخصية" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:20}} keyboardShouldPersistTaps="handled">
        <View style={{backgroundColor:C.white,borderRadius:16,padding:16,marginBottom:16,borderWidth:1,borderColor:C.bgD}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <View style={{backgroundColor:emailVerified?C.grnL:C.redL,borderRadius:8,paddingHorizontal:10,paddingVertical:4}}>
              <Text style={{fontSize:11,fontWeight:'700',color:emailVerified?C.grn:C.red}}>{emailVerified?'✓ البريد موثّق':'⚠ البريد غير موثّق'}</Text>
            </View>
            <Text style={{fontSize:13,fontWeight:'700',color:C.navy}}>معلوماتي</Text>
          </View>
          {!emailVerified&&(
            <TouchableOpacity onPress={resendVerification} style={{backgroundColor:C.blueL,borderRadius:10,padding:10,marginBottom:12}}>
              <Text style={{fontSize:12,color:C.blueD,textAlign:'center',fontWeight:'600'}}>{resendSent?'تم إرسال رابط التحقق ✓':'📧 إعادة إرسال رابط التحقق'}</Text>
            </TouchableOpacity>
          )}
          {[
            {k:'name', lbl:'الاسم الكامل',        kb:'default'},
            {k:'email',lbl:'البريد الإلكتروني',   kb:'email-address'},
            {k:'phone',lbl:'رقم الجوال',           kb:'phone-pad'},
            {k:'age',  lbl:'العمر',                kb:'number-pad'},
            {k:'nat',  lbl:'الجنسية',              kb:'default'},
            {k:'id',   lbl:'رقم الهوية',           kb:'number-pad'},
          ].map((f,i)=>(
            <View key={i} style={{marginBottom:10}}>
              <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:4,textAlign:'right'}}>{f.lbl}</Text>
              <TextInput style={{backgroundColor:C.bg,borderWidth:1,borderColor:C.bgD,borderRadius:10,padding:10,fontSize:13,color:C.txt}} value={v[f.k]} onChangeText={val=>setV(p=>({...p,[f.k]:val}))} keyboardType={f.kb||'default'} textAlign="right" placeholderTextColor={C.txtL}/>
            </View>
          ))}
        </View>

        <View style={{backgroundColor:C.white,borderRadius:16,padding:16,marginBottom:16,borderWidth:1,borderColor:C.bgD}}>
          <Text style={{fontSize:13,fontWeight:'700',color:C.navy,marginBottom:12,textAlign:'right'}}>🔒 تغيير كلمة المرور</Text>
          {pwErr?<View style={{backgroundColor:C.redL,borderRadius:8,padding:8,marginBottom:8}}><Text style={{fontSize:11,color:C.red,textAlign:'right'}}>{pwErr}</Text></View>:null}
          {pwOk?<View style={{backgroundColor:C.grnL,borderRadius:8,padding:8,marginBottom:8}}><Text style={{fontSize:11,color:C.grn,textAlign:'right'}}>{pwOk}</Text></View>:null}
          {[{k:'cur',lbl:'كلمة المرور الحالية'},{k:'next',lbl:'كلمة المرور الجديدة'},{k:'next2',lbl:'تأكيد كلمة المرور الجديدة'}].map((f,i)=>(
            <View key={i} style={{marginBottom:10}}>
              <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:4,textAlign:'right'}}>{f.lbl}</Text>
              <TextInput style={{backgroundColor:C.bg,borderWidth:1,borderColor:C.bgD,borderRadius:10,padding:10,fontSize:13,color:C.txt}} value={pw[f.k]} onChangeText={val=>{setPwErr('');setPwOk('');setPw(p=>({...p,[f.k]:val}));}} secureTextEntry={true} textAlign="right" placeholderTextColor={C.txtL}/>
            </View>
          ))}
          <TouchableOpacity onPress={changePassword} disabled={savingPw} activeOpacity={0.85}>
            <LinearGradient colors={savingPw?['#6B86AA','#4A6090']:[C.navy,C.navyM]} style={{borderRadius:12,padding:12,alignItems:'center'}}>
              <Text style={{fontSize:13,fontWeight:'700',color:'white'}}>{savingPw?'جارٍ الحفظ...':'تغيير كلمة المرور'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={{height:30}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function MyBookingsScreen({onBack,loggedIn,onLogin}){
  const [bookings,setBookings]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    (async()=>{
      const data=await apiFetch('/bookings');
      if(data) setBookings(Array.isArray(data)?data:data.bookings||[]);
      setLoading(false);
    })();
  },[]);
  const statusMap={pending:{l:'معلق',c:C.txtL,bg:C.bgD},confirmed:{l:'مؤكد',c:C.grn,bg:C.grnL},cancelled:{l:'ملغي',c:C.red,bg:C.redL}};
  if(!loggedIn) return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="حجوزاتي" onBack={onBack}/>
      <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:30}}>
        <Text style={{fontSize:40,marginBottom:16}}>🔒</Text>
        <Text style={{fontSize:15,fontWeight:'700',color:C.navy,marginBottom:8}}>سجّل دخولك أولاً</Text>
        <Text style={{fontSize:12,color:C.txtL,marginBottom:20,textAlign:'center'}}>يرجى تسجيل الدخول لعرض حجوزاتك</Text>
        <TouchableOpacity onPress={onLogin}><LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:12,paddingHorizontal:28,paddingVertical:12}}><Text style={{fontSize:13,fontWeight:'700',color:'white'}}>تسجيل الدخول</Text></LinearGradient></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="حجوزاتي 📋" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        {loading?<Text style={{textAlign:'center',color:C.txtL,marginTop:40}}>جاري التحميل...</Text>
        :bookings.length===0?
          <View style={{alignItems:'center',marginTop:60}}>
            <Text style={{fontSize:50,marginBottom:16}}>📋</Text>
            <Text style={{fontSize:15,fontWeight:'700',color:C.navy,marginBottom:6}}>لا توجد حجوزات</Text>
            <Text style={{fontSize:12,color:C.txtL}}>لم تقم بأي حجز بعد</Text>
          </View>
        :bookings.map((b,i)=>{
          const st=statusMap[b.status]||statusMap.pending;
          return(
            <View key={b.id||i} style={{backgroundColor:C.white,borderRadius:14,marginBottom:12,padding:14,borderWidth:1,borderColor:C.bgD}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <View style={{backgroundColor:st.bg,borderRadius:8,paddingHorizontal:10,paddingVertical:3}}>
                  <Text style={{fontSize:10,fontWeight:'700',color:st.c}}>{st.l}</Text>
                </View>
                <Text style={{fontSize:13,fontWeight:'700',color:C.navy}}>{b.offer||b.name||'حجز'}</Text>
              </View>
              {b.code&&<Text style={{fontSize:11,color:C.txtL,textAlign:'right',marginBottom:4}}>رقم الحجز: {b.code}</Text>}
              {b.branch&&<Text style={{fontSize:11,color:C.txtM,textAlign:'right',marginBottom:4}}>📍 {b.branch}</Text>}
              {b.phone&&<Text style={{fontSize:11,color:C.txtL,textAlign:'right',marginBottom:4}}>📞 {b.phone}</Text>}
              {b.date&&<Text style={{fontSize:10,color:C.txtL,textAlign:'right'}}>📅 {new Date(b.date).toLocaleDateString('ar-SA')}</Text>}
            </View>
          );
        })}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function BalanceScreen({onBack}){
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="رصيدي 💰" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:20,alignItems:'center'}}>
        <LinearGradient colors={[C.navy,C.navyM]} style={{width:'100%',borderRadius:20,padding:24,alignItems:'center',marginBottom:24}}>
          <Text style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:8}}>رصيدك الحالي</Text>
          <Text style={{fontSize:40,fontWeight:'900',color:'white',marginBottom:4}}>0 <Text style={{fontSize:18}}>﷼</Text></Text>
          <Text style={{fontSize:11,color:C.blue,fontWeight:'600'}}>لا يوجد رصيد حالياً</Text>
        </LinearGradient>
        <View style={{backgroundColor:C.white,borderRadius:16,padding:18,width:'100%',marginBottom:16,borderWidth:1,borderColor:C.bgD}}>
          <Text style={{fontSize:13,fontWeight:'700',color:C.navy,marginBottom:12,textAlign:'right'}}>نقاط الولاء ⭐</Text>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <Text style={{fontSize:11,color:C.txtL}}>المستوى: برونزي</Text>
            <Text style={{fontSize:22,fontWeight:'900',color:C.blue}}>0</Text>
          </View>
          <View style={{height:6,backgroundColor:C.bgD,borderRadius:3,marginTop:12}}>
            <View style={{height:6,backgroundColor:C.blue,borderRadius:3,width:'0%'}}/>
          </View>
          <Text style={{fontSize:10,color:C.txtL,marginTop:6,textAlign:'right'}}>اجمع 100 نقطة للترقية إلى المستوى الفضي</Text>
        </View>
        <TouchableOpacity activeOpacity={0.85} style={{width:'100%'}} onPress={()=>webAlert('قريباً','خدمة شحن الرصيد ستكون متاحة قريباً')}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:14,padding:14,alignItems:'center'}}>
            <Text style={{fontSize:14,fontWeight:'700',color:'white'}}>💳 اشحن رصيدك</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InvoicesScreen({onBack,loggedIn,onLogin}){
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    (async()=>{
      const data=await apiFetch('/bookings');
      if(data){
        const all=Array.isArray(data)?data:data.bookings||[];
        setInvoices(all.filter(b=>b.status==='confirmed'));
      }
      setLoading(false);
    })();
  },[]);
  if(!loggedIn) return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="فواتيري" onBack={onBack}/>
      <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:30}}>
        <Text style={{fontSize:40,marginBottom:16}}>🔒</Text>
        <Text style={{fontSize:15,fontWeight:'700',color:C.navy,marginBottom:8}}>سجّل دخولك أولاً</Text>
        <Text style={{fontSize:12,color:C.txtL,marginBottom:20,textAlign:'center'}}>يرجى تسجيل الدخول لعرض فواتيرك</Text>
        <TouchableOpacity onPress={onLogin}><LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:12,paddingHorizontal:28,paddingVertical:12}}><Text style={{fontSize:13,fontWeight:'700',color:'white'}}>تسجيل الدخول</Text></LinearGradient></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="فواتيري 🧾" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        {loading?<Text style={{textAlign:'center',color:C.txtL,marginTop:40}}>جاري التحميل...</Text>
        :invoices.length===0?
          <View style={{alignItems:'center',marginTop:60}}>
            <Text style={{fontSize:50,marginBottom:16}}>🧾</Text>
            <Text style={{fontSize:15,fontWeight:'700',color:C.navy,marginBottom:6}}>لا توجد فواتير</Text>
            <Text style={{fontSize:12,color:C.txtL}}>لم يتم إصدار أي فاتورة بعد</Text>
          </View>
        :invoices.map((inv,i)=>(
          <View key={inv.id||i} style={{backgroundColor:C.white,borderRadius:14,marginBottom:12,padding:14,borderWidth:1,borderColor:C.bgD}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <View style={{backgroundColor:C.grnL,borderRadius:8,paddingHorizontal:10,paddingVertical:3}}>
                <Text style={{fontSize:10,fontWeight:'700',color:C.grn}}>مدفوعة</Text>
              </View>
              <Text style={{fontSize:13,fontWeight:'700',color:C.navy}}>{inv.offer||inv.name||'خدمة'}</Text>
            </View>
            {inv.code&&<Text style={{fontSize:11,color:C.txtL,textAlign:'right',marginBottom:4}}>رقم الفاتورة: {inv.code}</Text>}
            {inv.branch&&<Text style={{fontSize:11,color:C.txtM,textAlign:'right',marginBottom:4}}>📍 {inv.branch}</Text>}
            {inv.price&&<Text style={{fontSize:16,fontWeight:'900',color:C.blueD,textAlign:'right'}}>{Number(inv.price).toLocaleString()} ﷼</Text>}
            {inv.date&&<Text style={{fontSize:10,color:C.txtL,textAlign:'right',marginTop:4}}>📅 {new Date(inv.date).toLocaleDateString('ar-SA')}</Text>}
          </View>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function ServicesScreen({onBack,depts}){
  const services=depts||DEPTS;
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="خدماتنا ⚕️" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        {services.filter(d=>d.dept!=='branches').map((d,i)=>(
          <View key={d.id||i} style={{backgroundColor:C.white,borderRadius:16,marginBottom:14,overflow:'hidden',borderWidth:1,borderColor:C.bgD}}>
            <LinearGradient colors={d.color||[C.navy,C.navyM]} style={{height:90,alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:36}}>{d.dept==='أسنان'?'🦷':d.dept==='جلدية'?'✨':d.dept==='عيون'?'👁️':d.dept==='تجميل'?'💄':'⚕️'}</Text>
            </LinearGradient>
            <View style={{padding:14}}>
              <Text style={{fontSize:15,fontWeight:'700',color:C.navy,textAlign:'right',marginBottom:6}}>{d.label}</Text>
              <Text style={{fontSize:12,color:C.txtM,textAlign:'right',lineHeight:20}}>
                {d.dept==='أسنان'?'زراعة الأسنان، تركيبات الزيركون والبورسلين، تبييض بالليزر، علاج العصب والجذور'
                :d.dept==='جلدية'?'إزالة الشعر بالليزر، تقشير البشرة، علاج حب الشباب، تجديد البشرة'
                :d.dept==='عيون'?'تصحيح النظر بالليزر، علاج الماء الأبيض، فحص قاع العين'
                :d.dept==='تجميل'?'حقن البوتوكس والفيلر، نحت الوجه، تجميل الأنف غير الجراحي'
                :'خدمات طبية متخصصة بأحدث التقنيات'}
              </Text>
            </View>
          </View>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationsScreen({onBack}){
  const [notifs,setNotifs]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    (async()=>{
      const data=await apiFetch('/notifications');
      if(data) setNotifs(Array.isArray(data)?data:data.notifications||[]);
      setLoading(false);
    })();
  },[]);
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="الإشعارات 🔔" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        {loading?<Text style={{textAlign:'center',color:C.txtL,marginTop:40}}>جاري التحميل...</Text>
        :notifs.length===0?
          <View style={{alignItems:'center',marginTop:60}}>
            <Text style={{fontSize:50,marginBottom:16}}>🔔</Text>
            <Text style={{fontSize:15,fontWeight:'700',color:C.navy,marginBottom:6}}>لا توجد إشعارات</Text>
            <Text style={{fontSize:12,color:C.txtL}}>ستصلك الإشعارات هنا</Text>
          </View>
        :notifs.map((n,i)=>(
          <View key={n.id||i} style={{backgroundColor:C.white,borderRadius:14,marginBottom:10,padding:14,borderWidth:1,borderColor:C.bgD}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:6}}>
              <View style={{width:36,height:36,borderRadius:18,backgroundColor:C.blueL,alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:16}}>🔔</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:13,fontWeight:'700',color:C.navy,textAlign:'right'}}>{n.title||'إشعار'}</Text>
                {n.date&&<Text style={{fontSize:10,color:C.txtL,textAlign:'right'}}>{new Date(n.date).toLocaleDateString('ar-SA')}</Text>}
              </View>
            </View>
            <Text style={{fontSize:12,color:C.txtM,textAlign:'right',lineHeight:20}}>{n.message||n.body||n.msg||''}</Text>
          </View>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function UsageGuideScreen({onBack}){
  const [open,setOpen]=useState(-1);
  const items=[
    {q:'كيف أحجز موعداً؟',a:'اذهب إلى تبويب "حجز" من الشريط السفلي، اختر العرض والفرع المناسب، ثم أدخل بياناتك واضغط "تأكيد الحجز".'},
    {q:'كيف أسجّل حساباً جديداً؟',a:'من قائمة "المزيد"، اضغط "تسجيل الدخول" ثم "أنشئ حساباً". أدخل بياناتك الشخصية وكلمة المرور.'},
    {q:'كيف أعرف حالة حجزي؟',a:'من قائمة "المزيد"، اضغط "حجوزاتي" لعرض جميع حجوزاتك وحالتها (معلق/مؤكد/ملغي).'},
    {q:'كيف أتواصل مع العيادة؟',a:'من قائمة "المزيد"، اضغط "تواصل معنا" لعرض أرقام الهاتف والبريد الإلكتروني وعنوان العيادة.'},
    {q:'كيف أعرف العروض المتاحة؟',a:'اذهب إلى تبويب "العروض" من الشريط السفلي لعرض جميع العروض الحالية مع الأسعار والتفاصيل.'},
    {q:'كيف أضيف عرض إلى السلة؟',a:'اضغط على أي عرض لعرض تفاصيله، اختر الفرع والكمية ثم اضغط "أضف إلى السلة".'},
  ];
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="إرشادات الاستخدام 📖" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:16,padding:20,alignItems:'center',marginBottom:20}}>
          <Text style={{fontSize:36,marginBottom:10}}>📱</Text>
          <Text style={{fontSize:16,fontWeight:'700',color:'white',marginBottom:4}}>دليل استخدام التطبيق</Text>
          <Text style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>أسئلة شائعة وإرشادات</Text>
        </LinearGradient>
        {items.map((it,i)=>(
          <TouchableOpacity key={i} onPress={()=>setOpen(open===i?-1:i)} activeOpacity={0.8}
            style={{backgroundColor:C.white,borderRadius:14,marginBottom:10,borderWidth:1,borderColor:open===i?C.blue:C.bgD,overflow:'hidden'}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:14}}>
              <Text style={{fontSize:16,color:C.blue}}>{open===i?'▾':'▸'}</Text>
              <Text style={{flex:1,fontSize:13,fontWeight:'600',color:C.navy,textAlign:'right',marginRight:8}}>{it.q}</Text>
            </View>
            {open===i&&(
              <View style={{paddingHorizontal:14,paddingBottom:14}}>
                <View style={{height:1,backgroundColor:C.bgD,marginBottom:10}}/>
                <Text style={{fontSize:12,color:C.txtM,textAlign:'right',lineHeight:22}}>{it.a}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutScreen({onBack}){
  const [settings,setSettings]=useState(null);
  useEffect(()=>{
    (async()=>{
      const data=await apiFetch('/settings');
      if(data) setSettings(data);
    })();
  },[]);
  const name=settings?.appNameAr||'عيادات د. باصفار';
  const tag=settings?.tagline||'رعاية طبية متخصصة بأحدث التقنيات';
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="معلومات عنّا ℹ️" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:20,padding:28,alignItems:'center',marginBottom:20}}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{width:72,height:72,borderRadius:20,alignItems:'center',justifyContent:'center',marginBottom:14,borderWidth:2,borderColor:'rgba(36,99,235,0.4)'}}>
            <View style={{width:44,height:3,backgroundColor:'white',borderRadius:2,marginBottom:4}}/>
            <Text style={{fontSize:8,fontWeight:'900',color:'white',letterSpacing:1}}>DR BASAFFAR</Text>
          </LinearGradient>
          <Text style={{fontSize:18,fontWeight:'700',color:'white',marginBottom:4}}>{name}</Text>
          <Text style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>{tag}</Text>
        </LinearGradient>
        <View style={{backgroundColor:C.white,borderRadius:16,padding:18,borderWidth:1,borderColor:C.bgD,marginBottom:14}}>
          <Text style={{fontSize:13,fontWeight:'700',color:C.navy,marginBottom:10,textAlign:'right'}}>من نحن</Text>
          <Text style={{fontSize:12,color:C.txtM,lineHeight:22,textAlign:'right'}}>
            عيادات د. باصفار هي مجموعة طبية متخصصة تقدم خدمات طب الأسنان والجلدية والليزر والعيون والتجميل بأحدث التقنيات العالمية. نسعى لتقديم أعلى مستويات الرعاية الصحية بأيدي نخبة من الاستشاريين والأخصائيين.
          </Text>
        </View>
        <View style={{backgroundColor:C.white,borderRadius:16,padding:18,borderWidth:1,borderColor:C.bgD,marginBottom:14}}>
          <Text style={{fontSize:13,fontWeight:'700',color:C.navy,marginBottom:10,textAlign:'right'}}>رؤيتنا</Text>
          <Text style={{fontSize:12,color:C.txtM,lineHeight:22,textAlign:'right'}}>
            أن نكون الخيار الأول في المملكة العربية السعودية للرعاية الطبية التخصصية، من خلال تقديم خدمات عالية الجودة بأسعار تنافسية.
          </Text>
        </View>
        <View style={{backgroundColor:C.white,borderRadius:16,padding:18,borderWidth:1,borderColor:C.bgD}}>
          <Text style={{fontSize:13,fontWeight:'700',color:C.navy,marginBottom:10,textAlign:'right'}}>قيمنا</Text>
          {['الجودة والتميز في الخدمة الطبية','الشفافية والمصداقية مع عملائنا','التطوير المستمر واعتماد أحدث التقنيات','الاهتمام براحة المريض وسلامته'].map((v,i)=>(
            <View key={i} style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8}}>
              <Text style={{fontSize:12,color:C.blue}}>✦</Text>
              <Text style={{flex:1,fontSize:12,color:C.txtM,textAlign:'right'}}>{v}</Text>
            </View>
          ))}
        </View>
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactScreen({onBack}){
  const [settings,setSettings]=useState(null);
  useEffect(()=>{
    (async()=>{
      const data=await apiFetch('/settings');
      if(data) setSettings(data);
    })();
  },[]);
  const phone=settings?.phone||'+966501234567';
  const email=settings?.email||'info@basaffar.com';
  const website=settings?.website||'www.basaffar.com';
  const contacts=[
    {icon:'📞',label:'الهاتف',value:phone},
    {icon:'📧',label:'البريد الإلكتروني',value:email},
    {icon:'🌐',label:'الموقع الإلكتروني',value:website},
    {icon:'📍',label:'العنوان',value:'طريق الملك عبدالله، حي النزهة، الرياض'},
    {icon:'🕐',label:'ساعات العمل',value:'السبت - الخميس: 8 ص - 10 م'},
  ];
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="تواصل معنا 💬" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:16,padding:24,alignItems:'center',marginBottom:20}}>
          <Text style={{fontSize:36,marginBottom:10}}>💬</Text>
          <Text style={{fontSize:16,fontWeight:'700',color:'white',marginBottom:4}}>تواصل معنا</Text>
          <Text style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>يسعدنا خدمتك دائماً</Text>
        </LinearGradient>
        {contacts.map((c,i)=>(
          <View key={i} style={{backgroundColor:C.white,borderRadius:14,marginBottom:10,padding:14,borderWidth:1,borderColor:C.bgD,flexDirection:'row',alignItems:'center',gap:12}}>
            <View style={{width:40,height:40,borderRadius:10,backgroundColor:C.blueL,alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:18}}>{c.icon}</Text>
            </View>
            <View style={{flex:1}}>
              <Text style={{fontSize:11,color:C.txtL,textAlign:'right',marginBottom:2}}>{c.label}</Text>
              <Text style={{fontSize:13,fontWeight:'600',color:C.navy,textAlign:'right'}}>{c.value}</Text>
            </View>
          </View>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyScreen({onBack}){
  const sections=[
    {t:'جمع المعلومات',c:'نقوم بجمع المعلومات الشخصية التي تقدمها لنا عند التسجيل أو الحجز، مثل الاسم ورقم الهاتف والبريد الإلكتروني. نستخدم هذه المعلومات فقط لتقديم خدماتنا الطبية.'},
    {t:'استخدام المعلومات',c:'نستخدم بياناتك الشخصية لإدارة حجوزاتك وتقديم الخدمات الطبية المطلوبة وإرسال الإشعارات المتعلقة بمواعيدك وتحسين خدماتنا.'},
    {t:'حماية المعلومات',c:'نلتزم بحماية معلوماتك الشخصية باستخدام تقنيات أمان متقدمة. لا نشارك بياناتك مع أطراف ثالثة إلا بموافقتك أو عند الضرورة القانونية.'},
    {t:'حقوق المستخدم',c:'يحق لك الاطلاع على بياناتك الشخصية وتعديلها أو حذفها في أي وقت. يمكنك التواصل معنا لممارسة هذه الحقوق.'},
    {t:'ملفات تعريف الارتباط',c:'نستخدم ملفات تعريف الارتباط لتحسين تجربتك في التطبيق. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال إعدادات جهازك.'},
    {t:'التعديلات',c:'نحتفظ بالحق في تعديل سياسة الخصوصية في أي وقت. سيتم إبلاغك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني.'},
  ];
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="سياسة الخصوصية 🔒" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:16,padding:20,alignItems:'center',marginBottom:20}}>
          <Text style={{fontSize:36,marginBottom:10}}>🔒</Text>
          <Text style={{fontSize:16,fontWeight:'700',color:'white',marginBottom:4}}>سياسة الخصوصية</Text>
          <Text style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>آخر تحديث: يناير 2026</Text>
        </LinearGradient>
        {sections.map((s,i)=>(
          <View key={i} style={{backgroundColor:C.white,borderRadius:14,marginBottom:10,padding:14,borderWidth:1,borderColor:C.bgD}}>
            <Text style={{fontSize:13,fontWeight:'700',color:C.navy,marginBottom:8,textAlign:'right'}}>{s.t}</Text>
            <Text style={{fontSize:12,color:C.txtM,lineHeight:22,textAlign:'right'}}>{s.c}</Text>
          </View>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function BB({title,onBack}){
  return(
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:13,borderBottomWidth:1,borderBottomColor:C.bgD,backgroundColor:C.bg}}>
      <TouchableOpacity onPress={onBack} style={{width:34,height:34,borderRadius:17,backgroundColor:C.bgD,alignItems:'center',justifyContent:'center'}}>
        <Text style={{fontSize:22,color:C.navy,lineHeight:24}}>‹</Text>
      </TouchableOpacity>
      <Text style={{fontSize:14,fontWeight:'700',color:C.navy}}>{title}</Text>
      <View style={{width:34}}/>
    </View>
  );
}
function PH({title}){
  return(
    <View style={{paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.bgD,backgroundColor:C.bg}}>
      <Text style={{textAlign:'center',fontSize:16,fontWeight:'700',color:C.navy}}>{title}</Text>
    </View>
  );
}
