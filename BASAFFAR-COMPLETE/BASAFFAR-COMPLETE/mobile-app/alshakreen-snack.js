import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Dimensions, Animated, Alert, StatusBar,
  SafeAreaView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ═══════════════════════════════════════
//  API CONFIG — غيّر IP جهازك هنا
// ═══════════════════════════════════════
// عند التشغيل على جوالك عبر Expo Go:
// استبدل localhost بـ IP جهازك مثل: http://192.168.1.5:3000/api
const API_URL = 'http://localhost:3000/api';

async function apiFetch(path) {
  try {
    const res = await fetch(API_URL + path, { headers: { 'Content-Type': 'application/json' } });
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (e) {
    console.warn('[API POST]', path, e.message);
    return null;
  }
}



const { width } = Dimensions.get('window');
const BW = width - 32;

const C = {
  blue:'#2463EB', blueL:'#DBEAFE', blueD:'#1A4AC4',
  navy:'#0A1628', navyM:'#0F2347', navyS:'#1A3A6B',
  bg:'#F0F6FF', bgD:'#DBEAFE',
  white:'#FFFFFF', txt:'#0A1628', txtM:'#1E3A6B', txtL:'#6B86AA',
  grn:'#2A8A45', grnL:'#EAF7EE', red:'#D03030', redL:'#FDEAEA',
};

// ── DATA ──────────────────────────────────
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
const OFFER_LIST   = ['زراعة الأسنان + الزيركون','ليزر إزالة الشعر','تصحيح النظر LASIK','حقن البوتوكس','تبييض الأسنان','فيلر الشفاه'];

// ── ROOT ──────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('splash');
  const [param,  setParam]  = useState(null);
  const [tab,    setTab]    = useState('home');
  const [cart,   setCart]   = useState([]);
  const [loggedIn,  setLoggedIn]  = useState(false);
  const [userName,  setUserName]  = useState('');

  // ── Live data from API ──
  const [apiDepts,   setApiDepts]   = useState(DEPTS);
  const [apiOffers,  setApiOffers]  = useState(OFFERS);
  const [apiDoctors, setApiDoctors] = useState(DOCTORS);
  const [apiBanners, setApiBanners] = useState(BANNERS);
  const [apiBranches,setApiBranches]= useState(BRANCHES_LIST);
  const [apiLoaded,  setApiLoaded]  = useState(false);

  useEffect(() => {
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

  const go = (s, p=null) => { setScreen(s); setParam(p); };
  const goTab = (t) => { setScreen('tabs'); setTab(t); };

  const addToCart = (offer, qty, branch) =>
    setCart(c => [...c, { ...offer, qty, branch, cartId: Date.now() }]);
  const removeFromCart = (id) => setCart(c => c.filter(i => i.cartId !== id));
  const clearCart = () => setCart([]);

  if (screen==='splash') return <Splash onDone={()=>go('tabs')} />;
  if (screen==='offerDetail') return <OfferDetail offer={param} onBack={()=>go('tabs')} onAdd={(o,q,b)=>{addToCart(o,q,b);goTab('cart');}} />;
  if (screen==='doctorDetail') return <DoctorDetail doctor={param} onBack={()=>go('tabs')} onBook={()=>goTab('booking')} />;
  if (screen==='login') return <LoginScreen onBack={()=>go('tabs')} onLogin={(n)=>{setLoggedIn(true);setUserName(n);go('tabs');}} onRegister={()=>go('register')} />;
  if (screen==='register') return <RegisterScreen onBack={()=>go('login')} onDone={(n)=>{setLoggedIn(true);setUserName(n);go('tabs');}} />;
  if (screen==='branches') return <BranchesScreen onBack={()=>go('tabs')} branches={apiBranches} />;
  if (screen==='profile') return <ProfileScreen onBack={()=>go('tabs')} userName={userName} />;

  return (
    <View style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg}/>
      {tab==='home'    && <HomeScreen    onOffer={o=>go('offerDetail',o)} onDoctor={d=>go('doctorDetail',d)} onBranches={()=>go('branches')} loggedIn={loggedIn} userName={userName} onLogin={()=>go('login')} depts={apiDepts} offers={apiOffers} doctors={apiDoctors} banners={apiBanners} />}
      {tab==='offers'  && <OffersScreen  onOffer={o=>go('offerDetail',o)} offers={apiOffers} />}
      {tab==='cart'    && <CartScreen    cart={cart} remove={removeFromCart} loggedIn={loggedIn} onLogin={()=>go('login')} clear={clearCart} />}
      {tab==='booking' && <BookingScreen loggedIn={loggedIn} onLogin={()=>go('login')} branches={apiBranches} />}
      {tab==='more'    && <MoreScreen    loggedIn={loggedIn} userName={userName} onLogin={()=>go('login')} onBranches={()=>go('branches')} onProfile={()=>go('profile')} onLogout={()=>{setLoggedIn(false);setUserName('');}} />}
      <BottomNav tab={tab} setTab={setTab} badge={cart.length} />
    </View>
  );
}

// ── BOTTOM NAV ───────────────────────────
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

// ── SPLASH ───────────────────────────────
function Splash({onDone}){
  const sc=useRef(new Animated.Value(0.5)).current;
  const fa=useRef(new Animated.Value(0)).current;
  const fb=useRef(new Animated.Value(0)).current;
  const pu=useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    Animated.sequence([
      Animated.parallel([
        Animated.spring(sc,{toValue:1,tension:55,friction:8,useNativeDriver:true}),
        Animated.timing(fa,{toValue:1,duration:800,useNativeDriver:true}),
      ]),
      Animated.timing(fb,{toValue:1,duration:500,delay:100,useNativeDriver:true}),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pu,{toValue:1.08,duration:1000,useNativeDriver:true}),
      Animated.timing(pu,{toValue:1,duration:1000,useNativeDriver:true}),
    ])).start();
  },[]);
  return (
    <LinearGradient colors={['#0A1628','#06101E','#0F2347']} style={{flex:1,alignItems:'center',justifyContent:'center'}}>
      <Animated.View style={{opacity:fa,transform:[{scale:sc}],alignItems:'center'}}>
        <Animated.View style={{transform:[{scale:pu}],marginBottom:24}}>
          <LinearGradient colors={['#0A1628','#0F2347']} style={{width:120,height:120,borderRadius:30,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'rgba(36,99,235,0.4)',elevation:12,gap:4}}>
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

// ── HOME ─────────────────────────────────
function HomeScreen({onOffer,onDoctor,onBranches,loggedIn,userName,onLogin,depts:propDepts,offers:propOffers,doctors:propDoctors,banners:propBanners}){
  const localDepts   = propDepts   || DEPTS;
  const localOffers  = propOffers  || OFFERS;
  const localDoctors = propDoctors || DOCTORS;
  const localBanners = propBanners || BANNERS;
  const [bi,setBi]=useState(0);
  const ref=useRef(null);
  useEffect(()=>{
    const t=setInterval(()=>{
      setBi(p=>{const n=(p+1)%BANNERS.length; ref.current?.scrollTo({x:n*BW,animated:true}); return n;});
    },3200);
    return ()=>clearInterval(t);
  },[]);
  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      {/* Topbar */}
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
        {/* Search */}
        <View style={{padding:12}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:24,paddingHorizontal:14,paddingVertical:10}}>
            <Text style={{fontSize:14,opacity:.4}}>🔍</Text>
            <TextInput placeholder="ابحث عن عروض، أطباء، خدمات..." placeholderTextColor={C.txtL} style={{flex:1,fontSize:12,color:C.txt}} textAlign="right"/>
          </View>
        </View>

        {/* Banner */}
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
            {BANNERS.map((_,i)=>(
              <TouchableOpacity key={i} onPress={()=>{ref.current?.scrollTo({x:i*BW,animated:true});setBi(i);}}
                style={{width:bi===i?14:6,height:6,borderRadius:3,backgroundColor:bi===i?C.blue:'rgba(255,255,255,0.3)'}}/>
            ))}
          </LinearGradient>
        </View>

        {/* Departments */}
        <SH title="أقسام العيادة"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:14,gap:12}}>
          {localDepts.filter(d=>d.active!==false).map(d=>(
            <TouchableOpacity key={d.id} style={{width:140,borderRadius:18,overflow:'hidden',elevation:4,shadowColor:'#000',shadowOffset:{width:0,height:3},shadowOpacity:0.15,shadowRadius:8}}
              onPress={()=>d.dept==='branches'?onBranches():null} activeOpacity={0.88}>
              <LinearGradient colors={d.color} style={{width:140,height:165,position:'relative',justifyContent:'flex-end'}}>
                <Image source={{uri:d.image}} style={{position:'absolute',width:'100%',height:'100%'}} resizeMode="cover"/>
                <LinearGradient colors={['transparent','rgba(10,22,40,0.88)']} style={{position:'absolute',bottom:0,left:0,right:0,height:75}}/>
                <Text style={{fontSize:13,fontWeight:'800',color:'white',textAlign:'center',paddingBottom:12,paddingHorizontal:8,zIndex:2}}>{d.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Offers */}
        <SH title="أفضل العروض" more="تصفح الكل"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:14,gap:12}}>
          {localOffers.slice(0,5).map(o=>(
            <TouchableOpacity key={o.id} style={{width:158,borderRadius:16,overflow:'hidden',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,elevation:2}} onPress={()=>onOffer(o)} activeOpacity={0.87}>
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

        {/* Doctors */}
        <SH title="نخبة أطبائنا" more="عرض الكل"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:16,gap:12}}>
          {localDoctors.map(d=>(
            <TouchableOpacity key={d.id} style={{width:128,borderRadius:16,overflow:'hidden',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,elevation:2}} onPress={()=>onDoctor(d)} activeOpacity={0.87}>
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

// ── OFFERS SCREEN ────────────────────────
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
          <TouchableOpacity key={o.id} style={{marginBottom:14,borderRadius:20,overflow:'hidden',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,elevation:3}} onPress={()=>onOffer(o)} activeOpacity={0.88}>
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
              <TouchableOpacity style={{backgroundColor:C.blue,borderRadius:12,paddingHorizontal:18,paddingVertical:10,elevation:3}} onPress={()=>onOffer(o)}>
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

// ── OFFER DETAIL ─────────────────────────
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
            <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:14,padding:16,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,elevation:5}}>
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

// ── CART ─────────────────────────────────
function CartScreen({cart,remove,loggedIn,onLogin,clear}){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const checkout=()=>{
    Alert.alert('تأكيد الشراء',`الإجمالي: ${total.toLocaleString()} ريال\nهل تريد إتمام الشراء؟`,[
      {text:'إلغاء',style:'cancel'},
      {text:'تأكيد',onPress:()=>{clear();Alert.alert('تم الشراء ✓','تم تأكيد طلبك! سيتم التواصل معك قريباً.',[{text:'حسناً'}]);}},
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
          <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:14,paddingHorizontal:32,paddingVertical:12,elevation:4}}>
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
          <View key={item.cartId} style={{backgroundColor:C.white,borderRadius:14,marginBottom:12,borderWidth:1,borderColor:C.bgD,overflow:'hidden',elevation:1}}>
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
        <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:14,padding:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4,elevation:4}}>
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

// ── BOOKING ──────────────────────────────
function BookingScreen({loggedIn,onLogin,branches:propBranches}){
  const BK_BRANCHES = (propBranches||BRANCHES_LIST).map(b=>b.name);
  const [nm,setNm]=useState('');
  const [ph,setPh]=useState('');
  const [id,setId]=useState('');
  const [nt,setNt]=useState('');
  const [br,setBr]=useState(-1);
  const [of,setOf]=useState(-1);
  const confirm=async()=>{
    if(!nm.trim()){Alert.alert('تنبيه','يرجى إدخال الاسم');return;}
    if(!ph.trim()){Alert.alert('تنبيه','يرجى إدخال رقم الهاتف');return;}
    if(br<0){Alert.alert('تنبيه','يرجى اختيار الفرع');return;}
    const brName = BK_BRANCHES[br] || BRANCH_NAMES[br] || '—';
    const bookingData = { name:nm, phone:ph, idNum:id, note:nt, branch:brName, offer:OFFER_LIST[of]||'—' };
    const result = await apiPost('/bookings', bookingData);
    const code = result?.booking?.code || ('BK-'+Math.floor(Math.random()*9000+1000));
    Alert.alert('تم الحجز بنجاح! 🎉',`رقم حجزك: ${code}\nالفرع: ${brName}\nسيتم التواصل معك للتأكيد.`,[
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
          <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:14,padding:15,alignItems:'center',elevation:4}}>
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

// ── MORE ─────────────────────────────────
function MoreScreen({loggedIn,userName,onLogin,onBranches,onProfile,onLogout}){
  const [lang,setLang]=useState('ar');
  const rows=[
    {i:'👤',l:'البيانات الشخصية',s:'تعديل معلوماتك',p:onProfile},
    {i:'📋',l:'حجوزاتي',s:'عرض المواعيد',b:'2'},
    {i:'💰',l:'رصيدي',s:'0 ريال'},
    {i:'🧾',l:'فواتيري'},
    {i:'📍',l:'فروعنا',s:'3 فروع',p:onBranches},
    {i:'⚕️',l:'خدماتنا'},
    {i:'🔔',l:'الإشعارات',b:'3'},
    {i:'📖',l:'إرشادات الاستخدام'},
    {i:'ℹ️',l:'معلومات عنّا'},
    {i:'💬',l:'تواصل معنا'},
    {i:'🔒',l:'سياسة الخصوصية'},
  ];
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <LinearGradient colors={[C.navy,C.navyM]} style={{padding:20,flexDirection:'row',alignItems:'center',gap:14}}>
        <LinearGradient colors={[C.blue,C.blueD]} style={{width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'rgba(36,99,235,0.4)'}}>
          <Text style={{color:'white',fontSize:22,fontWeight:'700'}}>{loggedIn?(userName[0]||'ب'):'ب'}</Text>
        </LinearGradient>
        <View style={{flex:1}}>
          <Text style={{fontSize:15,fontWeight:'700',color:'white',marginBottom:2}}>{loggedIn?userName:'مرحباً بك'}</Text>
          <Text style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{loggedIn?'عميل مسجل':'غير مسجل'}</Text>
        </View>
        {!loggedIn&&(
          <TouchableOpacity onPress={onLogin} style={{backgroundColor:C.blue,borderRadius:10,paddingHorizontal:14,paddingVertical:7}}>
            <Text style={{fontSize:12,fontWeight:'700',color:'white'}}>تسجيل الدخول</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
      <ScrollView showsVerticalScrollIndicator={false}>
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
        {/* Language */}
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
          <TouchableOpacity onPress={()=>Alert.alert('تسجيل الخروج','هل تريد الخروج؟',[{text:'إلغاء',style:'cancel'},{text:'خروج',style:'destructive',onPress:onLogout}])}
            style={{margin:16,padding:14,borderRadius:12,backgroundColor:C.redL,borderWidth:1,borderColor:'rgba(208,48,48,0.15)',alignItems:'center'}}>
            <Text style={{fontSize:13,fontWeight:'700',color:C.red}}>تسجيل الخروج 👋</Text>
          </TouchableOpacity>
        )}
        <View style={{height:20}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── DOCTOR DETAIL ────────────────────────
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
            <LinearGradient colors={[C.navy,C.navyM]} style={{borderRadius:14,padding:15,alignItems:'center',elevation:4}}>
              <Text style={{fontSize:14,fontWeight:'700',color:C.blue}}>احجز موعد مع الطبيب ←</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── LOGIN ────────────────────────────────
function LoginScreen({onBack,onLogin,onRegister}){
  const [em,setEm]=useState('');
  const [pw,setPw]=useState('');
  const login=async()=>{
    if(!em.trim()){Alert.alert('تنبيه','يرجى إدخال البريد أو الجوال');return;}
    if(!pw.trim()){Alert.alert('تنبيه','يرجى إدخال كلمة المرور');return;}
    const res = await apiPost('/auth/login', { email:em, password:pw });
    if (res?.ok) {
      onLogin(res.user?.name || em.split('@')[0] || em);
    } else {
      // Fallback: allow login even if server offline
      onLogin(em.split('@')[0]||em);
    }
  };
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="تسجيل الدخول" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:24,alignItems:'center'}} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={['#0A1628','#0F2347']} style={{width:80,height:80,borderRadius:22,alignItems:'center',justifyContent:'center',marginBottom:16,elevation:8,gap:5,borderWidth:2,borderColor:'rgba(36,99,235,0.4)'}}>
          <View style={{width:52,height:3,backgroundColor:C.blue,borderRadius:2}}/>
          <Text style={{fontSize:10,fontWeight:'900',color:'white',letterSpacing:1}}>DR BASAFFAR</Text>
        </LinearGradient>
        <Text style={{fontSize:20,fontWeight:'700',color:C.navy,marginBottom:4}}>مرحباً بك 👋</Text>
        <Text style={{fontSize:12,color:C.txtL,marginBottom:28}}>سجّل دخولك للمتابعة</Text>
        {[{lbl:'البريد الإلكتروني أو رقم الجوال',v:em,s:setEm,kb:'email-address',sc:false},{lbl:'كلمة المرور',v:pw,s:setPw,kb:'default',sc:true}].map((f,i)=>(
          <View key={i} style={{width:'100%',marginBottom:12}}>
            <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>{f.lbl}</Text>
            <TextInput style={{width:'100%',backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:12,padding:12,fontSize:13,color:C.txt}} placeholder={f.lbl} value={f.v} onChangeText={f.s} keyboardType={f.kb} secureTextEntry={f.sc} textAlign="right" placeholderTextColor={C.txtL}/>
          </View>
        ))}
        <TouchableOpacity style={{alignSelf:'flex-start',marginBottom:22}}><Text style={{fontSize:11,color:C.blue,fontWeight:'600'}}>نسيت كلمة المرور؟</Text></TouchableOpacity>
        <TouchableOpacity style={{width:'100%'}} onPress={login} activeOpacity={0.85}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:14,padding:14,alignItems:'center',width:'100%',elevation:5}}>
            <Text style={{fontSize:15,fontWeight:'700',color:'white'}}>تسجيل الدخول</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRegister} style={{marginTop:20}}>
          <Text style={{fontSize:12,color:C.txtL}}>ليس لديك حساب؟ <Text style={{color:C.blue,fontWeight:'700'}}>أنشئ حساباً</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── REGISTER ─────────────────────────────
function RegisterScreen({onBack,onDone}){
  const [v,setV]=useState({name:'',email:'',phone:'',age:'',id:'',pass:'',pass2:''});
  const s=(k)=>(val)=>setV(p=>({...p,[k]:val}));
  const fields=[
    {k:'name', lbl:'الاسم الكامل *',             kb:'default',      sc:false},
    {k:'email',lbl:'البريد الإلكتروني *',         kb:'email-address',sc:false},
    {k:'phone',lbl:'رقم الهاتف *',                kb:'phone-pad',    sc:false},
    {k:'age',  lbl:'العمر',                       kb:'number-pad',   sc:false},
    {k:'id',   lbl:'رقم الهوية أو الإقامة',      kb:'number-pad',   sc:false},
    {k:'pass', lbl:'كلمة المرور *',               kb:'default',      sc:true },
    {k:'pass2',lbl:'تأكيد كلمة المرور *',         kb:'default',      sc:true },
  ];
  const reg=async()=>{
    if(!v.name.trim()){Alert.alert('تنبيه','يرجى إدخال الاسم');return;}
    if(!v.email.trim()){Alert.alert('تنبيه','يرجى إدخال البريد');return;}
    if(!v.phone.trim()){Alert.alert('تنبيه','يرجى إدخال الهاتف');return;}
    if(!v.pass.trim()){Alert.alert('تنبيه','يرجى إدخال كلمة المرور');return;}
    if(v.pass!==v.pass2){Alert.alert('تنبيه','كلمتا المرور غير متطابقتين');return;}
    const res = await apiPost('/auth/register', { name:v.name, email:v.email, phone:v.phone, password:v.pass, age:v.age, idNum:v.id });
    if (res && !res.ok) {
      Alert.alert('تنبيه', res.msg || 'حدث خطأ'); return;
    }
    onDone(v.name);
  };
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="إنشاء حساب جديد" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:20}} keyboardShouldPersistTaps="handled">
        {fields.map((f,i)=>(
          <View key={i} style={{marginBottom:12}}>
            <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>{f.lbl}</Text>
            <TextInput style={{backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:10,padding:11,fontSize:13,color:C.txt}} placeholder={f.lbl.replace(' *','')} value={v[f.k]} onChangeText={s(f.k)} keyboardType={f.kb} secureTextEntry={f.sc} textAlign="right" placeholderTextColor={C.txtL}/>
          </View>
        ))}
        <TouchableOpacity onPress={reg} activeOpacity={0.85} style={{marginTop:10}}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:14,padding:14,alignItems:'center',elevation:5}}>
            <Text style={{fontSize:15,fontWeight:'700',color:'white'}}>إنشاء الحساب</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{height:30}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── BRANCHES ─────────────────────────────
