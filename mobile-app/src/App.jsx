import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Dimensions, Animated, StatusBar,
  SafeAreaView, Image, Platform,
} from 'react-native';
import { LinearGradient } from './LinearGradient';

const API_URL = '/api';

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

// ─── Cookie-based API layer with automatic token refresh on 401 ───────────────
let _refreshing = null; // deduplicate concurrent refresh calls

async function _makeRequest(method, path, body) {
  const opts = { method, credentials: 'include', headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return fetch(API_URL + path, opts);
}

// Auth form endpoints that should never trigger silent token-refresh on 401
// (their 401 = legitimate rejection, e.g. wrong password — must reach the caller)
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/change-password', '/auth/resend-verification'];

async function apiRequest(method, path, body) {
  try {
    let res = await _makeRequest(method, path, body);
    const skipRefresh = NO_REFRESH_PATHS.some(p => path.endsWith(p));
    if (res.status === 401 && !skipRefresh) {
      // Try refreshing the access token once
      if (!_refreshing) {
        _refreshing = fetch(API_URL + '/auth/refresh', { method: 'POST', credentials: 'include' })
          .finally(() => { _refreshing = null; });
      }
      const refreshRes = await _refreshing;
      if (refreshRes && refreshRes.ok) {
        res = await _makeRequest(method, path, body);
      } else {
        return { _sessionExpired: true };
      }
    }
    return await res.json();
  } catch (e) {
    console.warn('[API]', method, path, e.message);
    return null;
  }
}

async function apiFetch(path)        { return apiRequest('GET',    path);       }
async function apiPost(path, body)   { return apiRequest('POST',   path, body); }
async function apiPut(path, body)    { return apiRequest('PUT',    path, body); }
async function apiDelete(path)       { return apiRequest('DELETE', path);       }

async function fetchCaptcha() {
  try {
    const res = await fetch(API_URL + '/auth/captcha', { credentials: 'include' });
    return await res.json();
  } catch { return null; }
}

const { width } = Dimensions.get('window');
const BW = Math.min(width - 32, 500);

const C = {
  blue:'#2463EB', blueL:'#DBEAFE', blueD:'#1A4AC4',
  navy:'#0A1628', navyM:'#0F2347', navyS:'#1A3A6B',
  bg:'#F4F8FF', bgD:'#E3EEFF',
  white:'#FFFFFF', txt:'#0A1628', txtM:'#1E3A6B', txtL:'#7A90B0',
  grn:'#2A8A45', grnL:'#EAF7EE', red:'#D03030', redL:'#FDEAEA',
  card:'#FFFFFF', divider:'#EEF3FF',
  amber:'#F59E0B', amberL:'#FEF3C7',
  teal:'#0891B2', tealL:'#E0F2FE',
};
const shadow = Platform.OS==='web'
  ? {boxShadow:'0 2px 12px rgba(36,99,235,0.09)'}
  : {shadowColor:'#2463EB',shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:8,elevation:3};
const cardStyle = Platform.OS==='web'
  ? {backgroundColor:'#FFFFFF',borderRadius:16,borderWidth:1,borderColor:'#EEF3FF',boxShadow:'0 2px 10px rgba(26,58,107,0.08)'}
  : {backgroundColor:'#FFFFFF',borderRadius:16,borderWidth:1,borderColor:'#EEF3FF',shadowColor:'#1A3A6B',shadowOffset:{width:0,height:2},shadowOpacity:0.07,shadowRadius:10,elevation:3};

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
  const [userPhone,     setUserPhone]     = useState('');
  const [userId,        setUserId]        = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userRole,      setUserRole]      = useState('user');

  const [apiDepts,   setApiDepts]   = useState(DEPTS);
  const [apiOffers,  setApiOffers]  = useState(OFFERS);
  const [apiDoctors, setApiDoctors] = useState(DOCTORS);
  const [apiBanners, setApiBanners] = useState(BANNERS);
  const [apiBranches,setApiBranches]= useState(BRANCHES_LIST);
  const [apiLoaded,  setApiLoaded]  = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const clearAuthState = () => {
    setLoggedIn(false); setUserName(''); setUserEmail(''); setUserPhone(''); setUserId(null); setEmailVerified(false); setUserRole('user');
  };

  const applyUser = (user) => {
    setLoggedIn(true);
    setUserName(user.name || '');
    setUserEmail(user.email || '');
    setUserPhone(user.phone || '');
    setUserId(user.id || null);
    setEmailVerified(user.emailVerified || false);
    setUserRole(user.role || 'user');
  };

  useEffect(() => {
    // Handle Replit OAuth callback — server redirects to /?replitAuth=1
    if (typeof window !== 'undefined' && window.location.search.includes('replitAuth=1')) {
      apiFetch('/auth/me').then(res => {
        if (res?.ok) applyUser(res.user);
        window.history.replaceState({}, '', window.location.pathname);
        setIsCheckingAuth(false);
      }).catch(() => setIsCheckingAuth(false));
      return;
    }

    // Proper startup auth check:
    // 1. Try /auth/me
    // 2. If fails (401/expired), try /auth/refresh FIRST
    // 3. If refresh succeeds, retry /auth/me
    // 4. Only clear auth state if refresh also fails
    const checkAuth = async () => {
      try {
        const meRes = await apiFetch('/auth/me');
        if (meRes?.ok) {
          applyUser(meRes.user);
        } else {
          // Try refresh before giving up
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
          if (refreshRes.ok) {
            const me2 = await apiFetch('/auth/me');
            if (me2?.ok) applyUser(me2.user);
          }
          // If refresh also failed — user stays logged out (already default state)
        }
      } catch(e) { /* network error — stay logged out */ }
      setIsCheckingAuth(false);
    };
    checkAuth();

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

  const handleLogin = (user) => { applyUser(user); };
  const handleLogout = async () => {
    await apiPost('/auth/logout', {});
    clearAuthState();
  };

  const go = (s, p=null) => { setScreen(s); setParam(p); };
  const goTab = (t) => { setScreen('tabs'); setTab(t); };

  const addToCart = (offer, qty, branch) =>
    setCart(c => [...c, { ...offer, qty, branch, cartId: Date.now() }]);
  const removeFromCart = (id) => setCart(c => c.filter(i => i.cartId !== id));
  const clearCart = () => setCart([]);

  if (isCheckingAuth) return <AuthLoadingScreen />;
  if (screen==='splash') return <Splash onDone={()=>go('tabs')} />;
  if (screen==='offerDetail') return <OfferDetail offer={param} onBack={()=>go('tabs')} onAdd={(o,q,b)=>{addToCart(o,q,b);goTab('cart');}} />;
  if (screen==='doctorDetail') return <DoctorDetail doctor={param} onBack={()=>go('tabs')} onBook={()=>goTab('booking')} />;
  if (screen==='login') return <LoginScreen onBack={()=>go('tabs')} onLogin={(u)=>{handleLogin(u);go('tabs');}} onRegister={()=>go('register')} onForgotPassword={()=>go('forgotPassword')} />;
  if (screen==='register') return <RegisterScreen onBack={()=>go('login')} onDone={(u)=>{handleLogin(u);go('tabs');}} />;
  if (screen==='forgotPassword') return <ForgotPasswordScreen onBack={()=>go('login')} />;
  if (screen==='allDoctors') return <AllDoctorsScreen onBack={()=>go('tabs')} onDoctor={d=>go('doctorDetail',d)} doctors={apiDoctors} />;
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
      {tab==='home'    && <HomeScreen    onOffer={o=>go('offerDetail',o)} onDoctor={d=>go('doctorDetail',d)} onBranches={()=>go('branches')} onOffers={()=>setTab('offers')} onDoctors={()=>go('allDoctors')} loggedIn={loggedIn} userName={userName} onLogin={()=>go('login')} depts={apiDepts} offers={apiOffers} doctors={apiDoctors} banners={apiBanners} />}
      {tab==='offers'  && <OffersScreen  onOffer={o=>go('offerDetail',o)} offers={apiOffers} />}
      {tab==='cart'    && <CartScreen    cart={cart} remove={removeFromCart} loggedIn={loggedIn} onLogin={()=>go('login')} clear={clearCart} />}
      {tab==='booking' && <BookingScreen loggedIn={loggedIn} onLogin={()=>go('login')} branches={apiBranches} userName={userName} userPhone={userPhone} userId={userId} />}
      {tab==='more'    && <MoreScreen    loggedIn={loggedIn} userName={userName} userEmail={userEmail} emailVerified={emailVerified} onLogin={()=>go('login')} onBranches={()=>go('branches')} onProfile={()=>go('profile')} onLogout={handleLogout} onBookings={()=>go('myBookings')} onBalance={()=>go('balance')} onInvoices={()=>go('invoices')} onServices={()=>go('services')} onNotifications={()=>go('notifications')} onGuide={()=>go('guide')} onAbout={()=>go('about')} onContact={()=>go('contact')} onPrivacy={()=>go('privacy')} />}
      <BottomNav tab={tab} setTab={setTab} badge={cart.length} />
    </View>
  );
}

