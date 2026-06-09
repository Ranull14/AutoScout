import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ── Palette & Typography ──────────────────────────────────────────────────────
const C = {
  bg:"#07111e", s1:"#0c1829", s2:"#0b1728", s3:"#060e1a",
  bdr:"#162035", bdrHi:"#1e3050",
  blue:"#38bdf8",  blueLo:"rgba(56,189,248,0.12)",  blueMid:"rgba(56,189,248,0.20)",
  amber:"#f59e0b", amberLo:"rgba(245,158,11,0.12)",
  green:"#34d399", greenLo:"rgba(52,211,153,0.12)",
  red:"#f87171",   redLo:"rgba(248,113,113,0.12)",
  t1:"#f0f6ff", t2:"#c8d6e8", t3:"#8aabcc", t4:"#4a6080", t5:"#3d5270", t6:"#273850",
};
const TC  = { gas:C.amber,  hybrid:C.green, ev:C.blue };
const TBg = { gas:C.amberLo, hybrid:C.greenLo, ev:C.blueLo };
const TL  = { gas:"⛽ GAS", hybrid:"🔋 HYBRID", ev:"⚡ ELECTRIC" };
const MONO    = "'IBM Plex Mono', monospace";
const COND    = "'Barlow Condensed', sans-serif";
const BODY    = "'Barlow', sans-serif";

function useFonts() {
  useEffect(() => {
    if (document.getElementById("as-gf")) return;
    const l = document.createElement("link"); l.id="as-gf"; l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;900&family=Barlow:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
  }, []);
}

function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

// ── Car Library Data ──────────────────────────────────────────────────────────
// eff: L/100km (gas/hybrid) or kWh/100km (ev) | keep5: % value retained after 5yr
const LIBRARY = [
  // ── Your Shortlist ─────────────────────────────────────────────────────────
  { id:"tundra",  name:"Toyota Tundra 1794",        year:"2025",        type:"gas",    seg:"Truck",         msrp:76000,  eff:13.8, fuel:"regular", ins:2400, maint:1400, keep5:55, stars:4.5, range:null,
    pros:["Best towing capacity (10,000 lbs)","Hybrid-assist standard","Strong 5yr resale"],    cons:["Highest fuel cost on list","Large parking footprint"] },
  { id:"bmw330",  name:"BMW 330i",                   year:"2020 (Used)", type:"gas",    seg:"Luxury Sedan",  msrp:35500,  eff:8.1,  fuel:"premium", ins:2800, maint:1800, keep5:40, stars:3.8, range:null, usedMarket:true,
    pros:["Outstanding driving dynamics","Turbocharged — efficient on highway"],                cons:["Higher maintenance costs","Premium fuel required"] },
  { id:"gti",     name:"VW Golf GTI",                year:"2022 (Used)", type:"gas",    seg:"Hatchback",     msrp:30500,  eff:8.4,  fuel:"premium", ins:2300, maint:1200, keep5:55, stars:4.0, range:null, usedMarket:true,
    pros:["Fun-to-drive hot hatch","Practical 5-door","Strong used value"],                     cons:["Premium fuel required","Sport-car insurance rates"] },
  { id:"kia",     name:"Kia K4 GT-Line",             year:"2025",        type:"gas",    seg:"Compact",       msrp:29995,  eff:7.8,  fuel:"regular", ins:2000, maint:900,  keep5:50, stars:4.5, range:null,
    pros:["Lowest MSRP on the list","Low running costs","10yr / 200k km warranty"],             cons:["Newer model — limited long-term data"] },
  { id:"ct5",     name:"Cadillac CT5",               year:"2023 (Used)", type:"gas",    seg:"Luxury Sedan",  msrp:45000,  eff:9.5,  fuel:"premium", ins:3000, maint:1800, keep5:40, stars:3.5, range:null, usedMarket:true,
    pros:["Spacious luxury cabin","Strong V6 performance"],                                     cons:["High depreciation","Limited rural ON service"] },
  { id:"prius",   name:"Toyota Prius AWD",           year:"2025",        type:"hybrid", seg:"Hybrid Sedan",  msrp:46790,  eff:5.2,  fuel:"regular", ins:2200, maint:900,  keep5:60, stars:4.8, range:null,
    pros:["Lowest fuel cost (gas group)","Best 5yr resale on list","Top reliability"],          cons:["Less engaging to drive","Hybrid battery ~yr 10–12"] },
  { id:"modely",  name:"Tesla Model Y AWD",          year:"2026",        type:"ev",     seg:"EV SUV",        msrp:62990,  eff:18.5, fuel:null,      ins:3600, maint:600,  keep5:45, stars:3.8, range:500,
    pros:["Largest Supercharger network in Canada","5+2 seating option","OTA updates"],        cons:["Quality inconsistency reports","Higher insurance"] },
  { id:"model3",  name:"Tesla Model 3 LR AWD",       year:"2026",        type:"ev",     seg:"EV Sedan",      msrp:64990,  eff:14.8, fuel:null,      ins:3300, maint:550,  keep5:45, stars:3.9, range:620,
    pros:["Longest range (620 km)","Most efficient EV here","Strong performance"],              cons:["Sedan body only","Build quality variable"] },
  { id:"polstr3", name:"Polestar 3",                 year:"2026",        type:"ev",     seg:"EV Luxury",     msrp:107800, eff:22.0, fuel:null,      ins:5200, maint:800,  keep5:35, stars:3.5, range:475,
    pros:["Distinctive Scandinavian design","Premium interior","Harman Kardon standard"],       cons:["$107,800 — most expensive by far","Fast depreciation","Few ON service centres"] },
  { id:"bz",      name:"Toyota bZ XLE AWD",          year:"2026",        type:"ev",     seg:"EV SUV",        msrp:57048,  eff:19.0, fuel:null,      ins:3400, maint:600,  keep5:43, stars:4.2, range:468,
    pros:["Toyota reliability in an EV","Lower insurance than Tesla","AWD standard"],           cons:["Smaller charging network","Shorter range than Model 3"] },
  // ── Popular Canadian Alternatives ──────────────────────────────────────────
  { id:"civic",   name:"Honda Civic LX",             year:"2025",        type:"gas",    seg:"Compact",       msrp:27590,  eff:6.9,  fuel:"regular", ins:1950, maint:800,  keep5:55, stars:4.7, range:null,
    pros:["Top reliability record","Lowest fuel cost (compact class)","Strong resale"],         cons:["Base trim limited on tech"] },
  { id:"cch",     name:"Corolla Cross Hybrid",        year:"2025",        type:"hybrid", seg:"Hybrid SUV",    msrp:37090,  eff:5.5,  fuel:"regular", ins:2100, maint:850,  keep5:58, stars:4.7, range:null,
    pros:["Best efficiency in hybrid-SUV class","Toyota reliability","AWD standard"],           cons:["Smaller cargo than RAV4"] },
  { id:"rav4h",   name:"Toyota RAV4 Hybrid XLE",     year:"2025",        type:"hybrid", seg:"Hybrid SUV",    msrp:43490,  eff:6.5,  fuel:"regular", ins:2300, maint:900,  keep5:60, stars:4.8, range:null,
    pros:["Canada's best-selling hybrid SUV","Excellent AWD","Top reliability"],                cons:["Long dealer wait times"] },
  { id:"crvh",    name:"Honda CR-V Hybrid Sport",    year:"2025",        type:"hybrid", seg:"Hybrid SUV",    msrp:42590,  eff:6.7,  fuel:"regular", ins:2250, maint:900,  keep5:58, stars:4.6, range:null,
    pros:["Spacious for class","Strong cargo & towing","Reliable powertrain"],                  cons:["Slightly less efficient than RAV4H"] },
  { id:"ioniq6",  name:"Hyundai Ioniq 6 AWD",        year:"2026",        type:"ev",     seg:"EV Sedan",      msrp:55999,  eff:18.5, fuel:null,      ins:3200, maint:600,  keep5:43, stars:4.6, range:519,
    pros:["800V ultra-fast charging","Excellent efficiency","Lower MSRP than Tesla"],           cons:["Sedan body only","Smaller dealer network"] },
  { id:"mazda3",  name:"Mazda 3 Sport GT AWD",       year:"2025",        type:"gas",    seg:"Hatchback",     msrp:35200,  eff:8.0,  fuel:"regular", ins:2200, maint:1000, keep5:52, stars:4.5, range:null,
    pros:["Best interior quality in class","AWD standard on GT","Refined ride"],                cons:["Turbo wants premium for full power"] },
  { id:"tuchhyb", name:"Hyundai Tucson Hybrid",      year:"2025",        type:"hybrid", seg:"Hybrid SUV",    msrp:39499,  eff:6.6,  fuel:"regular", ins:2200, maint:900,  keep5:55, stars:4.4, range:null,
    pros:["HTRAC AWD standard","Lower price than RAV4/CR-V Hybrid","Strong warranty"],         cons:["Less refined than Toyota/Honda rivals"] },
  { id:"f150",    name:"Ford F-150 XLT",             year:"2025",        type:"gas",    seg:"Truck",         msrp:52249,  eff:13.2, fuel:"regular", ins:2400, maint:1300, keep5:52, stars:4.2, range:null,
    pros:["Canada's best-selling truck","Wide dealer network","Pro Power Onboard"],             cons:["High fuel costs","Large footprint"] },
  { id:"cx5",     name:"Mazda CX-5 GS AWD",          year:"2025",        type:"gas",    seg:"SUV",           msrp:34200,  eff:8.9,  fuel:"regular", ins:2150, maint:1000, keep5:55, stars:4.5, range:null,
    pros:["Premium feel at mid-market price","AWD standard","Quiet refined cabin"],             cons:["Smaller than class average"] },
  { id:"accordh", name:"Honda Accord Hybrid Sport",  year:"2025",        type:"hybrid", seg:"Hybrid Sedan",  msrp:41190,  eff:5.8,  fuel:"regular", ins:2200, maint:850,  keep5:58, stars:4.6, range:null,
    pros:["Spacious midsize with hybrid efficiency","Strong tech features","Refined"],          cons:["FWD only — no AWD option"] },
];