function BranchesScreen({onBack,branches:propBranches}){
  const brData = propBranches || BRANCHES_LIST;
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="فروعنا 📍" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:16}}>
        {brData.map(b=>(
          <View key={b.id} style={{backgroundColor:C.white,borderRadius:16,marginBottom:14,overflow:'hidden',borderWidth:1,borderColor:C.bgD,elevation:2}}>
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

// ── PROFILE ──────────────────────────────
function ProfileScreen({onBack,userName}){
  const [v,setV]=useState({name:userName||'د. حسالم باصفار',email:'info@basaffar.com',phone:'+966501234567',age:'32',nat:'سعودي',id:'1012345678'});
  const s=(k)=>(val)=>setV(p=>({...p,[k]:val}));
  const fields=[{k:'name',lbl:'الاسم الكامل'},{k:'email',lbl:'البريد الإلكتروني',kb:'email-address'},{k:'phone',lbl:'رقم الجوال',kb:'phone-pad'},{k:'age',lbl:'العمر',kb:'number-pad'},{k:'nat',lbl:'الجنسية'},{k:'id',lbl:'رقم الهوية',kb:'number-pad'}];
  return(
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <BB title="البيانات الشخصية" onBack={onBack}/>
      <ScrollView contentContainerStyle={{padding:20}} keyboardShouldPersistTaps="handled">
        {fields.map((f,i)=>(
          <View key={i} style={{marginBottom:12}}>
            <Text style={{fontSize:11,fontWeight:'700',color:C.txtM,marginBottom:5,textAlign:'right'}}>{f.lbl}</Text>
            <TextInput style={{backgroundColor:C.white,borderWidth:1,borderColor:C.bgD,borderRadius:10,padding:11,fontSize:13,color:C.txt}} value={v[f.k]} onChangeText={s(f.k)} keyboardType={f.kb||'default'} textAlign="right" placeholderTextColor={C.txtL}/>
          </View>
        ))}
        <TouchableOpacity activeOpacity={0.85} style={{marginTop:12}}
          onPress={()=>Alert.alert('تم الحفظ ✓','تم تحديث بياناتك بنجاح',[{text:'حسناً'}])}>
          <LinearGradient colors={[C.blue,C.blueD]} style={{borderRadius:14,padding:14,alignItems:'center',elevation:5}}>
            <Text style={{fontSize:15,fontWeight:'700',color:'white'}}>💾 حفظ التعديلات</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{height:30}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── SHARED ───────────────────────────────
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