const NAV_ICONS = {
  home:    'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  offers:  'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z',
  cart:    'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z',
  booking: 'M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z',
  more:    'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
};

function SvgIcon({iconKey, fill='#333', size=22}){
  const d = NAV_ICONS[iconKey] || NAV_ICONS.more;
  return React.createElement('svg', {
    width:size, height:size, viewBox:'0 0 24 24', fill,
    xmlns:'http://www.w3.org/2000/svg',
    style:{display:'block',flexShrink:0}
  }, React.createElement('path', {d}));
}

function BottomNav({tab,setTab,badge}){
  const items=[
    {k:'home',   l:'الرئيسية'},
    {k:'offers', l:'العروض'},
    {k:'cart',   l:'مشترياتي', b:badge},
    {k:'booking',l:'حجز موعد'},
    {k:'more',   l:'المزيد'},
  ];
  return (
    <View style={N.bar}>
      {items.map(it=>{
        const active=tab===it.k;
        return(
          <TouchableOpacity key={it.k} style={[N.btn,{position:'relative'}]} onPress={()=>setTab(it.k)}>
            {active&&<View style={N.activeIndicator}/>}
            <View style={[N.iconWrap, active&&N.iconWrapA]}>
              <View style={{position:'relative'}}>
                <SvgIcon iconKey={it.k} fill={active?C.blue:C.txtL} size={21}/>
                {it.b>0&&<View style={N.badge}><Text style={N.badgeTxt}>{it.b}</Text></View>}
              </View>
            </View>
            <Text style={[N.lbl, active&&N.lblA]}>{it.l}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const N=StyleSheet.create({
  bar:{flexDirection:'row',backgroundColor:C.white,borderTopWidth:1,borderTopColor:'#E3EEFF',height:68,paddingBottom:6,paddingTop:0,shadowColor:'#1A3A6B',shadowOffset:{width:0,height:-2},shadowOpacity:0.06,shadowRadius:8,elevation:10},
  btn:{flex:1,alignItems:'center',justifyContent:'center',gap:2,paddingTop:0},
  activeIndicator:{position:'absolute',top:0,left:'25%',right:'25%',height:3,backgroundColor:C.blue,borderBottomLeftRadius:3,borderBottomRightRadius:3},
  iconWrap:{width:44,height:32,borderRadius:16,alignItems:'center',justifyContent:'center'},
  iconWrapA:{backgroundColor:'rgba(36,99,235,0.1)'},
  lbl:{fontSize:9.5,fontWeight:'600',color:C.txtL},
  lblA:{color:C.blue,fontWeight:'700'},
  badge:{position:'absolute',top:-5,right:-10,backgroundColor:C.red,borderRadius:8,minWidth:17,height:17,alignItems:'center',justifyContent:'center',paddingHorizontal:3},
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

function HomeScreen({onOffer,onDoctor,onBranches,onOffers,onDoctors,loggedIn,userName,onLogin,depts:propDepts,offers:propOffers,doctors:propDoctors,banners:propBanners}){
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
  const discountPct = (o) => o.orig>o.price ? Math.round((1-o.price/o.orig)*100) : 0;
  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      {/* ── Header ── */}
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:11,backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.divider}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:9}}>
          <LinearGradient colors={['#0A1628','#1A4AC4']} style={{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:'rgba(36,99,235,0.3)'}}>
            <View style={{width:24,height:3,backgroundColor:'#60A5FA',borderRadius:2,marginBottom:3}}/>
            <Text style={{fontSize:7,fontWeight:'900',color:'white',letterSpacing:1}}>BASAFFAR</Text>
          </LinearGradient>
          <View>
            <Text style={{fontSize:15,fontWeight:'800',color:C.navy}}>مركز باصفار</Text>
            <Text style={{fontSize:9,color:C.txtL,letterSpacing:0.4}}>DR BASAFFAR CLINIC</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogin} activeOpacity={0.8}
          style={{flexDirection:'row',alignItems:'center',gap:7,backgroundColor:C.bg,paddingHorizontal:10,paddingVertical:6,borderRadius:22,borderWidth:1,borderColor:C.divider}}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{width:30,height:30,borderRadius:15,alignItems:'center',justifyContent:'center'}}>
            <Text style={{color:'white',fontWeight:'800',fontSize:12}}>{loggedIn?(userName[0]||'ب'):'ب'}</Text>
          </LinearGradient>
          <Text style={{fontSize:11,fontWeight:'600',color:C.navyM}}>{loggedIn?`أهلاً، ${userName.split(' ')[0]}`:'تسجيل الدخول'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{backgroundColor:C.bg}}>
        {/* ── Search ── */}
        <View style={{paddingHorizontal:16,paddingTop:14,paddingBottom:8}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:C.white,borderRadius:14,paddingHorizontal:14,paddingVertical:11,borderWidth:1,borderColor:C.divider,...shadow}}>
            <Text style={{fontSize:15,opacity:.5}}>🔍</Text>
            <TextInput placeholder="ابحث عن عروض، أطباء، خدمات..." placeholderTextColor={C.txtL} style={{flex:1,fontSize:12,color:C.txt}} textAlign="right"/>
          </View>
        </View>

        {/* ── Banner ── */}
        <View style={{marginHorizontal:16,marginBottom:16,borderRadius:22,overflow:'hidden',...shadow}}>
          <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e=>setBi(Math.round(e.nativeEvent.contentOffset.x/BW))}>
            {localBanners.map(b=>(
              b.image
                ? <View key={b.id} style={{width:BW,height:170,position:'relative'}}>
                    <Image source={{uri:b.image}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
                    <LinearGradient colors={['transparent','rgba(10,22,40,0.7)']} style={{position:'absolute',bottom:0,left:0,right:0,height:80}}/>
                    <Text style={{position:'absolute',bottom:16,right:16,color:'white',fontWeight:'800',fontSize:14}}>{b.title}</Text>
                  </View>
                : <LinearGradient key={b.id} colors={b.color||['#0A1628','#1A3A6B']} style={{width:BW,height:170,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                    <View style={{position:'absolute',width:200,height:200,borderRadius:100,borderWidth:1,borderColor:'rgba(96,165,250,0.1)',top:-60,right:-60}}/>
                    <View style={{backgroundColor:'rgba(36,99,235,0.18)',borderWidth:1,borderColor:'rgba(96,165,250,0.3)',borderRadius:12,paddingHorizontal:12,paddingVertical:4,marginBottom:10}}>
                      <Text style={{fontSize:10,color:'#93C5FD',fontWeight:'700'}}>{b.tag}</Text>
                    </View>
                    <Text style={{fontSize:24,fontWeight:'900',color:'white',marginBottom:5}}>{b.title}</Text>
                    <Text style={{fontSize:11,color:'rgba(255,255,255,0.65)'}}>{b.subtitle}</Text>
                  </LinearGradient>
            ))}
          </ScrollView>
          <View style={{flexDirection:'row',justifyContent:'center',gap:5,paddingVertical:9,backgroundColor:'rgba(10,22,40,0.85)'}}>
            {localBanners.map((_,i)=>(
              <TouchableOpacity key={i} onPress={()=>{ref.current?.scrollTo({x:i*BW,animated:true});setBi(i);}}>
                <View style={{width:bi===i?22:6,height:6,borderRadius:3,backgroundColor:bi===i?C.blue:'rgba(255,255,255,0.25)'}}/>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Departments ── */}
        <SH title="أقسام العيادة"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:16,gap:11}}>
          {localDepts.filter(d=>d.active!==false).map(d=>(
            <TouchableOpacity key={d.id} style={{width:130,borderRadius:18,overflow:'hidden',...shadow}}
              onPress={()=>d.dept==='branches'?onBranches():null} activeOpacity={0.88}>
              <LinearGradient colors={d.color} style={{width:130,height:155,position:'relative',justifyContent:'flex-end'}}>
                <Image source={{uri:d.image}} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="cover"/>
                <LinearGradient colors={['transparent','rgba(8,16,35,0.92)']} style={{position:'absolute',bottom:0,left:0,right:0,height:70}}/>
                <Text style={{fontSize:12.5,fontWeight:'800',color:'white',textAlign:'center',paddingBottom:12,paddingHorizontal:8,zIndex:2,letterSpacing:0.3}}>{d.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Offers ── */}
        <SH title="أفضل العروض" more="تصفح الكل" onMore={onOffers}/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:16,gap:12}}>
          {localOffers.slice(0,5).map(o=>{
            const disc = discountPct(o);
            return(
              <TouchableOpacity key={o.id} style={{width:162,...cardStyle,overflow:'hidden'}} onPress={()=>onOffer(o)} activeOpacity={0.87}>
                <View style={{height:105,position:'relative',overflow:'hidden'}}>
                  <LinearGradient colors={o.color||['#0A1628','#1A3A6B']} style={{position:'absolute',width:'100%',height:'100%',alignItems:'center',justifyContent:'center'}}>
                    {o.image?null:<Text style={{fontSize:34}}>{o.icon}</Text>}
                  </LinearGradient>
                  {o.image&&<Image source={{uri:o.image}} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="cover"/>}
                  <View style={{position:'absolute',top:8,right:8,backgroundColor:C.navy+'DD',borderRadius:8,paddingHorizontal:7,paddingVertical:2}}>
                    <Text style={{fontSize:9,fontWeight:'700',color:'#93C5FD'}}>{o.dept}</Text>
                  </View>
                  {disc>0&&<View style={{position:'absolute',top:8,left:8,backgroundColor:C.amber,borderRadius:8,paddingHorizontal:7,paddingVertical:2}}>
                    <Text style={{fontSize:9,fontWeight:'800',color:'white'}}>وفّر {disc}%</Text>
                  </View>}
                </View>
                <View style={{padding:10}}>
                  <Text style={{fontSize:11,fontWeight:'700',color:C.navy,lineHeight:16,marginBottom:6}} numberOfLines={2}>{o.name}</Text>
                  <View style={{flexDirection:'row',alignItems:'baseline',gap:4,marginBottom:4}}>
                    <Text style={{fontSize:14,fontWeight:'800',color:C.blueD}}>{o.price.toLocaleString()}</Text>
                    <Text style={{fontSize:9,color:C.txtL}}>ريال</Text>
                    {o.orig>o.price&&<Text style={{fontSize:10,color:C.txtL,textDecorationLine:'line-through'}}>{o.orig.toLocaleString()}</Text>}
                  </View>
                  <TouchableOpacity onPress={()=>onOffer(o)} style={{backgroundColor:C.blueL,borderRadius:8,paddingVertical:5,alignItems:'center'}}>
                    <Text style={{fontSize:10,fontWeight:'700',color:C.blueD}}>اشتري الآن</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Doctors ── */}
        <SH title="نخبة أطبائنا" more="عرض الكل" onMore={onDoctors}/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:16,gap:12}}>
          {localDoctors.map(d=>(
            <TouchableOpacity key={d.id} style={{width:148,...cardStyle,padding:14,alignItems:'center'}} onPress={()=>onDoctor(d)} activeOpacity={0.87}>
              {/* Circular Avatar */}
              <View style={{width:74,height:74,borderRadius:37,overflow:'hidden',marginBottom:10,borderWidth:2.5,borderColor:C.blueL}}>
                <LinearGradient colors={d.color||['#0A1628','#1A3A6B']} style={{position:'absolute',width:'100%',height:'100%',alignItems:'center',justifyContent:'center'}}>
                  {d.image?null:<Text style={{fontSize:34}}>{d.emoji||'👨‍⚕️'}</Text>}
                </LinearGradient>
                {d.image&&<Image source={{uri:d.image}} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="cover"/>}
              </View>
              <Text style={{fontSize:12,fontWeight:'800',color:C.navy,marginBottom:2,textAlign:'center'}} numberOfLines={1}>{d.name}</Text>
              <Text style={{fontSize:9.5,color:C.blue,marginBottom:8,fontWeight:'600',textAlign:'center'}} numberOfLines={1}>{d.spec}</Text>
              <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:10}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:2,backgroundColor:C.amberL,borderRadius:7,paddingHorizontal:7,paddingVertical:3}}>
                  <Text style={{fontSize:9,color:C.amber}}>★</Text>
                  <Text style={{fontSize:9,fontWeight:'700',color:'#92400E'}}>{d.rating}</Text>
                </View>
                <View style={{backgroundColor:C.bgD,borderRadius:7,paddingHorizontal:7,paddingVertical:3}}>
                  <Text style={{fontSize:9,color:C.txtM,fontWeight:'600'}}>{d.exp}س</Text>
                </View>
              </View>
              <TouchableOpacity onPress={()=>onDoctor(d)}
                style={{backgroundColor:C.blue,borderRadius:10,paddingVertical:7,paddingHorizontal:16,alignItems:'center',alignSelf:'stretch'}}>
                <Text style={{fontSize:10,fontWeight:'700',color:'white'}}>احجز موعد</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{height:24}}/>
      </ScrollView>
    </SafeAreaView>
  );
}
function SH({title,more,onMore}){
  return(
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingBottom:10,paddingTop:6}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:7}}>
        <View style={{width:3,height:16,backgroundColor:C.blue,borderRadius:2}}/>
        <Text style={{fontSize:15,fontWeight:'800',color:C.navy}}>{title}</Text>
      </View>
      {more&&(
        <TouchableOpacity onPress={onMore} activeOpacity={0.7} hitSlop={{top:8,bottom:8,left:8,right:8}}
          style={{flexDirection:'row',alignItems:'center',gap:3,backgroundColor:C.blueL,paddingHorizontal:10,paddingVertical:4,borderRadius:10}}>
          <Text style={{fontSize:11,fontWeight:'700',color:C.blueD}}>{more}</Text>
          <Text style={{fontSize:13,color:C.blueD}}>›</Text>
        </TouchableOpacity>
      )}
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingVertical:12,gap:8}}>
        {FILTERS.map(x=>(
          <TouchableOpacity key={x} onPress={()=>setF(x)}
            style={{paddingHorizontal:18,paddingVertical:9,borderRadius:22,borderWidth:1.5,
              borderColor:f===x?C.blue:C.bgD,
              backgroundColor:f===x?C.blue:C.white}}>
            <Text style={{fontSize:12,fontWeight:'700',color:f===x?'white':C.navy}}>{x}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={{paddingHorizontal:16,paddingTop:4}} showsVerticalScrollIndicator={false}>
        {list.map(o=>{
          const disc = o.orig>o.price ? Math.round((1-o.price/o.orig)*100) : 0;
          return(
            <TouchableOpacity key={o.id} style={{marginBottom:14,...cardStyle,overflow:'hidden'}} onPress={()=>onOffer(o)} activeOpacity={0.88}>
              <View style={{height:148,position:'relative',overflow:'hidden'}}>
                <LinearGradient colors={o.color||['#0A1628','#1A3A6B']} style={{position:'absolute',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',padding:20}}>
                  {!o.image&&<Text style={{fontSize:42,marginBottom:4}}>{o.icon}</Text>}
                  <Text style={{fontSize:14,fontWeight:'700',color:'white',textAlign:'center',lineHeight:21}}>{o.name}</Text>
                </LinearGradient>
                {o.image&&<Image source={{uri:o.image}} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="cover"/>}
                {o.image&&<LinearGradient colors={['transparent','rgba(10,22,40,0.72)']} style={{position:'absolute',bottom:0,left:0,right:0,height:70}}/>}
                {o.image&&<Text style={{position:'absolute',bottom:14,right:16,color:'white',fontWeight:'700',fontSize:13}}>{o.name}</Text>}
                <View style={{position:'absolute',top:10,right:10,backgroundColor:C.navy+'CC',borderRadius:8,paddingHorizontal:8,paddingVertical:3}}>
                  <Text style={{fontSize:10,fontWeight:'700',color:'#93C5FD'}}>{o.dept}</Text>
                </View>
                {disc>0&&<View style={{position:'absolute',top:10,left:10,backgroundColor:C.amber,borderRadius:8,paddingHorizontal:8,paddingVertical:3}}>
                  <Text style={{fontSize:10,fontWeight:'800',color:'white'}}>خصم {disc}%</Text>
                </View>}
              </View>
              <View style={{padding:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                <View>
                  <View style={{flexDirection:'row',alignItems:'baseline',gap:5}}>
                    <Text style={{fontSize:22,fontWeight:'900',color:C.blueD}}>{o.price.toLocaleString()}</Text>
                    <Text style={{fontSize:11,color:C.txtL,fontWeight:'600'}}>ريال</Text>
                    {o.orig>o.price&&<Text style={{fontSize:12,color:C.txtL,textDecorationLine:'line-through'}}>{o.orig.toLocaleString()}</Text>}
                  </View>
                  {disc>0&&<View style={{backgroundColor:C.amberL,borderRadius:6,paddingHorizontal:7,paddingVertical:2,alignSelf:'flex-start',marginTop:3}}>
                    <Text style={{fontSize:9,fontWeight:'700',color:'#92400E'}}>وفّر {(o.orig-o.price).toLocaleString()} ريال</Text>
                  </View>}
                </View>
                <TouchableOpacity style={{backgroundColor:C.blue,borderRadius:12,paddingHorizontal:18,paddingVertical:10}} onPress={()=>onOffer(o)}>
                  <Text style={{fontSize:12,fontWeight:'700',color:'white'}}>اشتري الآن</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
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
        <LinearGradient colors={o.color||['#0A1628','#1A3A6B']} style={{height:225,alignItems:'center',justifyContent:'center',padding:20,overflow:'hidden',position:'relative'}}>
          {o.image&&<Image source={{uri:o.image}} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="cover"/>}
          <View style={{position:'absolute',width:150,height:150,borderRadius:75,borderWidth:1,borderColor:'rgba(36,99,235,0.12)',top:-40,left:-40}}/>
          <Text style={{fontSize:20,fontWeight:'900',color:C.blue,marginBottom:6}}>
            {o.dept==='أسنان'?'عروض الأسنان':o.dept==='جلدية'?'عروض الجلدية':o.dept==='عيون'?'عروض العيون':'عروض التجميل'}
          </Text>
          <Text style={{fontSize:15,fontWeight:'600',color:'white',textAlign:'center',lineHeight:24}}>{o.name}</Text>
          {!o.image&&<Text style={{fontSize:42,marginTop:10}}>{o.icon}</Text>}
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

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

function BookingScreen({loggedIn,onLogin,branches:propBranches,userName,userPhone,userId}){
  const BK_BR = (propBranches||BRANCHES_LIST).map(b=>b.name);
  const [nm,setNm]=useState('');
  const [ph,setPh]=useState('');
  const [id,setId]=useState('');
  const [nt,setNt]=useState('');
  const [br,setBr]=useState(-1);
  const [of,setOf]=useState(-1);
  const [slot,setSlot]=useState(-1);
  useEffect(()=>{
    if(loggedIn){
      if(userName) setNm(userName);
      if(userPhone) setPh(userPhone);
    }
  },[loggedIn,userName,userPhone]);
  const confirm=async()=>{
    if(!nm.trim()){webAlert('تنبيه','يرجى إدخال الاسم');return;}
    if(!ph.trim()){webAlert('تنبيه','يرجى إدخال رقم الهاتف');return;}
    if(br<0){webAlert('تنبيه','يرجى اختيار الفرع');return;}
    const brName = BK_BR[br] || BRANCH_NAMES[br] || '—';
    const slotTime = slot>=0 ? TIME_SLOTS[slot] : '—';
    const bookingData = { name:nm, phone:ph, idNum:id, note:nt, branch:brName, offer:OFFER_LIST[of]||'—', userId, time:slotTime };
    const result = await apiPost('/bookings', bookingData);
    if(!result?.ok){webAlert('خطأ','تعذّر إرسال الحجز، يرجى المحاولة مرة أخرى.');return;}
    const code = result?.booking?.code || ('BK-'+Math.floor(Math.random()*9000+1000));
    webAlert('تم الحجز بنجاح! 🎉',`رقم حجزك: ${code}\nالفرع: ${brName}${slotTime!=='—'?'\nالوقت: '+slotTime:''}\nسيتم التواصل معك للتأكيد.`,[
      {text:'حسناً',onPress:()=>{setNm(userName||'');setPh(userPhone||'');setId('');setNt('');setBr(-1);setOf(-1);setSlot(-1);}},
    ]);
  };
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <View style={{backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.divider,paddingVertical:14,alignItems:'center'}}>
        <Text style={{fontSize:17,fontWeight:'800',color:C.navy}}>حجز موعد</Text>
        <Text style={{fontSize:10,color:C.txtL,marginTop:2}}>احجز موعدك في دقيقتين</Text>
      </View>
      <ScrollView contentContainerStyle={{padding:16}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Personal Info Card */}
        <View style={{...cardStyle,padding:16,marginBottom:14}}>
          <Text style={{fontSize:13,fontWeight:'800',color:C.navy,marginBottom:14,textAlign:'right'}}>البيانات الشخصية</Text>
          <FL>الاسم بالكامل *</FL>
          <View style={B.inputWrap}>
            <Text style={B.inputIcon}>👤</Text>
            <TextInput style={B.inp} placeholder="أدخل اسمك الكامل" value={nm} onChangeText={setNm} textAlign="right" placeholderTextColor={C.txtL}/>
          </View>
          <FL>رقم الهاتف *</FL>
          <View style={B.inputWrap}>
            <Text style={B.inputIcon}>📞</Text>
            <TextInput style={B.inp} placeholder="05xxxxxxxx" keyboardType="phone-pad" value={ph} onChangeText={setPh} textAlign="right" placeholderTextColor={C.txtL}/>
          </View>
          <FL>رقم الهوية (اختياري)</FL>
          <View style={B.inputWrap}>
            <Text style={B.inputIcon}>🪪</Text>
            <TextInput style={B.inp} placeholder="١٠ أرقام" keyboardType="number-pad" value={id} onChangeText={setId} textAlign="right" placeholderTextColor={C.txtL}/>
          </View>
        </View>

        {/* Branch Card */}
        <View style={{...cardStyle,padding:16,marginBottom:14}}>
          <Text style={{fontSize:13,fontWeight:'800',color:C.navy,marginBottom:12,textAlign:'right'}}>اختر الفرع *</Text>
          {BK_BR.map((b,i)=>(
            <TouchableOpacity key={i} onPress={()=>setBr(i)} style={[B.opt,br===i&&B.optA]}>
              <Text>📍</Text><Text style={[B.optT,br===i&&{color:C.blueD,fontWeight:'700'}]}>{b}</Text>
              <View style={{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:br===i?C.blue:C.bgD,backgroundColor:br===i?C.blue:'transparent',alignItems:'center',justifyContent:'center'}}>
                {br===i&&<Text style={{color:'white',fontSize:11,lineHeight:13}}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Time Slots Card */}
        <View style={{...cardStyle,padding:16,marginBottom:14}}>
          <Text style={{fontSize:13,fontWeight:'800',color:C.navy,marginBottom:4,textAlign:'right'}}>الأوقات المتاحة</Text>
          <Text style={{fontSize:10,color:C.txtL,marginBottom:12,textAlign:'right'}}>اختر الوقت المناسب لك</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'flex-end'}}>
            {TIME_SLOTS.map((t,i)=>(
              <TouchableOpacity key={i} onPress={()=>setSlot(i)}
                style={{paddingHorizontal:14,paddingVertical:8,borderRadius:10,borderWidth:1.5,
                  borderColor:slot===i?C.blue:C.divider,
                  backgroundColor:slot===i?C.blueL:C.white}}>
                <Text style={{fontSize:12,fontWeight:'700',color:slot===i?C.blueD:C.txtM}}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Service Card */}
        <View style={{...cardStyle,padding:16,marginBottom:14}}>
          <Text style={{fontSize:13,fontWeight:'800',color:C.navy,marginBottom:12,textAlign:'right'}}>اختر الخدمة</Text>
          {OFFER_LIST.map((o,i)=>(
            <TouchableOpacity key={i} onPress={()=>setOf(i)} style={[B.opt,of===i&&B.optA]}>
              <Text>🎁</Text><Text style={[B.optT,of===i&&{color:C.blueD,fontWeight:'700'}]}>{o}</Text>
              <View style={{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:of===i?C.blue:C.bgD,backgroundColor:of===i?C.blue:'transparent',alignItems:'center',justifyContent:'center'}}>
                {of===i&&<Text style={{color:'white',fontSize:11,lineHeight:13}}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <View style={{...cardStyle,padding:16,marginBottom:14}}>
          <Text style={{fontSize:13,fontWeight:'800',color:C.navy,marginBottom:12,textAlign:'right'}}>ملاحظات (اختياري)</Text>
          <TextInput style={[B.inp,{height:80,textAlignVertical:'top',flex:1}]} placeholder="أي ملاحظات أو متطلبات خاصة..." multiline value={nt} onChangeText={setNt} textAlign="right" placeholderTextColor={C.txtL}/>
        </View>

        <TouchableOpacity onPress={confirm} activeOpacity={0.85} style={{marginTop:4}}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:16,padding:16,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:10}}>
            <Text style={{fontSize:16,fontWeight:'800',color:'white'}}>تأكيد الحجز</Text>
            <Text style={{fontSize:16,color:'white'}}>✓</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{height:30}}/>
      </ScrollView>
    </SafeAreaView>
  );
}
function FL({children}){return <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:6,marginTop:10}}>{children}</Text>;}
const B=StyleSheet.create({
  inputWrap:{flexDirection:'row',alignItems:'center',backgroundColor:C.bg,borderRadius:11,borderWidth:1,borderColor:C.divider,marginBottom:2,paddingHorizontal:10},
  inputIcon:{fontSize:14,paddingRight:4,opacity:0.7},
  inp:{flex:1,padding:11,fontSize:13,color:C.txt},
  opt:{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:11,borderWidth:1,borderColor:C.divider,backgroundColor:C.bg,marginBottom:7},
  optA:{borderColor:C.blue,backgroundColor:C.blueL},
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
    {svg:'user',    l:'البيانات الشخصية',s:'تعديل معلوماتك',p:onProfile},
    {svg:'calendar',l:'حجوزاتي',s:'عرض المواعيد',p:onBookings},
    {svg:'wallet',  l:'رصيدي',s:'0 ريال',p:onBalance},
    {svg:'receipt', l:'فواتيري',p:onInvoices},
    {svg:'mappin',  l:'فروعنا',s:'3 فروع',p:onBranches},
    {svg:'heart',   l:'خدماتنا',p:onServices},
    {svg:'bell',    l:'الإشعارات',p:onNotifications},
    {svg:'book',    l:'إرشادات الاستخدام',p:onGuide},
    {svg:'info',    l:'معلومات عنّا',p:onAbout},
    {svg:'chat',    l:'تواصل معنا',p:onContact},
    {svg:'lock',    l:'سياسة الخصوصية',p:onPrivacy},
  ];
  const ROW_COLORS = ['#3B82F6','#10B981','#F59E0B','#6366F1','#EF4444','#8B5CF6','#F97316','#06B6D4','#EC4899','#0EA5E9','#84CC16'];
  const MORE_SVG = {
    user:     'M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z',
    calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z',
    wallet:   'M21 7H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 12H3V9h18v10zm-9-1c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM1 5h20v2H1z',
    receipt:  'M18 0H6L4 2v18l2 2 2-2 2 2 2-2 2 2 2-2 2 2 2-2V2L18 0zM16 14H8v-2h8v2zm0-4H8V8h8v2z',
    mappin:   'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    heart:    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    bell:     'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    book:     'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
    info:     'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
    chat:     'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z',
    lock:     'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
    globe:    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  };
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      {/* ── Profile Header ── */}
      <View style={{backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.divider}}>
        <View style={{padding:20,alignItems:'center'}}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{width:70,height:70,borderRadius:35,alignItems:'center',justifyContent:'center',marginBottom:12,borderWidth:3,borderColor:C.blueL}}>
            <Text style={{color:'white',fontSize:26,fontWeight:'800'}}>{loggedIn?(userName[0]||'ب'):'ب'}</Text>
          </LinearGradient>
          <Text style={{fontSize:17,fontWeight:'800',color:C.navy,marginBottom:3}}>{loggedIn?userName:'مرحباً بك'}</Text>
          <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
            <Text style={{fontSize:11,color:C.txtL}}>{loggedIn?'عميل مسجل':'غير مسجل'}</Text>
            {loggedIn&&(emailVerified
              ? <View style={{backgroundColor:C.grnL,borderRadius:8,paddingHorizontal:7,paddingVertical:2}}><Text style={{fontSize:9,color:C.grn,fontWeight:'700'}}>✓ موثّق</Text></View>
              : <View style={{backgroundColor:C.redL,borderRadius:8,paddingHorizontal:7,paddingVertical:2}}><Text style={{fontSize:9,color:C.red,fontWeight:'700'}}>⚠ غير موثّق</Text></View>
            )}
          </View>
          {!loggedIn&&(
            <TouchableOpacity onPress={onLogin} style={{marginTop:12,backgroundColor:C.blue,borderRadius:12,paddingHorizontal:24,paddingVertical:10}}>
              <Text style={{fontSize:13,fontWeight:'700',color:'white'}}>تسجيل الدخول</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Email verification warning */}
        {loggedIn&&!emailVerified&&(
          <View style={{backgroundColor:'#FFFBEB',borderBottomWidth:1,borderBottomColor:'#FDE68A',padding:14}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'}}>
              <TouchableOpacity onPress={resendSent?null:resendVerification} disabled={resending}
                style={{backgroundColor:'#FEF3C7',borderRadius:8,paddingHorizontal:10,paddingVertical:5,borderWidth:1,borderColor:'#FDE68A'}}>
                <Text style={{fontSize:11,color:'#92400E',fontWeight:'700'}}>{resendSent?'تم الإرسال ✓':resending?'جارٍ...':'إعادة الإرسال'}</Text>
              </TouchableOpacity>
              <View style={{flex:1,marginRight:10}}>
                <Text style={{fontSize:12,fontWeight:'700',color:'#92400E',textAlign:'right'}}>⚠️ البريد الإلكتروني غير موثّق</Text>
                <Text style={{fontSize:11,color:'#B45309',textAlign:'right',marginTop:2}}>تحقق من بريدك لتفعيل حسابك.</Text>
              </View>
            </View>
          </View>
        )}
        {/* Settings rows */}
        <View style={{backgroundColor:C.white,marginTop:10,borderTopWidth:1,borderTopColor:C.divider}}>
          {rows.map((r,i)=>{
            const ic=ROW_COLORS[i]||C.blue;
            const svgPath=MORE_SVG[r.svg]||MORE_SVG.info;
            return(
            <TouchableOpacity key={i} onPress={r.p} activeOpacity={r.p?0.7:1}
              style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.divider}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                {r.b&&<View style={{backgroundColor:C.red,borderRadius:8,paddingHorizontal:6,paddingVertical:2}}><Text style={{fontSize:9,fontWeight:'700',color:'white'}}>{r.b}</Text></View>}
                <Text style={{fontSize:14,color:C.txtL}}>›</Text>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
                <View>
                  <Text style={{fontSize:13,fontWeight:'600',color:C.navy,textAlign:'right'}}>{r.l}</Text>
                  {r.s&&<Text style={{fontSize:10,color:C.txtL,marginTop:1,textAlign:'right'}}>{r.s}</Text>}
                </View>
                <View style={{width:42,height:42,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:ic+'1A'}}>
                  {React.createElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 24 24',width:20,height:20,fill:ic},
                    React.createElement('path',{d:svgPath})
                  )}
                </View>
              </View>
            </TouchableOpacity>
            );
          })}
          {/* Language row */}
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.divider}}>
            <View style={{flexDirection:'row',backgroundColor:C.bgD,borderRadius:10,padding:2,gap:2}}>
              {['ar','en'].map(x=>(
                <TouchableOpacity key={x} onPress={()=>setLang(x)} style={{paddingHorizontal:14,paddingVertical:5,borderRadius:8,backgroundColor:lang===x?C.white:undefined}}>
                  <Text style={{fontSize:11,fontWeight:'700',color:lang===x?C.blueD:C.txtL}}>{x==='ar'?'عربي':'EN'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
              <Text style={{fontSize:13,fontWeight:'600',color:C.navy}}>اللغة</Text>
              <View style={{width:42,height:42,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:'#06B6D41A'}}>
                {React.createElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 24 24',width:20,height:20,fill:'#06B6D4'},
                  React.createElement('path',{d:MORE_SVG.globe})
                )}
              </View>
            </View>
          </View>
        </View>
        {loggedIn&&(
          <TouchableOpacity onPress={()=>webAlert('تسجيل الخروج','هل تريد الخروج؟',[{text:'إلغاء',style:'cancel'},{text:'خروج',style:'destructive',onPress:onLogout}])}
            style={{margin:16,padding:15,borderRadius:14,backgroundColor:C.redL,borderWidth:1,borderColor:'#FECACA',alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8}}>
            <Text style={{fontSize:18}}>👋</Text>
            <Text style={{fontSize:13,fontWeight:'700',color:C.red}}>تسجيل الخروج</Text>
          </TouchableOpacity>
        )}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function AllDoctorsScreen({onBack,onDoctor,doctors:propDoctors}){
  const list=propDoctors||DOCTORS;
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="نخبة أطبائنا" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        {list.map(d=>(
          <TouchableOpacity key={d.id} onPress={()=>onDoctor(d)} activeOpacity={0.87}
            style={{...cardStyle,flexDirection:'row',alignItems:'center',marginBottom:12,padding:14}}>
            {/* Circular Avatar */}
            <View style={{width:70,height:70,borderRadius:35,overflow:'hidden',marginLeft:12,flexShrink:0,borderWidth:2.5,borderColor:C.blueL}}>
              <LinearGradient colors={d.color||['#0A1628','#1A3A6B']} style={{position:'absolute',width:'100%',height:'100%',alignItems:'center',justifyContent:'center'}}>
                {d.image?null:<Text style={{fontSize:30}}>{d.emoji}</Text>}
              </LinearGradient>
              {d.image&&<Image source={{uri:d.image}} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="cover"/>}
            </View>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,fontWeight:'800',color:C.navy,marginBottom:3,textAlign:'right'}}>{d.name}</Text>
              <Text style={{fontSize:11,color:C.blue,marginBottom:8,textAlign:'right',fontWeight:'600'}}>{d.spec}</Text>
              <View style={{flexDirection:'row',gap:7,justifyContent:'flex-end',alignItems:'center',marginBottom:10}}>
                <View style={{backgroundColor:C.bgD,borderRadius:7,paddingHorizontal:8,paddingVertical:3}}>
                  <Text style={{fontSize:10,color:C.txtM,fontWeight:'600'}}>{d.exp} سنة خبرة</Text>
                </View>
                <View style={{flexDirection:'row',alignItems:'center',gap:3,backgroundColor:C.amberL,borderRadius:7,paddingHorizontal:8,paddingVertical:3}}>
                  <Text style={{fontSize:11,color:C.amber}}>★</Text>
                  <Text style={{fontSize:10,fontWeight:'700',color:'#92400E'}}>{d.rating}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={()=>onDoctor(d)}
                style={{backgroundColor:C.blue,borderRadius:10,paddingVertical:7,alignItems:'center'}}>
                <Text style={{fontSize:11,fontWeight:'700',color:'white'}}>احجز موعد</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

function DoctorDetail({doctor:d,onBack,onBook}){
  const AVAIL_SLOTS = ['09:00','10:00','11:00','13:00','14:00','15:00','17:00','18:00'];
  const [selSlot, setSelSlot] = useState(-1);
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="تفاصيل الطبيب" onBack={onBack}/>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Doctor hero */}
        <View style={{backgroundColor:C.white,padding:20,alignItems:'center',borderBottomWidth:1,borderBottomColor:C.divider}}>
          <View style={{width:100,height:100,borderRadius:50,overflow:'hidden',marginBottom:14,borderWidth:3,borderColor:C.blueL}}>
            <LinearGradient colors={d.color||['#0A1628','#1A3A6B']} style={{position:'absolute',width:'100%',height:'100%',alignItems:'center',justifyContent:'center'}}>
              {d.image?null:<Text style={{fontSize:52}}>{d.emoji}</Text>}
            </LinearGradient>
            {d.image&&<Image source={{uri:d.image}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>}
          </View>
          <Text style={{fontSize:19,fontWeight:'800',color:C.navy,marginBottom:4}}>{d.name}</Text>
          <View style={{backgroundColor:C.blueL,borderRadius:10,paddingHorizontal:12,paddingVertical:4,marginBottom:10}}>
            <Text style={{fontSize:11,color:C.blueD,fontWeight:'700'}}>{d.spec}</Text>
          </View>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
            {[...Array(5)].map((_,i)=>(
              <Text key={i} style={{fontSize:14,color:i<Math.floor(d.rating)?C.amber:'#D1D5DB'}}>★</Text>
            ))}
            <Text style={{fontSize:12,fontWeight:'700',color:C.navy,marginRight:4}}>{d.rating}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{...cardStyle,flexDirection:'row',marginHorizontal:16,marginTop:14,overflow:'hidden'}}>
          {[{n:`${d.exp}`, u:'سنة', l:'خبرة', bg:C.blueL, cl:C.blueD},
            {n:`${(d.patients/1000).toFixed(1)}K`, u:'', l:'مريض', bg:C.grnL, cl:C.grn},
            {n:`${d.rating}`, u:'', l:'تقييم', bg:C.amberL, cl:C.amber}
          ].map((s,i)=>(
            <View key={i} style={{flex:1,padding:14,alignItems:'center',borderLeftWidth:i<2?1:0,borderLeftColor:C.divider,backgroundColor:s.bg+'66'}}>
              <Text style={{fontSize:18,fontWeight:'900',color:s.cl}}>{s.n}<Text style={{fontSize:10,color:s.cl}}>{s.u}</Text></Text>
              <Text style={{fontSize:10,color:C.txtL,marginTop:2}}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={{paddingHorizontal:16,paddingTop:14}}>
          {/* About */}
          <View style={{...cardStyle,padding:16,marginBottom:14}}>
            <Text style={{fontSize:13,fontWeight:'800',color:C.navy,marginBottom:10,textAlign:'right'}}>عن الطبيب</Text>
            <Text style={{fontSize:12,color:C.txtM,lineHeight:22,textAlign:'right'}}>{d.bio}</Text>
          </View>

          {/* Available Slots */}
          <View style={{...cardStyle,padding:16,marginBottom:14}}>
            <Text style={{fontSize:13,fontWeight:'800',color:C.navy,marginBottom:4,textAlign:'right'}}>المواعيد المتاحة</Text>
            <Text style={{fontSize:10,color:C.txtL,marginBottom:12,textAlign:'right'}}>اختر الوقت المناسب</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'flex-end'}}>
              {AVAIL_SLOTS.map((t,i)=>(
                <TouchableOpacity key={i} onPress={()=>setSelSlot(i)}
                  style={{paddingHorizontal:13,paddingVertical:7,borderRadius:10,borderWidth:1.5,
                    borderColor:selSlot===i?C.blue:C.divider,
                    backgroundColor:selSlot===i?C.blueL:C.bg}}>
                  <Text style={{fontSize:12,fontWeight:'700',color:selSlot===i?C.blueD:C.txtM}}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Branches */}
          <View style={{...cardStyle,padding:16,marginBottom:20}}>
            <Text style={{fontSize:13,fontWeight:'800',color:C.navy,marginBottom:10,textAlign:'right'}}>الفروع المتاحة</Text>
            <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
              {d.branches.map((b,i)=>(
                <View key={i} style={{backgroundColor:C.blueL,borderRadius:10,paddingHorizontal:12,paddingVertical:6,borderWidth:1,borderColor:C.bgD}}>
                  <Text style={{fontSize:11,color:C.blueD,fontWeight:'700'}}>📍 {b}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity onPress={onBook} activeOpacity={0.85}>
            <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:16,padding:16,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:10}}>
              <Text style={{fontSize:15,fontWeight:'800',color:'white'}}>احجز موعد</Text>
              <Text style={{color:'white',fontSize:16}}>←</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={{height:24}}/>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CaptchaField({captcha,onRefresh,value,onChange}){
  return(
    <View style={{marginBottom:14,width:'100%'}}>
      <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:6,textAlign:'right'}}>التحقق من الهوية</Text>
      <View style={{flexDirection:'row',gap:8,marginBottom:8,alignItems:'center'}}>
        <TouchableOpacity onPress={onRefresh} style={{padding:8,backgroundColor:C.bgD,borderRadius:10}}>
          <Text style={{fontSize:15}}>🔄</Text>
        </TouchableOpacity>
        <View style={{flex:1,backgroundColor:C.navy,padding:12,borderRadius:12,alignItems:'center',justifyContent:'center',minHeight:44}}>
          <Text style={{color:'white',fontWeight:'800',fontSize:15,letterSpacing:1}}>{captcha?.question||'جارٍ التحميل...'}</Text>
        </View>
      </View>
      <TextInput
        style={{backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:10,padding:11,fontSize:13,color:C.txt}}
        placeholder="أدخل الجواب هنا"
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        textAlign="right"
        placeholderTextColor={C.txtL}
      />
    </View>
  );
}

function AuthLoadingScreen(){
  return(
    <View style={{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'}}>
      <LinearGradient colors={['#0A1628','#0F2347']} style={{width:88,height:88,borderRadius:24,alignItems:'center',justifyContent:'center',marginBottom:20,borderWidth:2,borderColor:'rgba(36,99,235,0.4)'}}>
        <View style={{width:50,height:3,backgroundColor:C.blue,borderRadius:2,marginBottom:4}}/>
        <Text style={{fontSize:10,fontWeight:'900',color:'white',letterSpacing:1.2}}>DR BASAFFAR</Text>
      </LinearGradient>
      <Text style={{fontSize:13,color:C.txtL,marginTop:8}}>جارٍ التحقق من الجلسة...</Text>
    </View>
  );
}

// ─── helpers shared by login & register ──────────────────────────────────────
const isSaudiPhoneFE = (s) => /^(05\d{8}|(\+966|00966|966)5\d{8})$/.test((s||'').replace(/[\s\-()]/g,''));
const isEmailFE      = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s||'');

function LoginScreen({onBack, onLogin, onRegister, onForgotPassword}){
  const [identifier,setIdentifier]=useState('');
  const [password,  setPassword]  =useState('');
  const [showPw,    setShowPw]    =useState(false);
  const [loading,   setLoading]   =useState(false);
  const [err,       setErr]       =useState('');
  const [unverified,setUnverified]=useState(false);

  const validateId=(val)=>{
    const v=(val||'').trim();
    if(!v) return 'يرجى إدخال البريد الإلكتروني أو رقم الجوال';
    if(isSaudiPhoneFE(v)||isEmailFE(v)) return null;
    if(/^\d/.test(v)) return 'يرجى إدخال رقم جوال سعودي صحيح (05XXXXXXXX)';
    return 'يرجى إدخال بريد إلكتروني صحيح أو رقم جوال سعودي';
  };

  const login=async()=>{
    setErr(''); setUnverified(false);
    const idErr=validateId(identifier);
    if(idErr){setErr(idErr);return;}
    if(!password){setErr('يرجى إدخال كلمة المرور');return;}
    setLoading(true);
    const res=await apiPost('/auth/login',{identifier:identifier.trim(),password});
    setLoading(false);
    if(res?.ok){
      onLogin(res.user);
    } else if(res?.code==='EMAIL_NOT_VERIFIED'){
      setUnverified(true);
      setErr(res.msg||'البريد الإلكتروني غير مفعّل. تحقق من بريدك.');
    } else {
      setErr(res?.msg||'حدث خطأ، حاول مرة أخرى');
    }
  };

  const resendVerification=async()=>{
    if(!isEmailFE(identifier.trim())){setErr('أدخل البريد الإلكتروني لإعادة الإرسال');return;}
    const res=await apiPost('/auth/resend-verification',{email:identifier.trim()});
    if(res?.ok) setErr('تم إرسال رابط التفعيل إلى بريدك ✅');
    else setErr(res?.msg||'حدث خطأ، حاول لاحقاً');
  };

  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="تسجيل الدخول" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:24,alignItems:'center'}} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#0A1628','#0F2347']} style={{width:88,height:88,borderRadius:24,alignItems:'center',justifyContent:'center',marginBottom:20,borderWidth:2,borderColor:'rgba(36,99,235,0.4)'}}>
          <View style={{width:50,height:3,backgroundColor:C.blue,borderRadius:2,marginBottom:4}}/>
          <Text style={{fontSize:10,fontWeight:'900',color:'white',letterSpacing:1.2}}>DR BASAFFAR</Text>
        </LinearGradient>
        <Text style={{fontSize:22,fontWeight:'800',color:C.navy,marginBottom:6}}>مرحباً بك</Text>
        <Text style={{fontSize:12,color:C.txtL,marginBottom:28,textAlign:'center'}}>سجّل دخولك للوصول إلى حسابك</Text>

        {err?(
          <View style={{width:'100%',backgroundColor:C.redL,borderRadius:10,padding:10,marginBottom:14}}>
            <Text style={{fontSize:12,color:C.red,textAlign:'right'}}>{err}</Text>
            {unverified&&isEmailFE(identifier.trim())&&(
              <TouchableOpacity onPress={resendVerification} style={{marginTop:8}}>
                <Text style={{fontSize:12,color:C.blue,fontWeight:'700',textAlign:'right'}}>إعادة إرسال رابط التفعيل</Text>
              </TouchableOpacity>
            )}
          </View>
        ):null}

        <View style={{width:'100%',marginBottom:14}}>
          <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>البريد الإلكتروني أو رقم الجوال</Text>
          <TextInput
            style={{backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:12,padding:12,fontSize:13,color:C.txt}}
            placeholder="example@email.com  أو  05XXXXXXXX"
            value={identifier}
            onChangeText={v=>{setIdentifier(v);setErr('');setUnverified(false);}}
            keyboardType="email-address"
            textAlign="right"
            placeholderTextColor={C.txtL}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={{width:'100%',marginBottom:8}}>
          <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>كلمة المرور</Text>
          <View style={{flexDirection:'row',alignItems:'center',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:12,paddingHorizontal:10}}>
            <TouchableOpacity onPress={()=>setShowPw(p=>!p)} style={{padding:6}}>
              <Text style={{fontSize:16,color:C.txtL}}>{showPw?'🙈':'👁️'}</Text>
            </TouchableOpacity>
            <TextInput
              style={{flex:1,padding:12,fontSize:13,color:C.txt}}
              placeholder="كلمة المرور"
              value={password}
              onChangeText={v=>{setPassword(v);setErr('');}}
              secureTextEntry={!showPw}
              textAlign="right"
              placeholderTextColor={C.txtL}
            />
          </View>
        </View>

        <TouchableOpacity onPress={onForgotPassword} style={{alignSelf:'flex-end',marginBottom:24}}>
          <Text style={{fontSize:12,color:C.blue,fontWeight:'600'}}>نسيت كلمة المرور؟</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{width:'100%',marginBottom:14}} onPress={login} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={loading?['#6B86AA','#4A6090']:[C.blue,C.blueD]} style={{borderRadius:14,padding:15,alignItems:'center'}}>
            <Text style={{fontSize:15,fontWeight:'700',color:'white'}}>{loading?'جارٍ الدخول...':'تسجيل الدخول'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:4}}>
          <TouchableOpacity onPress={onRegister}>
            <Text style={{fontSize:13,color:C.blue,fontWeight:'700'}}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
          <Text style={{fontSize:13,color:C.txtL}}>ليس لديك حساب؟</Text>
        </View>

        <Text style={{fontSize:10,color:C.txtL,marginTop:24,textAlign:'center',lineHeight:16}}>
          بالمتابعة، أنت توافق على سياسة الخصوصية وشروط الاستخدام
        </Text>
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

  const [captcha,setCaptcha]=useState(null);
  const [captchaAns,setCaptchaAns]=useState('');
  useEffect(()=>{ loadCaptcha(); },[]);
  const loadCaptcha=async()=>{ setCaptchaAns(''); const c=await fetchCaptcha(); setCaptcha(c); };

  const reg=async()=>{
    setErr('');
    if(!v.name.trim()){setErr('يرجى إدخال الاسم الكامل');return;}
    if(!v.email.trim()||!isEmailFE(v.email.trim())){setErr('يرجى إدخال بريد إلكتروني صحيح');return;}
    if(!v.phone.trim()){setErr('يرجى إدخال رقم الجوال');return;}
    if(!isSaudiPhoneFE(v.phone.trim())){setErr('يرجى إدخال رقم جوال سعودي صحيح (05XXXXXXXX)');return;}
    const pwErr=validatePassword(v.pass);
    if(pwErr){setErr(pwErr);return;}
    if(v.pass!==v.pass2){setErr('كلمتا المرور غير متطابقتين');return;}
    setLoading(true);
    const res = await apiPost('/auth/register', { name:v.name.trim(), email:v.email.trim(), phone:v.phone.trim(), password:v.pass, age:v.age, idNum:v.id, captchaId:captcha?.id, captchaAnswer:captchaAns });
    setLoading(false);
    if (res?.ok) {
      onDone(res.user);
    } else {
      setErr(res?.msg || 'حدث خطأ، حاول مرة أخرى');
      if(res?.msg?.includes('التحقق')) loadCaptcha();
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
          {k:'phone',lbl:'رقم الجوال السعودي *',     kb:'phone-pad',     sc:false,ph:'05XXXXXXXX'},
          {k:'age',  lbl:'العمر',                  kb:'number-pad',    sc:false},
          {k:'id',   lbl:'رقم الهوية أو الإقامة', kb:'number-pad',    sc:false},
        ].map((f,i)=>(
          <View key={i} style={{marginBottom:12}}>
            <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>{f.lbl}</Text>
            <TextInput style={{backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:10,padding:11,fontSize:13,color:C.txt}} placeholder={f.ph||f.lbl.replace(' *','')} value={v[f.k]} onChangeText={val=>{s(f.k)(val);setErr('');}} keyboardType={f.kb} secureTextEntry={f.sc} textAlign="right" placeholderTextColor={C.txtL} autoCapitalize={f.cap||'words'}/>
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

        <CaptchaField captcha={captcha} onRefresh={loadCaptcha} value={captchaAns} onChange={val=>{setCaptchaAns(val);setErr('');}}/>

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
  const [captcha,setCaptcha]=useState(null);
  const [captchaAns,setCaptchaAns]=useState('');

  useEffect(()=>{ loadCaptcha(); },[]);
  const loadCaptcha=async()=>{ setCaptchaAns(''); const c=await fetchCaptcha(); setCaptcha(c); };

  const send=async()=>{
    setErr('');
    const emailRx=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!email.trim()||!emailRx.test(email.trim())){setErr('يرجى إدخال بريد إلكتروني صحيح');return;}
    setLoading(true);
    const res=await apiPost('/auth/forgot-password',{email:email.trim(),captchaId:captcha?.id,captchaAnswer:captchaAns});
    setLoading(false);
    if(res?.ok) setSent(true);
    else{ setErr(res?.msg||'حدث خطأ، حاول لاحقاً'); if(res?.msg?.includes('التحقق')) loadCaptcha(); }
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
            <View style={{width:'100%',marginBottom:16}}>
              <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>البريد الإلكتروني</Text>
              <TextInput style={{width:'100%',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:12,padding:12,fontSize:13,color:C.txt}} placeholder="example@email.com" value={email} onChangeText={v=>{setEmail(v);setErr('');}} keyboardType="email-address" textAlign="right" placeholderTextColor={C.txtL} autoCapitalize="none"/>
            </View>
            <CaptchaField captcha={captcha} onRefresh={loadCaptcha} value={captchaAns} onChange={v=>{setCaptchaAns(v);setErr('');}}/>
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
  const [sessions,setSessions]=useState([]);
  const [sessionsLoading,setSessionsLoading]=useState(false);
  const [logoutAllLoading,setLogoutAllLoading]=useState(false);
  const [revoking,setRevoking]=useState(null);

  useEffect(()=>{
    apiFetch('/auth/me').then(res=>{
      if(res?.ok) {
        const u=res.user;
        setV(p=>({...p,name:u.name||'',email:u.email||'',phone:u.phone||'',age:u.age||'',nat:u.nationality||'',id:u.idNum||''}));
      }
      setLoading(false);
    });
    loadSessions();
  },[]);

  const loadSessions=async()=>{
    setSessionsLoading(true);
    const res=await apiFetch('/auth/sessions');
    if(res?.ok) setSessions(res.sessions||[]);
    setSessionsLoading(false);
  };

  const revokeSession=async(id)=>{
    setRevoking(id);
    await apiDelete('/auth/sessions/'+id);
    setSessions(s=>s.filter(x=>x.id!==id));
    setRevoking(null);
  };

  const logoutAll=async()=>{
    setLogoutAllLoading(true);
    await apiPost('/auth/logout-all',{});
    setLogoutAllLoading(false);
    onBack();
  };

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

  const fmtDate=(iso)=>{
    if(!iso) return '';
    const d=new Date(iso);
    return d.toLocaleString('ar-SA',{dateStyle:'short',timeStyle:'short'});
  };
  const shortUA=(ua='')=>{
    if(!ua) return 'جهاز غير معروف';
    if(/mobile/i.test(ua)) return '📱 ' + (ua.match(/\(([^)]+)\)/)?.[1]||'هاتف').slice(0,30);
    return '💻 ' + ua.slice(0,40);
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

        <View style={{backgroundColor:C.white,borderRadius:16,padding:16,marginBottom:16,borderWidth:1,borderColor:C.bgD}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <TouchableOpacity onPress={loadSessions} style={{padding:4}}>
              <Text style={{fontSize:14}}>🔄</Text>
            </TouchableOpacity>
            <Text style={{fontSize:13,fontWeight:'700',color:C.navy}}>🖥️ الجلسات النشطة</Text>
          </View>
          {sessionsLoading?(
            <Text style={{textAlign:'center',color:C.txtL,fontSize:12}}>جارٍ التحميل...</Text>
          ):(
            sessions.length===0?
              <Text style={{textAlign:'center',color:C.txtL,fontSize:12,padding:8}}>لا توجد جلسات نشطة</Text>
            :sessions.map(s=>(
              <View key={s.id} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:C.bg,borderRadius:10,padding:10,marginBottom:8}}>
                <TouchableOpacity onPress={()=>revokeSession(s.id)} disabled={revoking===s.id} style={{backgroundColor:C.redL,borderRadius:8,paddingHorizontal:10,paddingVertical:5}}>
                  <Text style={{fontSize:11,color:C.red,fontWeight:'700'}}>{revoking===s.id?'...':'قطع'}</Text>
                </TouchableOpacity>
                <View style={{alignItems:'flex-end',flex:1,marginRight:8}}>
                  <Text style={{fontSize:12,color:C.navy,fontWeight:'600',textAlign:'right'}}>{shortUA(s.userAgent)}</Text>
                  <Text style={{fontSize:10,color:C.txtL,marginTop:2}}>{s.ip} · {fmtDate(s.lastUsedAt)}</Text>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity onPress={()=>webAlert('تسجيل الخروج','سيتم تسجيل الخروج من جميع الأجهزة. هل أنت متأكد؟',[{text:'إلغاء',style:'cancel'},{text:'تسجيل الخروج من الكل',style:'destructive',onPress:logoutAll}])}
            disabled={logoutAllLoading} style={{marginTop:8,padding:11,borderRadius:10,backgroundColor:C.redL,borderWidth:1,borderColor:'rgba(208,48,48,0.15)',alignItems:'center'}}>
            <Text style={{fontSize:12,fontWeight:'700',color:C.red}}>{logoutAllLoading?'جارٍ الخروج...':'🔴 تسجيل الخروج من جميع الأجهزة'}</Text>
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
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.divider,backgroundColor:C.white}}>
      <TouchableOpacity onPress={onBack} style={{width:36,height:36,borderRadius:18,backgroundColor:C.bg,borderWidth:1,borderColor:C.divider,alignItems:'center',justifyContent:'center'}}>
        <Text style={{fontSize:20,color:C.navy,lineHeight:24}}>‹</Text>
      </TouchableOpacity>
      <Text style={{fontSize:15,fontWeight:'800',color:C.navy}}>{title}</Text>
      <View style={{width:36}}/>
    </View>
  );
}
function PH({title}){
  return(
    <View style={{paddingVertical:15,borderBottomWidth:1,borderBottomColor:C.divider,backgroundColor:C.white}}>
      <Text style={{textAlign:'center',fontSize:17,fontWeight:'800',color:C.navy}}>{title}</Text>
    </View>
  );
}