const SHORTLIST_IDS = ["tundra","bmw330","gti","kia","ct5","prius","modely","model3","polstr3","bz"];
const DEF_S = { km:20000, reg:1.60, prem:1.75, home:0.14, sc:0.48, scPct:30 };
const DEF_F = { down:20, rate:6.99, term:60 };
const TERMS = [24,36,48,60,72,84];

// ── Helpers ───────────────────────────────────────────────────────────────────
const $c = n => "$" + Math.round(n).toLocaleString("en-CA");
const $k = n => "$" + (Math.round(n/100)*100/1000).toFixed(0) + "k";

function annFuel(car, s) {
  if (car.type === "ev") {
    const hKm = s.km * (1 - s.scPct/100), scKm = s.km * (s.scPct/100);
    return (car.eff/100) * (hKm * s.home + scKm * s.sc);
  }
  return (car.eff/100) * s.km * (car.fuel === "premium" ? s.prem : s.reg);
}

function total5(car, s) {
  return annFuel(car,s)*5 + car.ins*5 + car.maint*5 + car.msrp*(1-car.keep5/100);
}

function calcMonthly(msrp, downPct, annRate, term) {
  const P = msrp * (1 - downPct/100);
  if (!annRate) return P/term;
  const r = annRate/100/12;
  return P * r * Math.pow(1+r,term) / (Math.pow(1+r,term)-1);
}

function autoIns(type, msrp) {
  const b = type==="ev"?3370: type==="hybrid"?2200:2464;
  return Math.round(b * Math.pow(msrp/(type==="ev"?60000:40000), 0.25) / 50)*50;
}
function autoMaint(type, msrp) {
  if (type==="ev")     return msrp>80000?800:600;
  if (type==="hybrid") return 900;
  return msrp>60000?1800: msrp>40000?1400:1000;
}
function autoKeep5(type, msrp) {
  if (type==="hybrid") return 58;
  if (type==="ev")     return msrp>80000?35:44;
  return msrp>60000?42: msrp>40000?48:52;
}

// ── Mini Components ───────────────────────────────────────────────────────────
function Badge({type, small}) {
  return (
    <span style={{
      fontFamily:COND, fontWeight:700, fontSize:small?9:10, letterSpacing:"0.1em",
      color:TC[type], background:TC[type]+"18", border:`1px solid ${TC[type]}33`,
      padding:small?"1px 6px":"2px 8px", borderRadius:100,
    }}>{TL[type]}</span>
  );
}

function Stars({n}) {
  return (
    <span style={{fontFamily:MONO, fontSize:11}}>
      <span style={{color:C.amber}}>{"★".repeat(Math.floor(n))}{"☆".repeat(5-Math.floor(n))}</span>
      <span style={{color:C.t4, marginLeft:5}}>{n.toFixed(1)}/5</span>
    </span>
  );
}

function Pill({label, value, color}) {
  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:2}}>
      <span style={{fontFamily:MONO, fontWeight:500, fontSize:13, color:color||C.t1}}>{value}</span>
      <span style={{fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.08em", textTransform:"uppercase"}}>{label}</span>
    </div>
  );
}

function SliderRow({label, value, min, max, step, fmt, onChange}) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
        <span style={{fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.08em", textTransform:"uppercase"}}>{label}</span>
        <span style={{fontFamily:MONO, fontSize:10, color:C.blue}}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%", height:4, background:C.s1, borderRadius:2, outline:"none", cursor:"pointer",
          WebkitAppearance:"none", accentColor:C.blue}} />
    </div>
  );
}

function Inp({label, value, type="text", onChange, placeholder}) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:4}}>
      <label style={{fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.08em", textTransform:"uppercase"}}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
        style={{background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"8px 10px",
          color:C.t1, fontFamily:BODY, fontSize:13, outline:"none"}} />
    </div>
  );
}

function Sel({label, value, options, onChange}) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:4}}>
      <label style={{fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.08em", textTransform:"uppercase"}}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"8px 10px",
          color:C.t1, fontFamily:BODY, fontSize:13, outline:"none", cursor:"pointer"}}>
        {options.map(o => <option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
      </select>
    </div>
  );
}

function Btn({children, onClick, variant="primary", small, disabled}) {
  const bg  = variant==="primary" ? C.blue : variant==="ghost" ? "transparent" : C.s3;
  const col = variant==="primary" ? C.bg   : C.t1;
  const bdr = variant==="outline" ? `1px solid ${C.bdrHi}` : "1px solid transparent";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{background:bg, color:col, border:bdr, borderRadius:6,
        padding:small?"4px 10px":"7px 16px", fontFamily:COND, fontWeight:700,
        fontSize:small?11:12, letterSpacing:"0.08em", cursor:disabled?"default":"pointer",
        opacity:disabled?0.4:1, transition:"opacity .15s, background .15s"}}>
      {children}
    </button>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({s, setS, onReset}) {
  return (
    <div style={{background:C.s1, borderBottom:`1px solid ${C.bdr}`, padding:"16px 24px"}}>
      <div style={{maxWidth:960, margin:"0 auto"}}>
        <div style={{fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.18em", fontWeight:700, marginBottom:14}}>
          ADJUST YOUR ASSUMPTIONS
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:"0 24px"}}>
          <SliderRow label="Annual Distance" value={s.km} min={5000} max={50000} step={1000}
            fmt={v=>`${(v/1000).toFixed(0)}k km/yr`} onChange={v=>setS(p=>({...p,km:v}))} />
          <SliderRow label="Regular Gas" value={s.reg} min={1.10} max={2.20} step={0.01}
            fmt={v=>`$${v.toFixed(2)}/L`} onChange={v=>setS(p=>({...p,reg:v}))} />
          <SliderRow label="Premium Gas" value={s.prem} min={1.25} max={2.35} step={0.01}
            fmt={v=>`$${v.toFixed(2)}/L`} onChange={v=>setS(p=>({...p,prem:v}))} />
          <SliderRow label="Home Electricity" value={s.home} min={0.08} max={0.30} step={0.005}
            fmt={v=>`${(v*100).toFixed(1)}¢/kWh`} onChange={v=>setS(p=>({...p,home:v}))} />
          <SliderRow label="Supercharger Rate" value={s.sc} min={0.28} max={0.75} step={0.01}
            fmt={v=>`${(v*100).toFixed(0)}¢/kWh`} onChange={v=>setS(p=>({...p,sc:v}))} />
          <SliderRow label="% Charged at SC" value={s.scPct} min={0} max={100} step={5}
            fmt={v=>`${v}%`} onChange={v=>setS(p=>({...p,scPct:v}))} />
        </div>
        <div style={{marginTop:14, paddingTop:12, borderTop:`1px solid ${C.bdr}`,
          display:"flex", alignItems:"center", gap:12}}>
          <span style={{fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.08em"}}>
            Settings and garage are saved automatically in your browser.
          </span>
          <button onClick={onReset}
            style={{fontFamily:COND, fontWeight:700, fontSize:9, letterSpacing:"0.08em",
              background:C.redLo, border:`1px solid ${C.red}33`, borderRadius:5,
              color:C.red, cursor:"pointer", padding:"4px 10px", whiteSpace:"nowrap"}}>
            RESET TO DEFAULTS
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Library Card ──────────────────────────────────────────────────────────────
function LibraryCard({car, inGarage, onAdd, onRemove, s}) {
  const fuel = annFuel(car, s);
  return (
    <div style={{background:C.s2, border:`1px solid ${inGarage ? TC[car.type]+"66" : C.bdr}`,
      borderRadius:10, padding:16, display:"flex", flexDirection:"column", gap:10,
      transition:"border-color .15s, transform .15s"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
        <div>
          <Badge type={car.type} />
          <div style={{fontFamily:COND, fontWeight:700, fontSize:16, color:C.t1, marginTop:6, lineHeight:1.2}}>{car.name}</div>
          <div style={{fontFamily:BODY, fontSize:11, color:C.t5, marginTop:2}}>{car.year} · {car.seg}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:MONO, fontSize:17, fontWeight:500, color:C.blue}}>{$k(car.msrp)}</div>
          <div style={{fontFamily:COND, fontSize:9, color:C.t5, marginTop:1, letterSpacing:"0.06em"}}>{car.usedMarket?"MARKET PRICE":"MSRP CAD"}</div>
        </div>
      </div>
      <div style={{display:"flex", gap:16, paddingTop:8, borderTop:`1px solid ${C.bdr}`}}>
        <Pill label="Fuel/yr" value={$k(fuel)} color={TC[car.type]} />
        <Pill label={car.type==="ev" ? `${car.eff} kWh/100` : `${car.eff} L/100`} value={car.type==="ev" ? "Efficiency" : car.fuel==="premium"?"Premium":"Regular"} />
        <div style={{marginLeft:"auto", display:"flex", alignItems:"center"}}><Stars n={car.stars} /></div>
      </div>
      <div style={{marginTop:2, display:"flex", gap:8, alignItems:"center"}}>
        {inGarage ? (
          <>
            <span style={{fontFamily:COND, fontSize:10, color:TC[car.type], letterSpacing:"0.06em"}}>✓ IN GARAGE</span>
            <button onClick={()=>onRemove(car.id)}
              style={{fontFamily:COND, fontSize:9, fontWeight:700, letterSpacing:"0.06em",
                background:C.redLo, border:`1px solid ${C.red}33`, borderRadius:4,
                color:C.red, cursor:"pointer", padding:"2px 7px", lineHeight:1}}>REMOVE</button>
          </>
        ) : (
          <Btn onClick={()=>onAdd(car.id)} variant="outline" small>+ Add to Garage</Btn>
        )}
      </div>
    </div>
  );
}

// ── Garage Card ───────────────────────────────────────────────────────────────
function GarageCard({car, selected, onSelect, onRemove, s, isBest5yr}) {
  const m    = useIsMobile();
  const fuel = annFuel(car, s);
  const tot5 = total5(car, s);
  const c    = TC[car.type];
  return (
    <div style={{background:C.s2, border:`1px solid ${selected ? c : isBest5yr ? C.amber+"55" : C.bdr}`,
      borderRadius:10, padding:18, position:"relative", transition:"border-color .15s"}}>
      {isBest5yr && (
        <div style={{position:"absolute", top:-1, right:12,
          background:C.amber, color:"#000",
          fontFamily:COND, fontSize:9, fontWeight:700, letterSpacing:"0.08em",
          padding:"2px 8px", borderRadius:"0 0 6px 6px"}}>
          BEST 5-YR COST
        </div>
      )}
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12}}>
        <div style={{flex:1}}>
          <div style={{display:"flex", gap:6, alignItems:"center", marginBottom:5}}>
            <Badge type={car.type} />
            {car.custom && (
              <span style={{fontFamily:COND, fontSize:9, color:C.t4,
                border:`1px solid ${C.bdr}`, padding:"1px 5px", borderRadius:3}}>CUSTOM</span>
            )}
          </div>
          <div style={{fontFamily:COND, fontWeight:700, fontSize:17, color:C.t1, lineHeight:1.2}}>{car.name}</div>
          <div style={{fontFamily:BODY, fontSize:11, color:C.t5, marginTop:2}}>{car.year} · {car.seg}</div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <input type="checkbox" checked={selected} onChange={()=>onSelect(car.id)}
            style={{accentColor:c, width:15, height:15, cursor:"pointer"}}
            title="Select for comparison" />
          <button onClick={()=>onRemove(car.id)} title="Remove from garage"
            style={{background:C.redLo, border:`1px solid ${C.red}33`, borderRadius:5,
              color:C.red, cursor:"pointer", fontFamily:COND, fontSize:10, fontWeight:700,
              letterSpacing:"0.06em", padding:"3px 8px", lineHeight:1}}>REMOVE</button>
        </div>
      </div>

      {/* MSRP + Fuel */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10}}>
        <div style={{background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"8px 10px"}}>
          <div style={{fontFamily:MONO, fontSize:15, fontWeight:500, color:C.blue}}>{$c(car.msrp)}</div>
          <div style={{fontFamily:COND, fontSize:8, color:C.t5, marginTop:2, letterSpacing:"0.07em", textTransform:"uppercase"}}>{car.usedMarket?"MARKET PRICE":"MSRP CAD"}</div>
        </div>
        <div style={{background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"8px 10px"}}>
          <div style={{fontFamily:MONO, fontSize:15, fontWeight:500, color:c}}>{$c(fuel)}</div>
          <div style={{fontFamily:COND, fontSize:8, color:C.t5, marginTop:2, letterSpacing:"0.07em", textTransform:"uppercase"}}>{car.type==="ev"?"CHARGE / YEAR":"FUEL / YEAR"}</div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{display:"grid", gridTemplateColumns: m ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
        marginBottom:10, background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, overflow:"hidden"}}>
        {[
          {l:"2-WEEK",    v:$c(fuel/26)},
          {l:"MONTHLY",   v:$c(fuel/12)},
          {l:"INSURANCE", v:$c(car.ins)},
          {l:"MAINT.",    v:$c(car.maint)},
        ].map((x,i) => (
          <div key={i} style={{padding:"8px 4px", textAlign:"center",
            borderRight: m ? (i%2===0 ? `1px solid ${C.bdr}` : "none") : (i<3 ? `1px solid ${C.bdr}` : "none"),
            borderBottom: m && i < 2 ? `1px solid ${C.bdr}` : "none"}}>
            <div style={{fontFamily:MONO, fontSize:m?11:10, color:C.t2}}>{x.v}</div>
            <div style={{fontFamily:COND, fontSize:8, color:C.t5, marginTop:2, letterSpacing:"0.06em"}}>{x.l}</div>
          </div>
        ))}
      </div>

      {/* 5-yr total */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center",
        background: selected ? c+"1a" : C.s1, border:`1px solid ${C.bdrHi}`,
        borderRadius:6, padding:"8px 12px", marginBottom:10}}>
        <span style={{fontFamily:COND, fontSize:10, color:C.t4, letterSpacing:"0.07em"}}>5-YEAR TOTAL COST</span>
        <span style={{fontFamily:MONO, fontSize:15, fontWeight:500, color:c}}>{$c(tot5)}</span>
      </div>

      {/* Range (EV) */}
      {car.range && (
        <div style={{fontFamily:BODY, fontSize:11, color:C.t3, marginBottom:8}}>
          🔋 Rated range: <span style={{color:C.blue, fontFamily:MONO}}>{car.range} km</span>
          <span style={{color:C.t5}}> · ~{Math.round(car.range*0.70)}–{Math.round(car.range*0.80)} km in winter</span>
        </div>
      )}

      <Stars n={car.stars} />

      {/* Pros / Cons */}
      {(car.pros?.length > 0 || car.cons?.length > 0) && (
        <div style={{marginTop:10, fontSize:10, lineHeight:1.7}}>
          {car.pros?.map((p,i) => <div key={i} style={{color:"#3d6640"}}>✓ {p}</div>)}
          {car.cons?.map((p,i) => <div key={i} style={{color:"#4d3030"}}>✗ {p}</div>)}
        </div>
      )}
    </div>
  );
}

// ── Compare Section ───────────────────────────────────────────────────────────
const CHART_COLORS = [C.blue, C.amber, C.green, "#a78bfa"];

function CompareSection({cars, s}) {
  if (cars.length < 2) return (
    <div style={{padding:40, textAlign:"center", color:C.t4,
      fontFamily:COND, letterSpacing:"0.08em", fontSize:12}}>
      SELECT 2–4 CARS FROM YOUR GARAGE TO COMPARE
    </div>
  );

  const chartData = cars.map(car => {
    const fuel = annFuel(car,s)*5;
    const ins  = car.ins*5;
    const maint= car.maint*5;
    const depr = car.msrp*(1-car.keep5/100);
    return {
      name: car.name.split(" ").slice(0,2).join(" "),
      Depreciation: Math.round(depr/100)*100,
      Insurance:    Math.round(ins/100)*100,
      Maintenance:  Math.round(maint/100)*100,
      [car.type==="ev"?"Charging":"Fuel"]: Math.round(fuel/100)*100,
    };
  });

  const rows = [
    {l:"MSRP",              fn:c=>$c(c.msrp)},
    {l:"TYPE",              fn:c=><Badge type={c.type} />},
    {l:"FUEL / 2 WEEKS",   fn:(c,s)=>$c(annFuel(c,s)/26)},
    {l:"FUEL / MONTH",     fn:(c,s)=>$c(annFuel(c,s)/12)},
    {l:"FUEL / YEAR",      fn:(c,s)=>$c(annFuel(c,s))},
    {l:"INSURANCE / YR",   fn:c=>$c(c.ins)},
    {l:"MAINTENANCE / YR", fn:c=>$c(c.maint)},
    {l:"EFFICIENCY",       fn:c=>c.type==="ev"?`${c.eff} kWh/100km`:`${c.eff} L/100km`},
    {l:"RANGE (RATED)",    fn:c=>c.range?`${c.range} km`:"—"},
    {l:"5-YR DEPRECIATION",fn:c=>$c(c.msrp*(1-c.keep5/100))},
    {l:"RELIABILITY",      fn:c=><Stars n={c.stars} />},
    {l:"5-YEAR TOTAL",     fn:(c,s)=>$c(total5(c,s)), bold:true},
  ];

  const totals = cars.map(c=>total5(c,s));
  const minTot = Math.min(...totals);

  return (
    <div>
      {/* Table */}
      <div style={{overflowX:"auto", marginBottom:28}}>
        <table style={{width:"100%", borderCollapse:"collapse", fontFamily:BODY, fontSize:12}}>
          <thead>
            <tr>
              <th style={{...thS, width:160, textAlign:"left"}}>METRIC</th>
              {cars.map((c,i)=>(
                <th key={c.id} style={{...thS, color:CHART_COLORS[i], textAlign:"center",
                  whiteSpace:"nowrap", borderBottom:`2px solid ${CHART_COLORS[i]}`}}>
                  <div style={{fontFamily:COND, fontSize:8, letterSpacing:"0.1em", marginBottom:2,
                    color:CHART_COLORS[i]+"aa"}}>{c.year}</div>
                  {c.name.split(" ").slice(0,3).join(" ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row,ri)=>(
              <tr key={ri} style={{background: ri%2===0 ? C.s3 : "transparent"}}>
                <td style={{...tdS, fontFamily:COND, letterSpacing:"0.06em", fontSize:9,
                  fontWeight:row.bold?700:"normal", color:row.bold?C.blue:C.t4}}>{row.l}</td>
                {cars.map((c,ci)=>{
                  const v = row.fn(c, s);
                  const isBest = row.bold && total5(c,s)===minTot;
                  return (
                    <td key={c.id} style={{...tdS, textAlign:"center",
                      fontFamily:row.bold?MONO:BODY,
                      fontSize:row.bold?15:12, fontWeight:row.bold?500:"normal",
                      color:isBest?C.blue:C.t2,
                      background:isBest?C.blueLo:"transparent"}}>
                      {v}
                      {isBest && row.bold && (
                        <span style={{display:"block", fontSize:9, color:C.blue, marginTop:1}}>▼ LOWEST COST</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div>
        <div style={{fontFamily:COND, fontSize:10, color:C.t4, letterSpacing:"0.1em", marginBottom:14}}>
          5-YEAR COST BREAKDOWN (STACKED)
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{top:0,right:0,bottom:0,left:0}} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{fill:C.t4, fontFamily:COND, fontSize:10}}
              axisLine={{stroke:C.bdr}} tickLine={false} />
            <YAxis tick={{fill:C.t5, fontFamily:MONO, fontSize:9}} axisLine={false} tickLine={false}
              tickFormatter={v=>"$"+(v/1000).toFixed(0)+"k"} />
            <Tooltip
              contentStyle={{background:C.s1, border:`1px solid ${C.bdrHi}`, borderRadius:8,
                fontFamily:MONO, fontSize:11}}
              labelStyle={{color:C.t1, fontFamily:COND, fontSize:13, fontWeight:700}}
              formatter={(v,n)=>[$c(v),n]} />
            <Bar dataKey="Depreciation" stackId="a" fill="#1e3a5f" />
            <Bar dataKey="Insurance"    stackId="a" fill="#3730a3" />
            <Bar dataKey="Maintenance"  stackId="a" fill="#0e7490" />
            <Bar dataKey="Fuel"         stackId="a" fill="#c2410c" />
            <Bar dataKey="Charging"     stackId="a" fill={C.blue} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:"flex", gap:16, flexWrap:"wrap", marginTop:8}}>
          {[{c:"#1e3a5f",l:"Depreciation"},{c:"#3730a3",l:"Insurance"},{c:"#0e7490",l:"Maintenance"},
            {c:"#c2410c",l:"Fuel"},{c:C.blue,l:"Charging"}].map(x=>(
            <span key={x.l} style={{fontFamily:COND, fontSize:10, color:C.t4,
              display:"flex", alignItems:"center", gap:4}}>
              <span style={{width:8,height:8,borderRadius:2,background:x.c,display:"inline-block"}}></span>{x.l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const thS = {
  background:C.s1, padding:"8px 10px", fontFamily:COND, fontSize:9,
  letterSpacing:"0.1em", color:C.t4, borderBottom:`1px solid ${C.bdr}`, fontWeight:700,
};
const tdS = { padding:"7px 10px", borderBottom:`1px solid ${C.bdr}22` };

// ── Financing Section ─────────────────────────────────────────────────────────
function FinancingSection({cars, f, setF}) {
  const m = useIsMobile();
  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr 1fr", gap:12, marginBottom:20}}>
        <div>
          <div style={{fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.08em",
            textTransform:"uppercase", marginBottom:6}}>DOWN PAYMENT</div>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <input type="range" min={0} max={50} step={5} value={f.down}
              onChange={e=>setF(p=>({...p,down:Number(e.target.value)}))}
              style={{flex:1, accentColor:C.blue, cursor:"pointer"}} />
            <span style={{fontFamily:MONO, fontSize:12, color:C.blue, width:36, textAlign:"right"}}>{f.down}%</span>
          </div>
        </div>
        <div>
          <label style={{fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.08em",
            textTransform:"uppercase", display:"block", marginBottom:6}}>INTEREST RATE</label>
          <input type="number" value={f.rate} min={0} max={25} step={0.1}
            onChange={e=>setF(p=>({...p,rate:Number(e.target.value)}))}
            style={{background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"6px 10px",
              color:C.blue, fontFamily:MONO, fontSize:13, width:"100%", outline:"none"}} />
        </div>
        <div>
          <label style={{fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.08em",
            textTransform:"uppercase", display:"block", marginBottom:6}}>TERM</label>
          <select value={f.term} onChange={e=>setF(p=>({...p,term:Number(e.target.value)}))}
            style={{background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"6px 10px",
              color:C.t1, fontFamily:BODY, fontSize:13, width:"100%", outline:"none", cursor:"pointer"}}>
            {TERMS.map(t=><option key={t} value={t}>{t} months ({(t/12).toFixed(1)} yr)</option>)}
          </select>
        </div>
      </div>

      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%", borderCollapse:"collapse", fontFamily:BODY, fontSize:12}}>
          <thead>
            <tr>
              {["Vehicle","Price","Down Payment","Principal","Monthly Pmt","Total Interest","Total Paid"].map(h=>(
                <th key={h} style={{...thS, textAlign:h==="Vehicle"?"left":"right", whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((car, ri) => {
              const down  = car.msrp * f.down/100;
              const principal = car.msrp - down;
              const mp    = calcMonthly(car.msrp, f.down, f.rate, f.term);
              const totalPaid = down + mp * f.term;
              const totalInt  = totalPaid - car.msrp;
              return (
                <tr key={car.id} style={{background: ri%2===0 ? C.s2:"transparent"}}>
                  <td style={{...tdS, fontFamily:COND, fontWeight:700, fontSize:12}}>
                    <Badge type={car.type} small />
                    <span style={{marginLeft:6, color:C.t1}}>{car.name}</span>
                    <div style={{fontFamily:BODY, fontSize:10, color:C.t5, marginTop:1}}>{car.year}</div>
                  </td>
                  <td style={{...tdS, textAlign:"right", fontFamily:MONO, color:C.t2}}>{$c(car.msrp)}</td>
                  <td style={{...tdS, textAlign:"right", fontFamily:MONO, color:C.t2}}>{$c(down)}</td>
                  <td style={{...tdS, textAlign:"right", fontFamily:MONO, color:C.t2}}>{$c(principal)}</td>
                  <td style={{...tdS, textAlign:"right", fontFamily:MONO, color:C.blue, fontWeight:700, fontSize:13}}>{$c(mp)}</td>
                  <td style={{...tdS, textAlign:"right", fontFamily:MONO, color:C.red}}>{$c(totalInt)}</td>
                  <td style={{...tdS, textAlign:"right", fontFamily:MONO, color:C.t1, fontWeight:700}}>{$c(totalPaid)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{fontFamily:BODY, fontSize:11, color:C.t5, marginTop:10}}>
        * Payments assume constant rate. Does not include taxes, fees, or insurance. Ontario HST not included.
      </div>
    </div>
  );
}

// ── Library View ──────────────────────────────────────────────────────────────
function LibraryView({allCars, garageIds, onAdd, onRemove, s}) {
  const m = useIsMobile();
  const [search, setSearch] = useState("");
  const [typeF, setTypeF]   = useState("all");

  const filtered = useMemo(() => allCars.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.seg.toLowerCase().includes(q) || c.year.toLowerCase().includes(q);
    const matchT = typeF==="all" || c.type===typeF;
    return matchQ && matchT;
  }), [allCars, search, typeF]);

  return (
    <div>
      <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:20}}>
        <input placeholder="Search by name, segment, year…" value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{width:"100%", background:C.s2, border:`1px solid ${C.bdr}`, borderRadius:6,
            padding:"10px 12px", color:C.t1, fontFamily:BODY, fontSize:13, outline:"none"}} />
        <div style={{display:"flex", gap:6, flexWrap:"wrap", alignItems:"center"}}>
          {["all","gas","hybrid","ev"].map(t=>(
            <button key={t} onClick={()=>setTypeF(t)}
              style={{fontFamily:COND, fontWeight:700, fontSize:10, letterSpacing:"0.08em",
                padding:"7px 14px", borderRadius:100, cursor:"pointer", border:"none",
                background: typeF===t ? (t==="all"?C.blue:TC[t]) : C.s2,
                color: typeF===t ? (t==="all"?C.bg:"#000") : C.t4}}>
              {t==="all"?"ALL":TL[t]}
            </button>
          ))}
          <span style={{fontFamily:COND, fontSize:10, color:C.t5, letterSpacing:"0.06em", marginLeft:"auto"}}>{filtered.length} VEHICLES</span>
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:`repeat(auto-fill, minmax(${m?"280px":"280px"}, 1fr))`, gap:14}}>
        {filtered.map(car => (
          <LibraryCard key={car.id} car={car} inGarage={garageIds.includes(car.id)} onAdd={onAdd} onRemove={onRemove} s={s} />
        ))}
      </div>
      {filtered.length===0 && (
        <div style={{textAlign:"center", color:C.t4, fontFamily:COND, padding:60, letterSpacing:"0.08em", fontSize:12}}>
          NO VEHICLES MATCH YOUR SEARCH
        </div>
      )}
    </div>
  );
}

// ── fueleconomy.gov API helpers ───────────────────────────────────────────────
const FE = "https://www.fueleconomy.gov/ws/rest";

async function feGet(path) {
  const r = await fetch(`${FE}${path}`);
  if (!r.ok) throw new Error(r.status);
  return r.text();
}

function xmlList(xml) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  return Array.from(doc.querySelectorAll("menuItem")).map(el => ({
    text:  el.querySelector("text")?.textContent  || "",
    value: el.querySelector("value")?.textContent || "",
  }));
}

function parseVeh(xml) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const g = t => doc.querySelector(t)?.textContent?.trim() || "";
  return {
    id: g("id"), year: g("year"), make: g("make"), model: g("model"),
    fuelType1: g("fuelType1"), fuelType2: g("fuelType2"),
    comb08: +g("comb08")||0, hwy08: +g("highway08")||0,
    combE:  +g("combE") ||0, range:  +g("range")||0,
  };
}

function vehToCard(v, name, msrp, seg) {
  const f1 = (v.fuelType1||"").toLowerCase(), f2 = (v.fuelType2||"").toLowerCase();
  const isEV     = f1.includes("electr") || (v.combE > 0 && v.comb08 === 0);
  const isHybrid = !isEV && (f2.includes("electr") || f1.includes("hybrid"));
  const type     = isEV ? "ev" : isHybrid ? "hybrid" : "gas";
  const mpg      = v.hwy08 || v.comb08;
  // Gas/hybrid: highway MPG → L/100km (user drives highway)
  // EV: combined MPGe → kWh/100km
  const eff  = isEV
    ? (v.combE > 0 ? +(2093.9 / v.combE).toFixed(1) : 0)
    : (mpg     > 0 ? +(235.21 / mpg).toFixed(1)     : 0);
  const range    = v.range > 0 ? Math.round(v.range * 1.60934) : null;
  const fuel     = f1.includes("premium") ? "premium" : "regular";
  const numMsrp  = +msrp || 0;
  return {
    id: "custom_" + Math.random().toString(36).slice(2),
    name, year: String(v.year), type,
    seg: seg || "",
    msrp: numMsrp, eff,
    fuel: isEV ? null : fuel,
    range,
    ins:   autoIns(type, numMsrp),
    maint: autoMaint(type, numMsrp),
    keep5: autoKeep5(type, numMsrp),
    stars: 4.0, pros: [], cons: [], custom: true,
  };
}

// ── Add Car View ──────────────────────────────────────────────────────────────
function AddCarView({onAdd}) {
  const m = useIsMobile();
  const [yr,    setYr]    = useState("2025");
  const [makes, setMakes] = useState([]);
  const [make,  setMake]  = useState("");
  const [mods,  setMods]  = useState([]);
  const [mod,   setMod]   = useState("");
  const [trims, setTrims] = useState([]);
  const [trim,  setTrim]  = useState("");
  const [busy,  setBusy]  = useState(""); // "" | "makes" | "models" | "trims" | "vehicle"
  const [err,   setErr]   = useState("");
  const [veh,   setVeh]   = useState(null);
  const [msrp,  setMsrp]  = useState("");
  const [seg,   setSeg]   = useState("");
  const [saved, setSaved] = useState(false);

  async function run(stage, fn) {
    setBusy(stage); setErr("");
    try { await fn(); } catch(e) { setErr(`Could not load ${stage} — check your connection.`); }
    setBusy("");
  }

  async function findMakes() {
    setMakes([]); setMake(""); setMods([]); setMod("");
    setTrims([]); setTrim(""); setVeh(null); setMsrp(""); setSeg("");
    await run("makes", async () => {
      const items = xmlList(await feGet(`/vehicle/menu/make?year=${yr}`));
      if (!items.length) throw new Error("none");
      setMakes(items); setMake(items[0].value);
    });
  }

  // Auto-load models when make changes
  useEffect(() => {
    if (!make) return;
    setMods([]); setMod(""); setTrims([]); setTrim(""); setVeh(null);
    run("models", async () => {
      const items = xmlList(await feGet(`/vehicle/menu/model?year=${yr}&make=${encodeURIComponent(make)}`));
      setMods(items); if (items.length) setMod(items[0].value);
    });
  }, [make]);

  // Auto-load trims when model changes
  useEffect(() => {
    if (!mod) return;
    setTrims([]); setTrim(""); setVeh(null);
    run("trims", async () => {
      const items = xmlList(await feGet(`/vehicle/menu/options?year=${yr}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(mod)}`));
      setTrims(items); if (items.length) setTrim(items[0].value);
    });
  }, [mod]);

  async function researchVehicle() {
    setVeh(null);
    await run("vehicle", async () => setVeh(parseVeh(await feGet(`/vehicle/${trim}`))));
  }

  const preview = veh && msrp ? vehToCard(veh, `${veh.make} ${veh.model}`, msrp, seg) : null;

  function handleAdd() {
    if (!preview) return;
    onAdd(preview);
    setSaved(true);
    setVeh(null); setMsrp(""); setSeg("");
    setTimeout(() => setSaved(false), 2500);
  }

  const lbl = {fontFamily:COND, fontSize:9, color:C.t5, letterSpacing:"0.08em",
    textTransform:"uppercase", display:"block", marginBottom:5};
  const sel = {background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"8px 10px",
    color:C.t1, fontFamily:BODY, fontSize:13, width:"100%", outline:"none", cursor:"pointer"};
  const stepLbl = {fontFamily:COND, fontWeight:700, fontSize:9, color:C.t5,
    letterSpacing:"0.18em", marginBottom:14};

  return (
    <div style={{maxWidth:820}}>

      {/* ── Step 1: Find Vehicle ── */}
      <div style={{background:C.s2, border:`1px solid ${C.bdr}`, borderRadius:10, padding:20, marginBottom:14}}>
        <div style={stepLbl}>STEP 1 — FIND YOUR VEHICLE</div>
        <div style={{display:"flex", gap:10, alignItems:"flex-end", marginBottom:14}}>
          <div>
            <label style={lbl}>MODEL YEAR</label>
            <input type="number" value={yr} min={2000} max={2026} onChange={e=>setYr(e.target.value)}
              style={{...sel, width:100, fontFamily:"'IBM Plex Mono',monospace", color:C.blue}} />
          </div>
          <Btn onClick={findMakes} disabled={!!busy || !yr}>
            {busy==="makes" ? "LOADING…" : "SEARCH MAKES →"}
          </Btn>
          {err && <span style={{fontFamily:BODY, fontSize:11, color:C.red}}>{err}</span>}
        </div>

        {makes.length > 0 && (
          <div style={{display:"grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr 1fr", gap:12}}>
            {/* Make */}
            <div>
              <label style={lbl}>MAKE</label>
              <select value={make} onChange={e=>setMake(e.target.value)} style={sel}>
                {makes.map(m=><option key={m.value} value={m.value}>{m.text}</option>)}
              </select>
            </div>
            {/* Model */}
            <div>
              <label style={lbl}>MODEL</label>
              {busy==="models"
                ? <div style={{fontFamily:COND, fontSize:10, color:C.blue, letterSpacing:"0.06em", paddingTop:10}}>Loading…</div>
                : <select value={mod} onChange={e=>setMod(e.target.value)} disabled={!mods.length}
                    style={{...sel, color: mods.length ? C.t1 : C.t4}}>
                    {mods.map(m=><option key={m.value} value={m.value}>{m.text}</option>)}
                  </select>}
            </div>
            {/* Trim */}
            <div>
              <label style={lbl}>TRIM / ENGINE</label>
              {busy==="trims"
                ? <div style={{fontFamily:COND, fontSize:10, color:C.blue, letterSpacing:"0.06em", paddingTop:10}}>Loading…</div>
                : <select value={trim} onChange={e=>setTrim(e.target.value)} disabled={!trims.length}
                    style={{...sel, color: trims.length ? C.t1 : C.t4}}>
                    {trims.map(t=><option key={t.value} value={t.value}>{t.text}</option>)}
                  </select>}
            </div>
          </div>
        )}

        {trims.length > 0 && (
          <div style={{marginTop:14}}>
            <Btn onClick={researchVehicle} disabled={!!busy || !trim}>
              {busy==="vehicle" ? "RESEARCHING…" : "⚡ RESEARCH SPECS →"}
            </Btn>
          </div>
        )}

        {!makes.length && (
          <div style={{fontFamily:BODY, fontSize:11, color:C.t5, lineHeight:1.7}}>
            Fuel type, efficiency, and range are fetched from{" "}
            <a href="https://www.fueleconomy.gov" target="_blank" style={{color:C.blue, textDecoration:"none"}}>fueleconomy.gov</a>{" "}
            (US EPA data — covers all North American market vehicles).
            For Canadian pricing, check{" "}
            <a href="https://www.autotrader.ca" target="_blank" style={{color:C.blue, textDecoration:"none"}}>AutoTrader.ca</a>.
          </div>
        )}
      </div>

      {/* ── Step 2: Complete & Add ── */}
      {veh && (
        <div style={{background:C.s2, border:`1px solid ${C.bdrHi}`, borderRadius:10, padding:20}}>
          <div style={stepLbl}>STEP 2 — COMPLETE & ADD</div>

          {/* Fetched specs summary */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px,1fr))", gap:8, marginBottom:16}}>
            {[
              { l:"FUEL TYPE",  v: veh.fuelType2.toLowerCase().includes("electr") ? "Hybrid"
                                 : veh.fuelType1.toLowerCase().includes("electr")  ? "Electric"
                                 : veh.fuelType1 || "Gas" },
              { l:"HWY EFFICIENCY", v: veh.hwy08 > 0
                                    ? `${(235.21/veh.hwy08).toFixed(1)} L/100km`
                                    : veh.combE > 0
                                    ? `${(2093.9/veh.combE).toFixed(1)} kWh/100km`
                                    : "—" },
              ...(veh.range > 0 ? [{ l:"RANGE", v:`${Math.round(veh.range*1.60934)} km` }] : []),
            ].map(x => (
              <div key={x.l} style={{background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"8px 10px"}}>
                <div style={{fontFamily:COND, fontSize:8, color:C.t5, letterSpacing:"0.1em", marginBottom:3, textTransform:"uppercase"}}>{x.l}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:C.blue}}>{x.v}</div>
              </div>
            ))}
            <div style={{background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:6, padding:"8px 10px"}}>
              <div style={{fontFamily:COND, fontSize:8, color:C.t5, letterSpacing:"0.1em", marginBottom:3, textTransform:"uppercase"}}>SOURCE</div>
              <div style={{fontFamily:BODY, fontSize:11, color:C.t3}}>fueleconomy.gov</div>
            </div>
          </div>

          {/* MSRP + Segment */}
          <div style={{display:"grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap:12, marginBottom:16}}>
            <Inp label="Canadian Price (MSRP or Market, $CAD) *required"
              type="number" value={msrp} onChange={setMsrp}
              placeholder="Check AutoTrader.ca — e.g. 45000" />
            <Inp label="Segment (optional)"
              value={seg} onChange={setSeg}
              placeholder="e.g. SUV, Compact, Sedan" />
          </div>

          {/* Preview card */}
          {preview && (
            <div style={{background:C.s3, border:`1px solid ${C.bdr}`, borderRadius:8, padding:14, marginBottom:16}}>
              <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:10}}>
                <Badge type={preview.type} />
                <span style={{fontFamily:COND, fontWeight:700, fontSize:17, color:C.t1}}>{preview.name}</span>
                <span style={{fontFamily:BODY, fontSize:11, color:C.t5}}>{preview.year}</span>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(115px,1fr))", gap:6}}>
                {[
                  {l:"PRICE",          v: $c(preview.msrp)},
                  {l:"EFFICIENCY",     v: `${preview.eff} ${preview.type==="ev"?"kWh/100km":"L/100km"}`},
                  {l:"INSURANCE / YR", v: $c(preview.ins)},
                  {l:"MAINT. / YR",    v: $c(preview.maint)},
                  {l:"5-YR RETAINED",  v: `${preview.keep5}%`},
                  ...(preview.range ? [{l:"RANGE", v:`${preview.range} km`}] : []),
                ].map(x => (
                  <div key={x.l}>
                    <div style={{fontFamily:COND, fontSize:8, color:C.t5, letterSpacing:"0.08em", marginBottom:2, textTransform:"uppercase"}}>{x.l}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:C.t2}}>{x.v}</div>
                  </div>
                ))}
              </div>
              <div style={{fontFamily:BODY, fontSize:10, color:C.t5, marginTop:10}}>
                Insurance, maintenance & depreciation estimated from Ontario provincial averages.
              </div>
            </div>
          )}

          <div style={{display:"flex", gap:10, alignItems:"center"}}>
            <Btn onClick={handleAdd} disabled={!preview}>+ ADD TO LIBRARY & GARAGE</Btn>
            {saved && <span style={{fontFamily:COND, fontSize:11, color:C.green, letterSpacing:"0.06em"}}>✓ ADDED!</span>}
            {!msrp && <span style={{fontFamily:BODY, fontSize:11, color:C.t4}}>Enter a price above to continue</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Garage View ───────────────────────────────────────────────────────────────
function GarageView({garageCars, selected, onSelect, onRemove, s, f, setF}) {
  const m = useIsMobile();
  const [subView, setSubView] = useState("overview");
  const selectedCars = garageCars.filter(c=>selected.includes(c.id));
  const totals = garageCars.map(c=>total5(c,s));
  const minTot = garageCars.length ? Math.min(...totals) : 0;

  if (garageCars.length===0) return (
    <div style={{textAlign:"center", padding:80, color:C.t4}}>
      <div style={{fontSize:48, marginBottom:16}}>🚗</div>
      <div style={{fontFamily:COND, fontSize:15, letterSpacing:"0.1em", marginBottom:8}}>YOUR GARAGE IS EMPTY</div>
      <div style={{fontFamily:BODY, fontSize:13, color:C.t5}}>Go to the Library tab to add vehicles</div>
    </div>
  );

  return (
    <div>
      {/* Sub-navigation */}
      <div style={{display:"flex", gap:0, marginBottom:20, borderBottom:`1px solid ${C.bdr}`,
        overflowX:"auto", WebkitOverflowScrolling:"touch"}}>
        {[
          {k:"overview",  l: m ? `OVERVIEW` : `OVERVIEW (${garageCars.length})`},
          {k:"compare",   l: m ? `COMPARE`  : `COMPARE (${selected.length} SELECTED)`},
          {k:"financing", l:"FINANCING"},
        ].map(x=>(
          <button key={x.k} onClick={()=>setSubView(x.k)}
            style={{fontFamily:COND, fontWeight:700, fontSize:m?12:11, letterSpacing:"0.08em",
              padding: m ? "10px 18px" : "8px 16px",
              border:"none", cursor:"pointer", background:"transparent", flexShrink:0,
              color: subView===x.k ? C.t1 : C.t4,
              borderBottom: `2px solid ${subView===x.k ? C.blue : "transparent"}`,
              marginBottom:-1, transition:"color .1s"}}>
            {x.l}
          </button>
        ))}
      </div>

      {subView==="overview" && (
        <>
          {selected.length > 0 && selected.length < 2 && (
            <div style={{fontFamily:BODY, fontSize:12, color:C.t3, marginBottom:12}}>
              ☝️ Check 2–4 cars to enable comparison
            </div>
          )}
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:14}}>
            {garageCars.map(car => (
              <GarageCard key={car.id} car={car} s={s} f={f}
                selected={selected.includes(car.id)}
                isBest5yr={total5(car,s)===minTot}
                onSelect={onSelect} onRemove={onRemove} />
            ))}
          </div>
        </>
      )}

      {subView==="compare" && (
        <div style={{background:C.s2, border:`1px solid ${C.bdr}`, borderRadius:10, padding:20}}>
          {selected.length < 2
            ? <div style={{color:C.t4, fontFamily:COND, fontSize:12, letterSpacing:"0.08em", textAlign:"center", padding:40}}>
                GO TO OVERVIEW AND CHECK 2–4 CARS TO COMPARE
              </div>
            : <CompareSection cars={selectedCars} s={s} />}
        </div>
      )}

      {subView==="financing" && (
        <div style={{background:C.s2, border:`1px solid ${C.bdr}`, borderRadius:10, padding:20}}>
          <FinancingSection cars={garageCars} f={f} setF={setF} />
        </div>
      )}
    </div>
  );
}

// ── Persistence helpers ───────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  useFonts();
  const m = useIsMobile();
  const [view, setView]             = useState("garage");
  const [garageIds, setGarageIds]   = useState(() => lsGet("as_garage", SHORTLIST_IDS));
  const [customCars, setCustomCars] = useState(() => lsGet("as_custom", []));
  const [s, setS]                   = useState(() => ({...DEF_S, ...lsGet("as_settings", {})}));
  const [f, setF]                   = useState(DEF_F);
  const [selected, setSelected]     = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Persist garage, custom cars, and settings whenever they change
  useEffect(() => lsSet("as_garage",   garageIds),  [garageIds]);
  useEffect(() => lsSet("as_custom",   customCars), [customCars]);
  useEffect(() => lsSet("as_settings", s),          [s]);

  const allCars    = useMemo(()=>[...LIBRARY, ...customCars],[customCars]);
  const garageCars = useMemo(()=>garageIds.map(id=>allCars.find(c=>c.id===id)).filter(Boolean),[garageIds,allCars]);

  function addToGarage(id)    { if (!garageIds.includes(id)) setGarageIds(g=>[...g,id]); }
  function removeFromGarage(id) { setGarageIds(g=>g.filter(x=>x!==id)); setSelected(s=>s.filter(x=>x!==id)); }
  function toggleSelect(id)   { setSelected(s=>s.includes(id)?s.filter(x=>x!==id):s.length<4?[...s,id]:s); }
  function addCustom(car)     { setCustomCars(c=>[...c,car]); addToGarage(car.id); setView("garage"); }
  function resetAll() {
    setGarageIds(SHORTLIST_IDS); setCustomCars([]); setS(DEF_S);
    lsSet("as_garage", SHORTLIST_IDS); lsSet("as_custom", []); lsSet("as_settings", DEF_S);
  }

  const TABS = [
    { k:"library", l:`LIBRARY (${allCars.length})` },
    { k:"garage",  l:`MY GARAGE (${garageIds.length})` },
    { k:"add",     l:"+ ADD CAR" },
  ];

  return (
    <div style={{fontFamily:BODY, background:C.bg, color:C.t1, minHeight:"100vh"}}>
      <style>{`
        * { box-sizing: border-box; }
        input[type=range] { -webkit-appearance:none; width:100%; height:4px; background:${C.s1}; border-radius:2px; outline:none; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:${C.blue}; cursor:pointer; }
        input[type=range]::-moz-range-thumb { width:18px; height:18px; border-radius:50%; background:${C.blue}; cursor:pointer; border:none; }
        button { touch-action: manipulation; }
        button:focus { outline:none; }
        input:focus, select:focus { border-color:${C.blue} !important; }
        input, select, button { font-size: 16px; }
        @media (min-width: 640px) { input, select, button { font-size: inherit; } }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{background:`linear-gradient(150deg,#0e1d35 0%,${C.bg} 70%)`,
        borderBottom:`1px solid ${C.bdr}`, position:"sticky", top:0, zIndex:100}}>
        {m ? (
          /* ── Mobile header: logo+settings row, then scrollable tabs row ── */
          <div>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"10px 14px"}}>
              <div>
                <span style={{fontFamily:COND, fontWeight:900, fontSize:20, letterSpacing:"-0.01em", color:C.t1}}>
                  <span style={{color:C.blue}}>AUTO</span>SCOUT
                </span>
                <div style={{fontFamily:COND, fontSize:8, color:C.t5, letterSpacing:"0.15em", marginTop:-1}}>
                  ONTARIO · JUNE 2026
                </div>
              </div>
              <button onClick={()=>setShowSettings(x=>!x)}
                style={{background:showSettings?C.blueLo:"none",
                  border:showSettings?`1px solid ${C.blue}33`:"1px solid transparent",
                  borderRadius:6, color:showSettings?C.blue:C.t4,
                  cursor:"pointer", fontFamily:COND, fontSize:11, fontWeight:700,
                  letterSpacing:"0.08em", padding:"8px 12px"}}>
                ⚙ SETTINGS
              </button>
            </div>
            <div style={{display:"flex", borderTop:`1px solid ${C.bdr}`,
              overflowX:"auto", WebkitOverflowScrolling:"touch"}}>
              {TABS.map(t=>(
                <button key={t.k} onClick={()=>setView(t.k)}
                  style={{fontFamily:COND, fontWeight:700, fontSize:11, letterSpacing:"0.06em",
                    padding:"10px 16px", border:"none", cursor:"pointer", background:"transparent",
                    flexShrink:0, whiteSpace:"nowrap",
                    color: view===t.k ? C.t1 : C.t4,
                    borderBottom: `2px solid ${view===t.k ? C.blue : "transparent"}`,
                    transition:"color .1s"}}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Desktop header: single row ── */
          <div style={{maxWidth:960, margin:"0 auto", padding:"0 20px",
            display:"flex", alignItems:"center", gap:24, height:54}}>
            <div style={{flexShrink:0}}>
              <span style={{fontFamily:COND, fontWeight:900, fontSize:22, letterSpacing:"-0.01em", color:C.t1}}>
                <span style={{color:C.blue}}>AUTO</span>SCOUT
              </span>
              <div style={{fontFamily:COND, fontSize:8, color:C.t5, letterSpacing:"0.15em", marginTop:-2}}>
                ONTARIO · JUNE 2026 · KINCARDINE
              </div>
            </div>
            <div style={{display:"flex", gap:0, flex:1}}>
              {TABS.map(t=>(
                <button key={t.k} onClick={()=>setView(t.k)}
                  style={{fontFamily:COND, fontWeight:700, fontSize:11, letterSpacing:"0.08em",
                    padding:"0 14px", height:54, border:"none", cursor:"pointer", background:"transparent",
                    color: view===t.k ? C.t1 : C.t4,
                    borderBottom: `2px solid ${view===t.k ? C.blue : "transparent"}`,
                    transition:"color .1s", whiteSpace:"nowrap"}}>
                  {t.l}
                </button>
              ))}
            </div>
            <button onClick={()=>setShowSettings(x=>!x)}
              style={{background:showSettings?C.blueLo:"none",
                border:showSettings?`1px solid ${C.blue}33`:"1px solid transparent",
                borderRadius:6, color:showSettings?C.blue:C.t4,
                cursor:"pointer", fontFamily:COND, fontSize:11, fontWeight:700,
                letterSpacing:"0.08em", padding:"5px 12px", transition:"all .15s"}}>
              ⚙ SETTINGS
            </button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && <SettingsPanel s={s} setS={setS} onReset={resetAll} />}

      {/* ── CONTENT ── */}
      <div style={{maxWidth:960, margin:"0 auto", padding: m ? "16px 12px" : "24px 20px"}}>
        {/* Section heading */}
        <div style={{marginBottom:16}}>
          <h2 style={{fontFamily:COND, fontWeight:700, fontSize: m ? 20 : 24, letterSpacing:"0.03em", color:C.t1, margin:0}}>
            {view==="library" ? "VEHICLE LIBRARY"
            : view==="garage" ? "MY GARAGE"
            : "ADD A VEHICLE"}
          </h2>
          <p style={{fontFamily:BODY, fontSize:12, color:C.t4, margin:"4px 0 0", lineHeight:1.5}}>
            {view==="library" ? `${allCars.length} vehicles — click settings to adjust fuel prices and annual distance`
            : view==="garage" ? `${garageIds.length} vehicles — check 2–4 in Overview to compare`
            : "Add any vehicle to compare alongside presets"}
          </p>
        </div>

        {view==="library" && <LibraryView allCars={allCars} garageIds={garageIds} onAdd={addToGarage} onRemove={removeFromGarage} s={s} />}
        {view==="garage"  && <GarageView  garageCars={garageCars} selected={selected} onSelect={toggleSelect}
          onRemove={removeFromGarage} s={s} f={f} setF={setF} />}
        {view==="add"     && <AddCarView  onAdd={addCustom} />}

        {/* Footer */}
        <div style={{marginTop:40, paddingTop:16, borderTop:`1px solid ${C.bdr}`,
          fontFamily:BODY, fontSize:11, color:C.t5, lineHeight:1.9}}>
          <strong style={{color:C.t4}}>Assumptions:</strong> Insurance at Ontario provincial averages, clean record, full coverage, driver 30–55.
          Home electricity default 14¢/kWh (Ontario TOU off-peak all-in). Supercharger 48¢/kWh.
          5-year total = (fuel + insurance + maintenance) × 5 + depreciation. Excludes financing interest, taxes, and fees.
          Used car market prices sourced from <a href="https://www.autotrader.ca" target="_blank" style={{color:C.blue, textDecoration:"none"}}>AutoTrader.ca</a> and <a href="https://www.cargurus.ca" target="_blank" style={{color:C.blue, textDecoration:"none"}}>CarGurus.ca</a> (June 2026).
          <strong style={{color:C.t4}}> ⚠️ Winter note:</strong> EV range drops 25–40% below −15°C — relevant for Kincardine area.
        </div>
      </div>
    </div>
  );
}
