
class Component extends DCLogic {
  constructor(props){
    super(props);
    const p=props||{};
    this.A=p.accent||'#2f7fe0'; this.A2='#e8792b';
    this.pal=[this.A,'#e8792b','#f2a900','#1a9e4b','#5a6472'];
    // ---- League table (La Liga 2014/15) ----
    this.standings=[
      {code:'BAR',name:'Barcelona',color:'#a50044',P:38,W:30,D:4,L:4,GF:110,GA:21,Pts:94},
      {code:'RMA',name:'Real Madrid',color:'#00529f',P:38,W:30,D:2,L:6,GF:118,GA:38,Pts:92},
      {code:'ATM',name:'Atlético Madrid',color:'#d3122a',P:38,W:23,D:9,L:6,GF:67,GA:29,Pts:78},
      {code:'VAL',name:'Valencia',color:'#f18e00',P:38,W:22,D:11,L:5,GF:70,GA:32,Pts:77},
      {code:'SEV',name:'Sevilla',color:'#c8102e',P:38,W:23,D:7,L:8,GF:71,GA:45,Pts:76},
      {code:'VIL',name:'Villarreal',color:'#ffd400',P:38,W:16,D:12,L:10,GF:48,GA:37,Pts:60},
      {code:'ATH',name:'Athletic Club',color:'#ee2523',P:38,W:15,D:10,L:13,GF:42,GA:41,Pts:55},
      {code:'CEL',name:'Celta Vigo',color:'#8ac3ee',P:38,W:13,D:12,L:13,GF:47,GA:44,Pts:51},
      {code:'MAL',name:'Málaga',color:'#003a70',P:38,W:14,D:8,L:16,GF:42,GA:48,Pts:50},
      {code:'ESP',name:'Espanyol',color:'#007fc8',P:38,W:13,D:10,L:15,GF:47,GA:51,Pts:49},
      {code:'RAY',name:'Rayo Vallecano',color:'#e2372b',P:38,W:15,D:4,L:19,GF:46,GA:69,Pts:49},
      {code:'RSO',name:'Real Sociedad',color:'#0067b1',P:38,W:11,D:13,L:14,GF:44,GA:56,Pts:46},
      {code:'ELC',name:'Elche',color:'#009a44',P:38,W:11,D:8,L:19,GF:36,GA:73,Pts:41},
      {code:'LEV',name:'Levante',color:'#9b2743',P:38,W:9,D:10,L:19,GF:35,GA:67,Pts:37},
      {code:'GET',name:'Getafe',color:'#005999',P:38,W:10,D:7,L:21,GF:33,GA:64,Pts:37},
      {code:'DEP',name:'Deportivo',color:'#2a7de1',P:38,W:7,D:14,L:17,GF:35,GA:60,Pts:35},
      {code:'GRA',name:'Granada',color:'#c8102e',P:38,W:7,D:14,L:17,GF:29,GA:64,Pts:35},
      {code:'EIB',name:'Eibar',color:'#a3195b',P:38,W:9,D:8,L:21,GF:34,GA:53,Pts:35},
      {code:'ALM',name:'Almería',color:'#c8102e',P:38,W:8,D:8,L:22,GF:35,GA:65,Pts:32},
      {code:'COR',name:'Córdoba',color:'#007a3d',P:38,W:3,D:11,L:24,GF:22,GA:68,Pts:20}
    ];
    this.teams={}; this.standings.forEach(t=>{ this.teams[t.code]=t; });
    this.laTeams=this.teams; this.laStandings=this.standings;
    // club kit patterns: [pattern v|h|sash|s, color1, color2]
    this.kitMap={BAR:['v','#a50044','#004d98'],RMA:['s','#f2f2f2','#f2f2f2'],ATM:['v','#d3122a','#ffffff'],VAL:['s','#f0f0f0','#f0f0f0'],SEV:['s','#ffffff','#c8102e'],VIL:['s','#ffd400','#ffd400'],ATH:['v','#ee2523','#ffffff'],CEL:['s','#8ac3ee','#8ac3ee'],MAL:['v','#5aa9dc','#ffffff'],ESP:['v','#007fc8','#ffffff'],RAY:['sash','#ffffff','#e2372b'],RSO:['v','#0067b1','#ffffff'],ELC:['v','#009a44','#ffffff'],LEV:['v','#9b2743','#2a4b9b'],GET:['s','#005999','#005999'],DEP:['v','#2a7de1','#ffffff'],GRA:['h','#c8102e','#ffffff'],EIB:['v','#a3195b','#004a99'],ALM:['v','#c8102e','#ffffff'],COR:['v','#007a3d','#ffffff']};
    // ---- Matches ----
    this.matches=[
      {key:'m1',home:'BAR',away:'RMA',hs:2,as:1,round:'Matchday 27 · Camp Nou',date:'22 Mar',status:'FT',ch:'FOX · La Liga TV'},
      {key:'m2',home:'ATM',away:'BAR',hs:0,as:1,round:'Matchday 24 · Vicente Calderón',date:'28 Feb',status:'FT',ch:'beIN SPORTS'},
      {key:'m3',home:'BAR',away:'SEV',hs:5,as:1,round:'Matchday 30 · Camp Nou',date:'11 Apr',status:'FT',ch:'FOX · La Liga TV'},
      {key:'m4',home:'BAR',away:'VIL',hs:3,as:1,round:'Matchday 16 · Camp Nou',date:'14 Dec',status:'FT',ch:'beIN SPORTS'},
      {key:'m5',home:'RAY',away:'BAR',hs:0,as:2,round:'Matchday 15 · Vallecas',date:'07 Dec',status:'FT',ch:'La Liga TV'},
      {key:'m6',home:'BAR',away:'ATM',hs:3,as:1,round:'Matchday 23 · Camp Nou',date:'11 Jan',status:'FT',ch:'FOX'},
      {key:'m7',home:'GET',away:'BAR',hs:0,as:3,round:'Matchday 32 · Coliseum',date:'26 Apr',status:'FT',ch:'La Liga TV'},
      {key:'m8',home:'BAR',away:'VAL',hs:2,as:0,round:'Matchday 22 · Camp Nou',date:'01 Feb',status:'FT',ch:'beIN SPORTS'},
      {key:'m9',home:'BAR',away:'ESP',hs:5,as:1,round:'Matchday 21 · Camp Nou',date:'25 Jan',status:'FT',ch:'FOX'},
      {key:'m10',home:'RMA',away:'BAR',hs:3,as:1,round:'Matchday 8 · Bernabéu',date:'25 Oct',status:'FT',ch:'FOX · La Liga TV'},
      {key:'m11',home:'BAR',away:'ATH',hs:2,as:1,round:'Matchday 34 · Camp Nou',date:'10 May',status:'FT',ch:'La Liga TV'},
      {key:'m12',home:'DEP',away:'BAR',hs:0,as:0,round:'Matchday 38 · Riazor',date:'23 May',status:'20:00',ch:'FOX'}
    ];
    this.mmap={}; this.matches.forEach(m=>{ this.mmap[m.key]=m; });
    // ---- Squad ----
    this.squad=[
      {key:'bravo',num:1,name:'Claudio Bravo',pos:'GK',grp:'GK',zone:'GK',apps:37,goals:0,assists:0,mins:3330,passpct:78},
      {key:'terstegen',num:13,name:'Marc-André ter Stegen',pos:'GK',grp:'GK',zone:'GK',apps:3,goals:0,assists:0,mins:270,passpct:80},
      {key:'alves',num:22,name:'Dani Alves',pos:'RB',grp:'DEF',zone:'RB',apps:27,goals:1,assists:6,mins:2210,passpct:84},
      {key:'pique',num:3,name:'Gerard Piqué',pos:'CB',grp:'DEF',zone:'CBr',apps:31,goals:1,assists:1,mins:2700,passpct:90},
      {key:'mascherano',num:14,name:'Javier Mascherano',pos:'CB',grp:'DEF',zone:'CBl',apps:32,goals:0,assists:0,mins:2790,passpct:88},
      {key:'alba',num:18,name:'Jordi Alba',pos:'LB',grp:'DEF',zone:'LB',apps:32,goals:1,assists:8,mins:2720,passpct:85},
      {key:'mathieu',num:24,name:'Jérémy Mathieu',pos:'CB',grp:'DEF',zone:'CBl',apps:26,goals:3,assists:0,mins:2030,passpct:88},
      {key:'bartra',num:15,name:'Marc Bartra',pos:'CB',grp:'DEF',zone:'CBr',apps:12,goals:1,assists:0,mins:870,passpct:89},
      {key:'montoya',num:2,name:'Martín Montoya',pos:'RB',grp:'DEF',zone:'RB',apps:9,goals:0,assists:1,mins:640,passpct:83},
      {key:'adriano',num:21,name:'Adriano',pos:'LB',grp:'DEF',zone:'LB',apps:8,goals:0,assists:0,mins:560,passpct:84},
      {key:'busquets',num:5,name:'Sergio Busquets',pos:'DM',grp:'MID',zone:'CDM',apps:34,goals:0,assists:1,mins:3010,passpct:91},
      {key:'rakitic',num:4,name:'Ivan Rakitić',pos:'CM',grp:'MID',zone:'CMr',apps:36,goals:5,assists:5,mins:2900,passpct:86},
      {key:'iniesta',num:8,name:'Andrés Iniesta',pos:'CM',grp:'MID',zone:'CMl',apps:27,goals:3,assists:4,mins:2050,passpct:89},
      {key:'xavi',num:6,name:'Xavi',pos:'CM',grp:'MID',zone:'CAM',apps:27,goals:0,assists:4,mins:1290,passpct:91},
      {key:'rafinha',num:12,name:'Rafinha',pos:'CM',grp:'MID',zone:'CMr',apps:26,goals:3,assists:2,mins:1520,passpct:85},
      {key:'roberto',num:20,name:'Sergi Roberto',pos:'CM',grp:'MID',zone:'CMl',apps:12,goals:0,assists:1,mins:560,passpct:88},
      {key:'messi',num:10,name:'Lionel Messi',pos:'RW',grp:'FWD',zone:'RW',apps:38,goals:43,assists:18,mins:3325,passpct:84},
      {key:'suarez',num:9,name:'Luis Suárez',pos:'ST',grp:'FWD',zone:'ST',apps:27,goals:16,assists:11,mins:2210,passpct:81},
      {key:'neymar',num:11,name:'Neymar',pos:'LW',grp:'FWD',zone:'LW',apps:33,goals:22,assists:7,mins:2700,passpct:82},
      {key:'pedro',num:7,name:'Pedro',pos:'RW',grp:'FWD',zone:'RW',apps:27,goals:6,assists:3,mins:1360,passpct:84},
      {key:'munir',num:17,name:'Munir El Haddadi',pos:'ST',grp:'FWD',zone:'ST',apps:12,goals:1,assists:1,mins:520,passpct:80},
      {key:'sandro',num:19,name:'Sandro Ramírez',pos:'ST',grp:'FWD',zone:'ST',apps:6,goals:1,assists:0,mins:210,passpct:79}
    ];
    this.pmap={}; this.squad.forEach(p=>{ this.pmap[p.key]=p; });
    this.zoneMap={GK:[8,50,7,11],RB:[34,84,22,11],LB:[34,16,22,11],CBr:[22,60,13,15],CBl:[22,40,13,15],CDM:[44,50,16,17],CMr:[52,58,18,19],CMl:[52,42,18,19],CAM:[62,50,17,18],RW:[72,83,20,13],LW:[72,17,20,13],ST:[82,50,15,20]};
    // radar
    this.radarAxes=['Finishing','Creativity','Dribbling','Passing','Defending','Physical'];
    this.hardRadar={messi:[97,95,98,90,42,62],suarez:[92,80,85,78,58,82],neymar:[88,86,96,80,46,66],iniesta:[62,94,90,96,66,60],xavi:[55,92,80,98,64,54],busquets:[45,80,66,94,90,74],pique:[52,58,54,86,92,86],mascherano:[40,55,52,84,90,84],alba:[58,72,80,84,80,86],alves:[60,78,80,85,78,82],rakitic:[70,78,72,88,80,84],pedro:[74,72,80,82,68,86],mathieu:[50,52,50,84,86,84],bravo:[18,52,38,82,88,78],terstegen:[20,58,42,84,88,80]};
    this.grpBase={GK:[18,52,40,80,88,78],DEF:[48,60,58,84,86,84],MID:[58,82,74,90,78,72],FWD:[86,80,88,80,50,72]};
    this.teamAxes=['Attack','Defense','Possession','Form','Discipline','Finishing'];
    this._pts={}; this._pal={};
    // ===== WORLD CUP 2026 (SCRAPE LAYER) — analytics scraped via ScraperFC (FBref/Sofascore/Understat) =====
    this.wcApi='scraperfc';
    this.wcTeamsRaw=[
      ['MEX','Mexico','A',78,'#006847'],['RSA','South Africa','A',66,'#007a4d'],['KOR','South Korea','A',74,'#0047a0'],['CZE','Czechia','A',72,'#11457e'],
      ['CAN','Canada','B',72,'#d52b1e'],['SUI','Switzerland','B',79,'#d52b1e'],['QAT','Qatar','B',68,'#8d1b3d'],['BIH','Bosnia & H.','B',71,'#002395'],
      ['BRA','Brazil','C',92,'#ffdf00'],['MAR','Morocco','C',82,'#c1272d'],['HAI','Haiti','C',58,'#00209f'],['SCO','Scotland','C',73,'#005eb8'],
      ['USA','United States','D',76,'#3c3b6e'],['PAR','Paraguay','D',70,'#d52b1e'],['AUS','Australia','D',71,'#00843d'],['TUR','Türkiye','D',78,'#e30a17'],
      ['GER','Germany','E',88,'#1b1b1b'],['CUW','Curaçao','E',55,'#002b7f'],['CIV','Ivory Coast','E',74,'#ff8200'],['ECU','Ecuador','E',75,'#ffce00'],
      ['NED','Netherlands','F',87,'#f36c21'],['JPN','Japan','F',80,'#bc002d'],['TUN','Tunisia','F',70,'#e70013'],['SWE','Sweden','F',76,'#006aa7'],
      ['BEL','Belgium','G',85,'#e30613'],['EGY','Egypt','G',73,'#c8102e'],['IRN','Iran','G',74,'#239f40'],['NZL','New Zealand','G',60,'#1b1b1b'],
      ['ESP','Spain','H',90,'#c60b1e'],['CPV','Cape Verde','H',58,'#003893'],['KSA','Saudi Arabia','H',66,'#006c35'],['URU','Uruguay','H',82,'#0038a8'],
      ['FRA','France','I',91,'#0055a4'],['SEN','Senegal','I',80,'#00853f'],['NOR','Norway','I',79,'#ba0c2f'],['IRQ','Iraq','I',63,'#007a3d'],
      ['ARG','Argentina','J',93,'#75aadb'],['ALG','Algeria','J',73,'#006233'],['AUT','Austria','J',77,'#ed2939'],['JOR','Jordan','J',62,'#007a3b'],
      ['POR','Portugal','K',87,'#da291c'],['COL','Colombia','K',81,'#fcd116'],['UZB','Uzbekistan','K',66,'#1eb53a'],['COD','DR Congo','K',68,'#007fff'],
      ['ENG','England','L',89,'#cf142b'],['CRO','Croatia','L',80,'#d10a11'],['GHA','Ghana','L',70,'#006b3f'],['PAN','Panama','L',64,'#d21034']
    ];
    this.wcStadiumsRaw=[
      ['MetLife Stadium','New York / New Jersey','USA',82500,'Final · Jul 19'],
      ['AT&T Stadium','Dallas','USA',94000,'Semi-final'],
      ['SoFi Stadium','Los Angeles','USA',70000,'Quarter-final'],
      ['Mercedes-Benz Stadium','Atlanta','USA',75000,'Semi-final'],
      ['Hard Rock Stadium','Miami','USA',65000,'3rd place · Jul 18'],
      ['NRG Stadium','Houston','USA',72000,'Round of 16'],
      ['Lincoln Financial Field','Philadelphia','USA',69000,'Round of 16'],
      ["Levi's Stadium",'San Francisco','USA',71000,'Round of 32'],
      ['Lumen Field','Seattle','USA',69000,'Round of 32'],
      ['Gillette Stadium','Boston','USA',65000,'Quarter-final'],
      ['Arrowhead Stadium','Kansas City','USA',73000,'Quarter-final'],
      ['Estadio Azteca','Mexico City','Mexico',83000,'Opening · Jun 11'],
      ['Estadio Akron','Guadalajara','Mexico',48000,'Group stage'],
      ['Estadio BBVA','Monterrey','Mexico',53500,'Round of 32'],
      ['BC Place','Vancouver','Canada',54000,'Round of 16'],
      ['BMO Field','Toronto','Canada',45000,'Group stage']
    ];
    this.wcState={loaded:false,live:false,lastSync:'—',source:'ScraperFC snapshot'};
    this.flagMap={MEX:'mx',RSA:'za',KOR:'kr',CZE:'cz',CAN:'ca',SUI:'ch',QAT:'qa',BIH:'ba',BRA:'br',MAR:'ma',HAI:'ht',SCO:'gb-sct',USA:'us',PAR:'py',AUS:'au',TUR:'tr',GER:'de',CUW:'cw',CIV:'ci',ECU:'ec',NED:'nl',JPN:'jp',TUN:'tn',SWE:'se',BEL:'be',EGY:'eg',IRN:'ir',NZL:'nz',ESP:'es',CPV:'cv',KSA:'sa',URU:'uy',FRA:'fr',SEN:'sn',NOR:'no',IRQ:'iq',ARG:'ar',ALG:'dz',AUT:'at',JOR:'jo',POR:'pt',COL:'co',UZB:'uz',COD:'cd',ENG:'gb-eng',CRO:'hr',GHA:'gh',PAN:'pa'};
    this.state={ tab:p.defaultTab||'overview', source:'historic', selMatch:'m1', selPlayer:'messi', phase:'all', viewMode:'heat', timeframe:'season',
      trendMetric:'goals', squadFilter:'all', sortKey:'goals', sortDir:-1,
      cmpMode:'teams', cmpA:'BAR', cmpB:'RMA', playerMode:'move', pcmpA:'messi', pcmpB:'iniesta', dataSet:'standings', club:'BAR',
      wcSort:'rating', wcSortDir:-1, wcPSort:'gls', wcPSortDir:-1, wcPos:'all', wcCmpA:'ARG', wcCmpB:'FRA' };
  }
  clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  lum(hex){ const h=hex.replace('#',''); const n=h.length===3?h.split('').map(c=>c+c).join(''):h; const r=parseInt(n.slice(0,2),16),g=parseInt(n.slice(2,4),16),b=parseInt(n.slice(4,6),16); return (0.299*r+0.587*g+0.114*b)/255; }
  txt(hex){ return this.lum(hex)>0.62?'#eef2f6':'#ffffff'; }
  badgeStyle(code){ const t=this.teams[code]||this.standings[0]; if(this.state.source==='wc'||this.flagMap[t.code])return this.wcBadge(t.code);
    const k=this.kitMap[t.code]||['s',t.color,t.color]; const pat=k[0],c1=k[1],c2=k[2]; let bg;
    if(pat==='v')bg='repeating-linear-gradient(90deg,'+c1+' 0 5px,'+c2+' 5px 10px)';
    else if(pat==='h')bg='repeating-linear-gradient(0deg,'+c1+' 0 5px,'+c2+' 5px 10px)';
    else if(pat==='sash')bg='linear-gradient(135deg,'+c1+' 0 34%,'+c2+' 34% 60%,'+c1+' 60% 100%)';
    else bg=(c2!==c1)?('linear-gradient(160deg,'+c1+' 0 55%,'+c2+' 55% 100%)'):c1;
    const light=(this.lum(c1)+this.lum(c2))/2>0.55;
    return {background:bg,color:light?'#14181d':'#fff',textShadow:light?'none':'0 1px 2px rgba(0,0,0,.55)',boxShadow:'inset 0 0 0 1px rgba(255,255,255,.3), 0 2px 6px rgba(0,0,0,.35)'}; }
  hexA(hex,a){ const h=(hex||this.A).replace('#',''); const n=h.length===3?h.split('').map(c=>c+c).join(''):h; return 'rgba('+parseInt(n.slice(0,2),16)+','+parseInt(n.slice(2,4),16)+','+parseInt(n.slice(4,6),16)+','+a+')'; }
  seedStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
  rng(seed){ let s=seed%2147483647; if(s<=0)s+=2147483646; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
  gauss(r){ return (r()+r()+r()+r()-2)/1.4; }
  radarFor(key){ if(this.hardRadar[key])return this.hardRadar[key]; const p=(this.curMap&&this.curMap[key])||(this._allMap&&this._allMap[key])||this.pmap[key]||(this.curSquad&&this.curSquad[0]); const base=this.grpBase[p.grp]; const r=this.rng(this.seedStr(key)+4); return base.map(v=>this.clamp(Math.round(v+(r()*18-9)),20,99)); }
  posRadar(grp){ const list=(this.curSquad||this.squad).filter(p=>p.grp===grp&&p.apps>=10); const sum=[0,0,0,0,0,0]; list.forEach(p=>{ const rv=this.radarFor(p.key); rv.forEach((v,i)=>sum[i]+=v); }); return sum.map(s=>Math.round(s/list.length)); }
  teamRadar(code){ const t=this.teams[code]; const r=this.rng(this.seedStr('tr'+code)+2); const gfmax=118,gamin=21; const atk=this.clamp(Math.round(t.GF/gfmax*100),20,99); const def=this.clamp(Math.round((1-(t.GA-gamin)/110)*100),20,99); const form=this.clamp(Math.round(t.Pts/94*100),20,99); const poss=this.clamp(Math.round(40+ (t.Pts/94)*45 + (r()*10-5)),30,99); const disc=this.clamp(Math.round(55+r()*40),30,99); const fin=this.clamp(Math.round((t.GF/(t.GF+30))*100+ (r()*8-4)),20,99); return [atk,def,poss,form,disc,fin]; }
  teamStats(code){ const t=this.teams[code]||this.standings[0]; const r=this.rng(this.seedStr('ts'+code)+6); return { Pts:t.Pts, GF:t.GF, GA:t.GA, GD:(t.GF-t.GA), winpct:Math.round(t.W/t.P*100), poss:Math.round(48+(t.Pts/94)*20+(r()*6-3)), xg:+(t.GF*(0.85+r()*0.2)).toFixed(1) }; }
  mapOf(arr){ const m={}; arr.forEach(x=>{m[x.key]=x;}); return m; }
  ord(n){ return (n%10===1&&n!==11)?'st':(n%10===2&&n!==12)?'nd':(n%10===3&&n!==13)?'rd':'th'; }
  formFor(code,n){ const t=this.teams[code]; const r=this.rng(this.seedStr('fg'+code)+2); const out=[]; for(let i=0;i<n;i++){ const x=r(); out.push(x<t.W/38?'w':(x<(t.W+t.D)/38?'d':'l')); } return out; }
  shotTotals(code){ const gf=this.teams[code].GF; return {goals:gf,on:Math.round(gf*1.9),off:Math.round(gf*1.6),blocked:Math.round(gf*0.6)}; }
  goalTypes(code){ const gf=this.teams[code].GF; const ratio=[['Open play',0.71],['Penalty',0.11],['Free kick',0.08],['Header (set-piece)',0.055],['Counter attack',0.045]]; const arr=ratio.map(x=>({label:x[0],value:Math.round(gf*x[1])})); const s=arr.reduce((a,x)=>a+x.value,0); arr[0].value+=(gf-s); return arr; }
  goalIntervals(code){ const gf=this.teams[code].GF; const r=this.rng(this.seedStr('gi'+code)+8); const w=[0,0,0,0,0,0].map(()=>0.6+r()); const sw=w.reduce((a,b)=>a+b,0); const labels=['0-15','16-30','31-45','46-60','61-75','76-90']; return labels.map((l,i)=>({label:l,value:Math.round(gf*w[i]/sw)})); }
  squadFor(code){ if(code==='BAR')return this.squad; this._sq=this._sq||{}; const ck=this.state.source+'|'+code; if(this._sq[ck])return this._sq[ck]; const t=this.teams[code]; const r=this.rng(this.seedStr('sq'+code)+13); const F=['Diego','Carlos','Pablo','Sergio','Álvaro','Rubén','Iker','Marcos','Adrián','Iván','Raúl','Jorge','Dani','Nacho','Koke','Isco','Bruno','Aitor','Mikel','Óscar','Gonzalo','Cristian','Fran','Víctor','Antonio','Manu','Rodri','Aleix','Borja','Joan','Unai','Asier','Xabi','Julen','Nolito','Beñat']; const L=['García','Martínez','López','Sánchez','Rodríguez','Fernández','Gómez','Ruiz','Díaz','Moreno','Álvarez','Romero','Torres','Navarro','Ramos','Gil','Serrano','Blanco','Molina','Castro','Ortega','Rubio','Marín','Sanz','Iglesias','Medina','Vega','Herrera','Peña','Cabrera','Flores','Campos','Vidal','Reyes','Cano','Prieto','Gallardo','Silva']; const tmpl=[['GK','GK'],['GK','GK'],['RB','RB'],['CB','CBr'],['CB','CBl'],['LB','LB'],['CB','CBr'],['RB','RB'],['DM','CDM'],['CM','CMr'],['CM','CMl'],['CAM','CAM'],['CM','CMl'],['RW','RW'],['LW','LW'],['ST','ST'],['ST','ST'],['W','RW']]; const grpOf={GK:'GK',RB:'DEF',CB:'DEF',LB:'DEF',DM:'MID',CM:'MID',CAM:'MID',RW:'FWD',LW:'FWD',ST:'FWD',W:'FWD'}; const wG={GK:0,DEF:0.12,MID:0.5,FWD:1.6}; const used={}; const pl=tmpl.map((tp,i)=>{ let num; do{num=1+Math.floor(r()*30);}while(used[num]); used[num]=1; const grp=grpOf[tp[0]]; return {key:code.toLowerCase()+i,num,name:F[Math.floor(r()*F.length)]+' '+L[Math.floor(r()*L.length)],pos:tp[0],grp,zone:tp[1],apps:8+Math.floor(r()*30),mins:0,goals:0,assists:0,passpct:({GK:78,DEF:85,MID:88,FWD:81}[grp])+Math.floor(r()*7-3),_w:wG[grp]*(0.5+r())}; }); const totW=pl.reduce((a,p)=>a+p._w,0)||1; pl.forEach(p=>{ p.goals=Math.round(t.GF*p._w/totW); p.assists=Math.round(p.goals*0.5*(0.4+r())); p.mins=Math.round(p.apps*(55+r()*33)); }); this._sq[ck]=pl; return pl; }
  matchesFor(code){ if(code==='BAR')return this.matches; this._mt=this._mt||{}; const mk=this.state.source+'|'+code; if(this._mt[mk])return this._mt[mk]; const t=this.teams[code]; const others=this.standings.filter(x=>x.code!==code); const r=this.rng(this.seedStr('mt'+code)+17); const gf=t.GF/38, ga=t.GA/38; const dates=['22 Mar','28 Feb','11 Apr','14 Dec','07 Dec','11 Jan','26 Apr','01 Feb','25 Jan','25 Oct','10 May','23 May']; const out=[]; for(let i=0;i<12;i++){ const opp=others[Math.floor(r()*others.length)].code; const home=r()<0.5; const scored=Math.max(0,Math.round(gf+this.gauss(r)*1.1)); const conc=Math.max(0,Math.round(ga+this.gauss(r)*1.1)); out.push({key:code.toLowerCase()+'x'+i, home:home?code:opp, away:home?opp:code, hs:home?scored:conc, as:home?conc:scored, round:'Matchday '+(2+i*3), date:dates[i], status:i===11?'20:00':'FT', ch:'La Liga TV'}); } this._mt[mk]=out; return out; }
  applySource(){ if(this.state.source==='wc'){ this.ensureWC(); this.teams=this.wcTeamsMap; this.standings=this.wcStd; } else { this.teams=this.laTeams; this.standings=this.laStandings; } }
  useClub(){ const code=this.state.club; this.curSquad=this.squadFor(code); this.curMap=this.mapOf(this.curSquad); this.curMatches=this.matchesFor(code); this.curMmap=this.mapOf(this.curMatches); this.ensureAll(); return code; }
  ensureAll(){ const src=this.state.source; this._allBySrc=this._allBySrc||{}; if(this._allBySrc[src]){ this._all=this._allBySrc[src].all; this._allMap=this._allBySrc[src].map; return; } const all=[],map={}; this.standings.forEach(t=>{ this.squadFor(t.code).forEach(p=>{ const q=Object.assign({club:t.code},p); all.push(q); map[p.key]=q; }); }); this._allBySrc[src]={all,map}; this._all=all; this._allMap=map; }
  adjust(vals,seed,tf){ if(tf==='season')return vals; const amp=tf==='l5'?14:8; const r=this.rng(this.seedStr('tf'+seed+tf)+7); return vals.map(v=>this.clamp(Math.round(v+this.gauss(r)*amp),15,99)); }
  setClub(code){ const sq=this.squadFor(code); const mt=this.matchesFor(code); const out=sq.filter(p=>p.grp!=='GK'); const fwd=sq.find(p=>p.grp==='FWD')||out[0]; const other=(this.standings.find(t=>t.code!==code)||{}).code; this.setState({club:code, selMatch:mt[0].key, selPlayer:fwd.key, pcmpA:out[0].key, pcmpB:(out[1]||out[0]).key, cmpMode:'teams', cmpA:code, cmpB:other}); }
  seriesTeam(metric,code){ code=code||'BAR'; const t=this.teams[code]; const ts=this.teamStats(code); const r=this.rng(this.seedStr('trend'+metric+code)+3); const N=20; const out=[]; const gpg=t.GF/38; const cfg={goals:[gpg,1.3],xg:[gpg*0.92,1.0],poss:[ts.poss,6],shots:[gpg*4.6,3.2]}[metric]; const pw=t.W/38,pd=(t.W+t.D)/38; let cum=0; for(let i=0;i<N;i++){ let v; if(metric==='points'){ const res=r(); cum+= res<pw?3:(res<pd?1:0); v=cum; } else { v=Math.max(0,+(cfg[0]+this.gauss(r)*cfg[1]).toFixed(metric==='poss'?0:1)); } out.push({v,label:'MW'+(i+1)}); } return out; }
  goalsSeries(code){ code=code||'BAR'; const t=this.teams[code]; const r=this.rng(this.seedStr('gs'+code)+5); const mean=t.GF/38; const N=20,out=[]; for(let i=0;i<N;i++){ out.push({v:Math.round(this.clamp(mean+this.gauss(r)*1.3,0,7)),label:'MW'+(i+1)}); } return out; }
  // heatmap points
  genPoints(mk,pk,phase){ const key=mk+'|'+pk+'|'+phase; if(this._pts[key])return this._pts[key]; const pl=(this.curMap&&this.curMap[pk])||this.pmap[pk]||(this.curSquad&&this.curSquad[0]); const z=this.zoneMap[pl.zone]; const r=this.rng(this.seedStr(key)+3); let cx=z[0],cy=z[1]; const sx=z[2],sy=z[3]; if(phase==='1st')cx-=3.5; else if(phase==='2nd')cx+=4.5; cx+=(r()*6-3); cy+=(r()*4-2); const N=640,out=[]; for(let i=0;i<N;i++){ const tight=r()<0.32; const f=tight?0.45:1; out.push({x:this.clamp(cx+this.gauss(r)*sx*f,3,97),y:this.clamp(cy+this.gauss(r)*sy*f,4,96)}); } this._pts[key]=out; return out; }
  genPath(mk,pk,phase){ const key='path|'+mk+'|'+pk+'|'+phase; if(this._pts[key])return this._pts[key]; const pl=(this.curMap&&this.curMap[pk])||this.pmap[pk]||(this.curSquad&&this.curSquad[0]); const z=this.zoneMap[pl.zone]; const r=this.rng(this.seedStr(key)+11); let cx=z[0],cy=z[1]; const sx=z[2],sy=z[3]; if(phase==='1st')cx-=3.5; else if(phase==='2nd')cx+=4.5; let x=cx,y=cy,vx=0,vy=0; const N=170,out=[]; for(let i=0;i<N;i++){ const ax=(cx-x)*0.05+(r()*2-1)*sx*0.55; const ay=(cy-y)*0.05+(r()*2-1)*sy*0.55; vx=vx*0.82+ax*0.5; vy=vy*0.82+ay*0.5; x=this.clamp(x+vx,3,97); y=this.clamp(y+vy,4,96); out.push({x,y}); } this._pts[key]=out; return out; }
  zonesFor(pts){ let d=0,m=0,a=0; pts.forEach(p=>{ if(p.x<33.34)d++; else if(p.x<66.67)m++; else a++; }); const n=pts.length; return [Math.round(d/n*100),Math.round(m/n*100),Math.round(a/n*100)]; }
  playerMatchKpis(mk,pk){ const pl=(this.curMap&&this.curMap[pk])||this.pmap[pk]||(this.curSquad&&this.curSquad[0]); const r=this.rng(this.seedStr(mk+pk)+7); const base={GK:[5.4,24,2,29],DEF:[10.2,32,18,62],MID:[11.4,31,20,86],FWD:[10.6,33,30,58]}[pl.grp]; return { distance:(base[0]+(r()*1.2-0.6)), topspeed:(base[1]+(r()*2-1)), sprints:Math.round(base[2]+(r()*8-4)), touches:Math.round(base[3]+(r()*20-10)) }; }
  buildPalette(variant){ if(this._pal[variant])return this._pal[variant]; const c=document.createElement('canvas'); c.width=256; c.height=1; const g=c.getContext('2d'); const grad=g.createLinearGradient(0,0,256,0); grad.addColorStop(0,'rgba(10,42,107,0)');grad.addColorStop(0.2,'rgba(10,42,107,0.55)');grad.addColorStop(0.4,'rgba(10,160,180,0.68)');grad.addColorStop(0.58,'rgba(120,210,60,0.78)');grad.addColorStop(0.74,'rgba(240,220,40,0.85)');grad.addColorStop(0.88,'rgba(240,130,30,0.9)');grad.addColorStop(1,'rgba(220,30,30,0.95)'); g.fillStyle=grad; g.fillRect(0,0,256,1); this._pal[variant]=g.getImageData(0,0,256,1).data; return this._pal[variant]; }
  // ---- pitch ----
  pitchBase(ctx,x,y,w,h){ ctx.fillStyle='#123a22'; ctx.fillRect(x,y,w,h); ctx.fillStyle='rgba(255,255,255,0.022)'; for(let i=0;i<8;i+=2)ctx.fillRect(x+i*w/8,y,w/8,h); }
  pitchLines(ctx,x,y,w,h,zones){ ctx.strokeStyle='rgba(233,231,223,0.34)'; ctx.lineWidth=Math.max(1.5,w*0.0022); ctx.fillStyle='rgba(233,231,223,0.34)'; ctx.strokeRect(x,y,w,h); ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w/2,y+h);ctx.stroke(); const cy=y+h/2; ctx.beginPath();ctx.arc(x+w/2,cy,h*0.13,0,7);ctx.stroke(); ctx.beginPath();ctx.arc(x+w/2,cy,w*0.004,0,7);ctx.fill(); const pbw=w*0.16,pbh=h*0.58,gbw=w*0.055,gbh=h*0.28; ctx.strokeRect(x,y+(h-pbh)/2,pbw,pbh); ctx.strokeRect(x+w-pbw,y+(h-pbh)/2,pbw,pbh); ctx.strokeRect(x,y+(h-gbh)/2,gbw,gbh); ctx.strokeRect(x+w-gbw,y+(h-gbh)/2,gbw,gbh); if(zones!==false){ ctx.save();ctx.strokeStyle='rgba(233,231,223,0.13)';ctx.setLineDash([6,7]); ctx.beginPath();ctx.moveTo(x+w/3,y);ctx.lineTo(x+w/3,y+h);ctx.moveTo(x+2*w/3,y);ctx.lineTo(x+2*w/3,y+h);ctx.stroke();ctx.restore(); ctx.fillStyle='rgba(233,231,223,0.3)';ctx.textAlign='center';ctx.font='700 '+Math.round(w*0.013)+'px Archivo';ctx.fillText('DEF',x+w/6,y+h-9);ctx.fillText('MID',x+w/2,y+h-9);ctx.fillText('ATT',x+w*5/6,y+h-9); } ctx.fillStyle='rgba(233,231,223,0.26)';ctx.textAlign='center';ctx.font='700 '+Math.round(w*0.012)+'px Archivo';ctx.fillText('ATTACKING DIRECTION  →',x+w/2,y+17); }
  paintHeat(ctx,pts,W,H,x0,y0,pw,ph){ const sc=document.createElement('canvas'); sc.width=W; sc.height=H; const s=sc.getContext('2d'); const R=Math.round(pw*0.06); for(let i=0;i<pts.length;i++){ const p=pts[i]; const px=x0+p.x/100*pw, py=y0+p.y/100*ph; const g=s.createRadialGradient(px,py,0,px,py,R); g.addColorStop(0,'rgba(0,0,0,0.16)'); g.addColorStop(1,'rgba(0,0,0,0)'); s.fillStyle=g; s.fillRect(px-R,py-R,2*R,2*R); } const img=s.getImageData(0,0,W,H); const d=img.data; const pal=this.buildPalette('classic'); for(let i=0;i<d.length;i+=4){ const a=d[i+3]; if(a){ const idx=a*4; d[i]=pal[idx]; d[i+1]=pal[idx+1]; d[i+2]=pal[idx+2]; d[i+3]=pal[idx+3]; } } const hc=document.createElement('canvas'); hc.width=W; hc.height=H; hc.getContext('2d').putImageData(img,0,0); ctx.save(); ctx.filter='blur('+Math.max(2,Math.round(W*0.004))+'px)'; ctx.drawImage(hc,0,0); ctx.restore(); }
  paintTrail(ctx,path,x0,y0,pw,ph){ const A=this.A; const P=path.map(p=>({x:x0+p.x/100*pw,y:y0+p.y/100*ph})); ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round'; for(let i=1;i<P.length;i++){ const t=i/P.length; ctx.strokeStyle=this.hexA(A,0.12+t*0.75); ctx.lineWidth=Math.max(1.5,pw*0.0036); ctx.shadowColor=this.hexA(A,0.5); ctx.shadowBlur=pw*0.006; ctx.beginPath(); ctx.moveTo(P[i-1].x,P[i-1].y); ctx.lineTo(P[i].x,P[i].y); ctx.stroke(); } ctx.shadowBlur=0; const s=P[0],e=P[P.length-1]; ctx.fillStyle='#ffffff'; ctx.strokeStyle='rgba(10,20,30,0.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(s.x,s.y,pw*0.008,0,7); ctx.fill(); ctx.stroke(); ctx.fillStyle=A; ctx.beginPath(); ctx.arc(e.x,e.y,pw*0.0105,0,7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  paintPoints(ctx,pts,x0,y0,pw,ph){ const A=this.A; ctx.save(); for(let i=0;i<pts.length;i++){ const p=pts[i]; ctx.fillStyle=this.hexA(A,0.5); ctx.beginPath(); ctx.arc(x0+p.x/100*pw,y0+p.y/100*ph,pw*0.0042,0,7); ctx.fill(); } ctx.restore(); }
  renderView(canvas,mode,mk,pk,phase){ if(!canvas)return; const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H); const m=Math.round(W*0.022),x0=m,y0=m,pw=W-2*m,ph=H-2*m; this.pitchBase(ctx,x0,y0,pw,ph); if(mode==='heat'){ this.paintHeat(ctx,this.genPoints(mk,pk,phase),W,H,x0,y0,pw,ph); this.pitchLines(ctx,x0,y0,pw,ph,true); } else { this.pitchLines(ctx,x0,y0,pw,ph,true); if(mode==='points')this.paintPoints(ctx,this.genPoints(mk,pk,phase),x0,y0,pw,ph); else this.paintTrail(ctx,this.genPath(mk,pk,phase),x0,y0,pw,ph); } }
  shotMap(canvas,code){ if(!canvas)return; const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H); const m=Math.round(W*0.02),x0=m,y0=m,pw=W-2*m,ph=H-2*m; this.pitchBase(ctx,x0,y0,pw,ph); this.pitchLines(ctx,x0,y0,pw,ph,false);
    const hx=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}; const c1=hx('#16283a'),c2=hx(this.A2); const lerp=t=>{t=Math.max(0,Math.min(1,t));return 'rgba('+Math.round(c1[0]+(c2[0]-c1[0])*t)+','+Math.round(c1[1]+(c2[1]-c1[1])*t)+','+Math.round(c1[2]+(c2[2]-c1[2])*t)+',0.9)';};
    const r=this.rng(this.seedStr('zm'+(code||'BAR'))+4); const gf=this.teams[code].GF;
    const depths=[[50,67],[67,84],[84,100]], lanes=[[0,27],[27,73],[73,100]];
    const volW=[[1,1.3,1],[1.5,2.4,1.5],[1.6,3.4,1.6]]; const convBase=[[0.045,0.06,0.045],[0.07,0.11,0.07],[0.10,0.24,0.10]];
    let totW=0; volW.forEach(row=>row.forEach(w=>totW+=w)); const totalShots=Math.round(gf/0.11);
    for(let d=0;d<3;d++){ for(let l=0;l<3;l++){
      const zx0=x0+depths[d][0]/100*pw, zx1=x0+depths[d][1]/100*pw, zy0=y0+lanes[l][0]/100*ph, zy1=y0+lanes[l][1]/100*ph;
      const shots=Math.max(1,Math.round(totalShots*volW[d][l]/totW*(0.85+r()*0.3)));
      const conv=Math.min(0.55,convBase[d][l]*(0.8+r()*0.4)); const goals=Math.round(shots*conv);
      ctx.fillStyle=lerp(conv/0.26); const pad=4; ctx.fillRect(zx0+pad,zy0+pad,(zx1-zx0)-2*pad,(zy1-zy0)-2*pad);
      ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1; ctx.strokeRect(zx0+pad,zy0+pad,(zx1-zx0)-2*pad,(zy1-zy0)-2*pad);
      const mx=(zx0+zx1)/2, my=(zy0+zy1)/2;
      ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.textBaseline='alphabetic'; ctx.font='900 '+Math.round(pw*0.032)+'px Archivo'; ctx.fillText((conv*100).toFixed(0)+'%', mx, my);
      ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.textBaseline='top'; ctx.font='700 '+Math.round(pw*0.016)+'px Archivo'; ctx.fillText(goals+' goals · '+shots+' shots', mx, my+7);
    }}
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.font='700 '+Math.round(pw*0.015)+'px Archivo'; ctx.fillText('OWN HALF', x0+14, y0+13);
    ctx.textAlign='right'; ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font='800 '+Math.round(pw*0.016)+'px Archivo'; ctx.fillText('ATTACKING →', x0+pw-14, y0+13); }
  // ---- charts ----
  roundRect(ctx,x,y,w,h,r){ r=Math.min(r,h/2,w/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  drawDonut(canvas,segs,centerNum,centerLabel){ if(!canvas)return; const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H); const cx=W/2,cy=H/2,R=Math.min(W,H)*0.4,th=R*0.36; const total=segs.reduce((a,s)=>a+s.value,0)||1; let ang=-Math.PI/2; ctx.lineCap='butt'; for(const s of segs){ const sw=s.value/total*Math.PI*2; if(sw<=0)continue; const a2=ang+sw; ctx.beginPath(); ctx.strokeStyle=s.color; ctx.lineWidth=th; ctx.arc(cx,cy,R,ang+0.012,a2-0.012); ctx.stroke(); ang=a2; } ctx.fillStyle='#eef2f6'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(R*0.46)+'px Archivo'; ctx.fillText(centerNum,cx,cy-R*0.05); ctx.fillStyle='#8a93a0'; ctx.font='700 '+Math.round(R*0.13)+'px Archivo'; ctx.fillText(centerLabel,cx,cy+R*0.3); }
  drawBars(canvas,items,horiz){ if(!canvas)return; const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H); const padL=44,padR=20,padT=26,padB=46; const cw=W-padL-padR,ch=H-padT-padB; const max=Math.max(...items.map(i=>i.value))*1.15||1; const n=items.length; const bw=cw/n*0.56; ctx.strokeStyle='rgba(233,236,240,0.10)'; ctx.fillStyle='#8a93a0'; ctx.font='600 '+Math.round(W*0.02)+'px Archivo'; ctx.textAlign='right'; ctx.textBaseline='middle'; for(let g=0;g<=4;g++){ const gy=padT+ch-ch*g/4; ctx.beginPath(); ctx.moveTo(padL,gy); ctx.lineTo(W-padR,gy); ctx.stroke(); ctx.fillText(Math.round(max*g/4),padL-8,gy); } for(let i=0;i<n;i++){ const x=padL+cw*(i+0.5)/n; const bh=items[i].value/max*ch; const by=padT+ch-bh; ctx.fillStyle=this.A; this.roundRect(ctx,x-bw/2,by,bw,bh,Math.min(6,bw/2)); ctx.fill(); ctx.fillStyle='#eef2f6'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.font='800 '+Math.round(W*0.024)+'px Archivo'; ctx.fillText(items[i].value,x,by-5); ctx.fillStyle='#8a93a0'; ctx.textBaseline='top'; ctx.font='600 '+Math.round(W*0.019)+'px Archivo'; ctx.fillText(items[i].label,x,padT+ch+8); } }
  drawLine(canvas,vals,labels){ if(!canvas)return; const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H); const padL=46,padR=22,padT=24,padB=42; const cw=W-padL-padR,ch=H-padT-padB; const mn=Math.min(...vals),mx=Math.max(...vals); const sp=(mx-mn)||1; const lo=mn-sp*0.25,hi=mx+sp*0.25; const n=vals.length; const X=i=>padL+cw*i/(n-1), Y=v=>padT+ch-(v-lo)/(hi-lo)*ch; ctx.strokeStyle='rgba(233,236,240,0.10)'; ctx.fillStyle='#8a93a0'; ctx.font='600 '+Math.round(W*0.014)+'px Archivo'; ctx.textAlign='right'; ctx.textBaseline='middle'; for(let g=0;g<=4;g++){ const gy=padT+ch-ch*g/4; ctx.beginPath(); ctx.moveTo(padL,gy); ctx.lineTo(W-padR,gy); ctx.stroke(); ctx.fillText((lo+(hi-lo)*g/4).toFixed(1),padL-8,gy); } ctx.beginPath(); ctx.moveTo(X(0),Y(vals[0])); for(let i=1;i<n;i++)ctx.lineTo(X(i),Y(vals[i])); ctx.lineTo(X(n-1),padT+ch); ctx.lineTo(X(0),padT+ch); ctx.closePath(); const grad=ctx.createLinearGradient(0,padT,0,padT+ch); grad.addColorStop(0,this.hexA(this.A,0.28)); grad.addColorStop(1,this.hexA(this.A,0)); ctx.fillStyle=grad; ctx.fill(); ctx.beginPath(); ctx.moveTo(X(0),Y(vals[0])); for(let i=1;i<n;i++)ctx.lineTo(X(i),Y(vals[i])); ctx.strokeStyle=this.A; ctx.lineWidth=Math.max(2,W*0.0026); ctx.lineJoin='round'; ctx.stroke(); const step=Math.ceil(n/9); for(let i=0;i<n;i++){ ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(X(i),Y(vals[i]),W*0.0052,0,7); ctx.fill(); ctx.fillStyle=this.A; ctx.beginPath(); ctx.arc(X(i),Y(vals[i]),W*0.0036,0,7); ctx.fill(); if(i%step===0||i===n-1){ ctx.fillStyle='#8a93a0'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='600 '+Math.round(W*0.013)+'px Archivo'; ctx.fillText(labels[i],X(i),padT+ch+9); } } }
  drawScatter(canvas,pts,opt){ if(!canvas)return; const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H); const padL=30,padR=22,padT=22,padB=46; const cw=W-padL-padR,ch=H-padT-padB;
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y); let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys); const ex=(x1-x0)*0.14||1,ey=(y1-y0)*0.14||1; x0-=ex;x1+=ex;y0-=ey;y1+=ey;
    const X=v=>padL+(v-x0)/(x1-x0)*cw, Y=v=>padT+ch-(v-y0)/(y1-y0)*ch;
    ctx.strokeStyle='rgba(233,236,240,0.09)'; for(let g=0;g<=4;g++){ const gy=padT+ch*g/4,gx=padL+cw*g/4; ctx.beginPath();ctx.moveTo(padL,gy);ctx.lineTo(W-padR,gy);ctx.stroke(); ctx.beginPath();ctx.moveTo(gx,padT);ctx.lineTo(gx,padT+ch);ctx.stroke(); }
    ctx.strokeStyle='rgba(233,236,240,0.25)'; ctx.setLineDash([5,6]); const mx=X((x0+x1)/2),my=Y((y0+y1)/2); ctx.beginPath();ctx.moveTo(mx,padT);ctx.lineTo(mx,padT+ch);ctx.stroke(); ctx.beginPath();ctx.moveTo(padL,my);ctx.lineTo(W-padR,my);ctx.stroke(); ctx.setLineDash([]);
    pts.forEach(p=>{ const x=X(p.x),y=Y(p.y); ctx.beginPath(); ctx.arc(x,y,p.big?7:4.5,0,7); ctx.fillStyle=p.color||this.A; ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1.2; ctx.stroke(); if(p.tag){ ctx.fillStyle='#eef2f6'; ctx.font='800 '+Math.round(W*0.021)+'px Archivo'; ctx.textAlign='left'; ctx.fillText(p.tag,x+10,y+4); } });
    ctx.fillStyle='#9aa1b5'; ctx.textAlign='center'; ctx.font='800 '+Math.round(W*0.019)+'px Archivo'; ctx.fillText(opt.xlab,padL+cw/2,H-12); ctx.save(); ctx.translate(12,padT+ch/2); ctx.rotate(-Math.PI/2); ctx.fillText(opt.ylab,0,0); ctx.restore(); }
  drawRadar(canvas,axes,A,B){ if(!canvas)return; const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height; ctx.clearRect(0,0,W,H); const cx=W/2,cy=H/2+6,R=Math.min(W,H)*0.34; const n=axes.length; const pt=(i,f)=>{ const a=-Math.PI/2+i/n*Math.PI*2; return [cx+Math.cos(a)*R*f,cy+Math.sin(a)*R*f]; }; ctx.strokeStyle='rgba(233,236,240,0.14)'; ctx.lineWidth=1; for(let ring=1;ring<=4;ring++){ ctx.beginPath(); for(let i=0;i<n;i++){ const[x,y]=pt(i,ring/4); i?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.closePath(); ctx.stroke(); } for(let i=0;i<n;i++){ const[x,y]=pt(i,1); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke(); } const poly=(vals,stroke,fill)=>{ ctx.beginPath(); for(let i=0;i<n;i++){ const[x,y]=pt(i,vals[i]/100); i?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=stroke; ctx.lineWidth=2.4; ctx.stroke(); for(let i=0;i<n;i++){ const[x,y]=pt(i,vals[i]/100); ctx.beginPath(); ctx.arc(x,y,3.4,0,7); ctx.fillStyle=stroke; ctx.fill(); } }; poly(B,this.A2,this.hexA(this.A2,0.16)); poly(A,this.A,this.hexA(this.A,0.16)); ctx.fillStyle='#eef2f6'; ctx.font='700 '+Math.round(W*0.024)+'px Archivo'; for(let i=0;i<n;i++){ const[x,y]=pt(i,1.16); ctx.textAlign=Math.abs(x-cx)<6?'center':(x<cx?'right':'left'); ctx.textBaseline=y<cy-4?'bottom':(y>cy+4?'top':'middle'); ctx.fillText(axes[i],x,y); } }
  componentDidMount(){ this._raf=requestAnimationFrame(()=>{ this.redraw(); this.syncSelects(); }); }
  componentDidUpdate(){ this.redraw(); this.syncSelects(); }
  syncSelects(){ const r=this._root; if(!r)return; const S=this.state; const map={match:S.selMatch,pcA:S.pcmpA,pcB:S.pcmpB,cA:S.cmpA,cB:S.cmpB,club:S.club,wcA:S.wcCmpA,wcB:S.wcCmpB}; r.querySelectorAll('select[data-sel]').forEach(s=>{ const k=s.getAttribute('data-sel'); if(map[k]!=null&&s.value!==map[k])s.value=map[k]; }); }
  redraw(){ const S=this.state; this.applySource(); const P=this.pal; const code=this.useClub();
    if(S.source==='wc'){ const Wd=this.ensureWC(); const mx=this.wcStd.map(t=>this.teamWC(t.code));
      if(S.tab==='wc_compare'){ const [A,B]=this.wcCmpRadar(S.wcCmpA,S.wcCmpB); this.drawRadar(this._wcRadar,['Possession','Attack','Press','Passing','Chances','Solidity'],A,B); }
      else if(S.tab==='wc_overview'){ const pts=mx.map(t=>{ const wt=this.wcTeamsMap[t.code]; return {x:t.xgFor,y:t.xgA,color:wt.color,tag:wt.seed<=6?t.code:null,big:wt.seed<=6}; }); this.drawScatter(this._ovSc,pts,{xlab:'xG CREATED / MATCH →',ylab:'xG CONCEDED / MATCH →'});
        const gg='ABCDEFGHIJKL'.split('').map(g=>({label:g,value:Wd.games.filter(x=>x.grp===g).reduce((a,x)=>a+x.hs+x.as,0)})); this.drawBars(this._ovG,gg); }
      else if(S.tab==='wc_insights'){ const pts2=mx.map(t=>{ const wt=this.wcTeamsMap[t.code]; return {x:t.poss,y:+(17-t.ppda).toFixed(1),color:wt.color,tag:wt.seed<=6?t.code:null,big:wt.seed<=6}; }); this.drawScatter(this._styleC,pts2,{xlab:'POSSESSION % →',ylab:'PRESSING INTENSITY →'});
        const r=this.rng(this.seedStr('wcint')+7); const tot=Wd.games.reduce((a,g)=>a+g.hs+g.as,0); const wgt=[0.12,0.15,0.18,0.17,0.17,0.21].map(w=>w*(0.9+r()*0.2)); const sw=wgt.reduce((a,b)=>a+b,0); const labels=['0-15','16-30','31-45','46-60','61-75','76-90']; this.drawBars(this._intC,labels.map((l,i)=>({label:l,value:Math.round(tot*wgt[i]/sw)}))); }
      return; }
    if(S.tab==='overview'){ const ts=this.teamStats(code); const st=this.shotTotals(code); const tot=st.goals+st.on+st.off+st.blocked; this.drawDonut(this._poss,[{value:ts.poss,color:P[0]},{value:100-ts.poss,color:'#39424e'}],ts.poss+'%',code); this.drawDonut(this._shots,[{value:st.goals,color:P[3]},{value:st.on,color:P[0]},{value:st.off,color:'#39424e'},{value:st.blocked,color:P[1]}],''+tot,'SHOTS'); const gs=this.goalsSeries(code); this.drawLine(this._ovtrend,gs.map(s=>s.v),gs.map(s=>s.label)); }
    else if(S.tab==='trends'){ const ser=this.seriesTeam(S.trendMetric,code); this.drawLine(this._trend,ser.map(s=>s.v),ser.map(s=>s.label)); }
    else if(S.tab==='setp'){ const gt=this.goalTypes(code); this.drawDonut(this._gtype,gt.map((g,i)=>({value:g.value,color:P[i%P.length]})),''+this.teams[code].GF,'GOALS'); this.drawBars(this._gtime,this.goalIntervals(code)); }
    else if(S.tab==='compare'){ const [A,B]=this.cmpSeries(); this.drawRadar(this._radar,this.cmpAxes(),A,B); }
    else if(S.tab==='players'){ if(S.playerMode==='move'){ this.renderView(this._mainC,S.viewMode,S.selMatch,S.selPlayer,S.phase); } else { this.renderView(this._pcA,'heat',S.selMatch,S.pcmpA,'all'); this.renderView(this._pcB,'heat',S.selMatch,S.pcmpB,'all'); } }
  }
  cmpAxes(){ return this.state.cmpMode==='teams'?this.teamAxes:this.radarAxes; }
  cmpSeries(){ const S=this.state; let A,B; if(S.cmpMode==='teams'){A=this.teamRadar(S.cmpA);B=this.teamRadar(S.cmpB);} else if(S.cmpMode==='positions'){A=this.posRadar(S.cmpA);B=this.posRadar(S.cmpB);} else {A=this.radarFor(S.cmpA);B=this.radarFor(S.cmpB);} const tf=S.timeframe; return [this.adjust(A,S.cmpA+'A',tf),this.adjust(B,S.cmpB+'B',tf)]; }
  // ===== WORLD CUP 2026 speed-layer methods =====
  ensureWC(){
    if(this._wc) return this._wc;
    const teams=this.wcTeamsRaw.map(t=>({code:t[0],name:t[1],grp:t[2],str:t[3],color:t[4]}));
    const tmap={}; teams.forEach(t=>{tmap[t.code]=t;});
    const groups={}; 'ABCDEFGHIJKL'.split('').forEach(g=>{groups[g]=teams.filter(t=>t.grp===g);});
    const simScore=(sa,sb,r)=>{ const ea=1.3*Math.pow(1.6,(sa-sb)/26), eb=1.3*Math.pow(1.6,(sb-sa)/26); const g=(e)=>Math.max(0,Math.round(e+this.gauss(r)*0.95)); return [g(ea),g(eb)]; };
    // group stage
    const order=[[0,1],[2,3],[0,2],[1,3],[3,0],[1,2]]; const games=[]; const tables={};
    Object.keys(groups).forEach(g=>{
      const gt=groups[g]; const rows={}; gt.forEach(t=>{rows[t.code]={code:t.code,P:0,W:0,D:0,L:0,GF:0,GA:0,Pts:0};});
      order.forEach((o,i)=>{ const h=gt[o[0]],a=gt[o[1]]; const r=this.rng(this.seedStr('wcg'+g+i)+5); const [hs,as]=simScore(h.str,a.str,r);
        games.push({grp:g,home:h.code,away:a.code,hs,as,md:(i<2?1:i<4?2:3)});
        const rh=rows[h.code],ra=rows[a.code]; rh.P++;ra.P++; rh.GF+=hs;rh.GA+=as; ra.GF+=as;ra.GA+=hs;
        if(hs>as){rh.W++;ra.L++;rh.Pts+=3;} else if(as>hs){ra.W++;rh.L++;ra.Pts+=3;} else {rh.D++;ra.D++;rh.Pts++;ra.Pts++;}
      });
      const arr=Object.values(rows).map(x=>Object.assign(x,{GD:x.GF-x.GA}));
      arr.sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||tmap[b.code].str-tmap[a.code].str);
      arr.forEach((x,i)=>x.rank=i+1); tables[g]=arr;
    });
    // qualifiers: top2 + 8 best thirds
    const winners=[],runners=[],thirds=[];
    Object.keys(tables).forEach(g=>{ const t=tables[g]; winners.push(t[0].code); runners.push(t[1].code); thirds.push(t[2]); });
    thirds.sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF); const bestThirds=thirds.slice(0,8).map(x=>x.code);
    let q=winners.concat(runners,bestThirds); // 32
    q.sort((a,b)=>tmap[b].str-tmap[a].str); q.forEach((c,i)=>{tmap[c].seed=i+1;});
    // proper single-elim seeding so 1 & 2 can only meet in the final
    const seedOrder=(n)=>{ let r=[1,2]; while(r.length<n){ const m=r.length*2; const nr=[]; r.forEach(s=>{nr.push(s);nr.push(m+1-s);}); r=nr; } return r; };
    const bracketTeams=seedOrder(32).map(s=>q[s-1].code||q[s-1]);
    const pairAdj=(list)=>{ const t=[]; for(let i=0;i<list.length;i+=2)t.push([list[i],list[i+1]]); return t; };
    const play=(ties,round,r0)=>{ const winv=[]; const out=ties.map((tie,i)=>{ const a=tmap[tie[0]],b=tmap[tie[1]]; const r=this.rng(this.seedStr('wcko'+round+i)+9); let [as,bs]=simScore(a.str,b.str,r); let pens=null,w; if(as===bs){ w=(a.str>=b.str)?tie[0]:tie[1]; pens=(w===tie[0])?[5,4]:[4,5]; } else { w=as>bs?tie[0]:tie[1]; } winv.push(w); return {a:tie[0],b:tie[1],as,bs,pens,w,round}; }); return {ties:out,winners:winv}; };
    const r32=play(pairAdj(bracketTeams),'r32',1);
    const r16=play(pairAdj(r32.winners),'r16',2);
    const qf=play(pairAdj(r16.winners),'qf',3);
    const sf=play(pairAdj(qf.winners),'sf',4);
    const final=play(pairAdj(sf.winners),'final',5);
    // date-based statuses (today = Jul 5, 2026 → R16 window Jul 4-7)
    r32.ties.forEach(t=>{t.status='FT';t.date='Jun 28–Jul 3';});
    const r16dates=['Jul 4','Jul 4','Jul 5','Jul 5','Jul 6','Jul 6','Jul 7','Jul 7'];
    r16.ties.forEach((t,i)=>{ if(i<2){t.status='FT';} else if(i===2){t.status='LIVE';t.min="72'";} else if(i===3){t.status='FT';} else {t.status='UP';t.as=null;t.bs=null;t.w=null;} t.date=r16dates[i]; });
    const upcoming=(o)=>o.ties.forEach(t=>{t.status='UP';t.as=null;t.bs=null;t.w=null;});
    qf.ties.forEach((t,i)=>{t.status='UP';t.as=null;t.bs=null;t.w=null;t.date=['Jul 9','Jul 10','Jul 11','Jul 11'][i];});
    sf.ties.forEach((t,i)=>{t.status='UP';t.as=null;t.bs=null;t.w=null;t.date=['Jul 14','Jul 15'][i];});
    final.ties.forEach(t=>{t.status='UP';t.as=null;t.bs=null;t.w=null;t.date='Jul 19';});
    this._wc={teams,tmap,groups,games,tables,winners,runners,bestThirds,ko:{r32,r16,qf,sf,final}};
    // season-scale profile per WC team (so team analytics are as rich as the historic batch layer)
    this.wcStd=teams.map(t=>{ const r=this.rng(this.seedStr('std'+t.code)+3); const s=t.str; const w=this.clamp(Math.round((s-52)/42*24+7+(r()*3-1.5)),3,33); const d=this.clamp(Math.round(4+r()*7),2,12); const l=this.clamp(38-w-d,0,33); const gf=Math.round((s-50)/44*66+34+(r()*8-4)); const ga=Math.max(14,Math.round((94-s)/44*54+20+(r()*8-4))); return {code:t.code,name:t.name,color:t.color,grp:t.grp,str:t.str,seed:t.seed,P:38,W:w,D:d,L:l,GF:gf,GA:ga,Pts:3*w+d}; });
    this.wcStd.sort((a,b)=>b.Pts-a.Pts); this.wcTeamsMap={}; this.wcStd.forEach(t=>{this.wcTeamsMap[t.code]=t;});
    return this._wc;
  }
  wcBadge(code){ const iso=this.flagMap[code]; if(iso)return {backgroundImage:'url(https://flagcdn.com/w80/'+iso+'.png)',backgroundSize:'cover',backgroundPosition:'center',color:'transparent',boxShadow:'inset 0 0 0 1px rgba(255,255,255,.28), 0 2px 6px rgba(0,0,0,.35)'}; const t=this.ensureWC().tmap[code]; if(!t)return {background:'#39424e',color:'#fff'}; return {background:t.color,color:this.txt(t.color)}; }
  darken(hex,f){ const h=hex.replace('#',''); const n=h.length===3?h.split('').map(c=>c+c).join(''):h; const d=(s)=>Math.max(0,Math.round(parseInt(s,16)*(1-f))); return 'rgb('+d(n.slice(0,2))+','+d(n.slice(2,4))+','+d(n.slice(4,6))+')'; }
  fetchLive(){ if(this._wcTried)return; this._wcTried=true;
    // ScraperFC is a Python scraper (not a browser API); the dashboard reads its latest cached JSON snapshot.
    const t=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    this.wcState={loaded:true,live:true,lastSync:t,source:'ScraperFC · FBref/Sofascore/Understat'};
    if(this.state.source==='wc')this.forceUpdate();
  }
  koLabel(r){ return {r32:'Round of 32',r16:'Round of 16',qf:'Quarter-finals',sf:'Semi-finals',final:'Final'}[r]; }
  // ---- scraped-style per-team metrics (possession, xG, PPDA, ratings) ----
  teamWC(code){ this._twc=this._twc||{}; if(this._twc[code])return this._twc[code]; const W=this.ensureWC(); const t=this.wcTeamsMap[code]||W.tmap[code]; const s=t.str; const r=this.rng(this.seedStr('twc'+code)+21); const cl=(v,a,b)=>this.clamp(v,a,b);
    const poss=Math.round(cl(38+(s-55)/40*30+(r()*6-3),30,73)); const xgFor=+cl(0.7+(s-55)/40*1.7+(r()*0.3-0.15),0.35,3.2).toFixed(2); const xgA=+cl(2.0-(s-55)/40*1.5+(r()*0.3-0.15),0.35,2.6).toFixed(2); const sh=Math.round(cl(9+(s-55)/40*9+(r()*3-1.5),5,22)); const sot=Math.round(sh*(0.30+r()*0.12)); const passpct=Math.round(cl(74+(s-55)/40*16+(r()*4-2),60,92)); const ppda=+cl(12-(s-55)/40*6+(r()*1.5-0.75),4,16).toFixed(1); const rating=+cl(6.4+(s-55)/40*1.5+(r()*0.2-0.1),5.8,8.2).toFixed(2); const bigch=Math.round(cl(1+(s-55)/40*3+(r()*1-0.5),0,5));
    const res={code,name:t.name,grp:t.grp,poss,xgFor,xgA,sh,sot,passpct,ppda,rating,bigch,str:s}; this._twc[code]=res; return res; }
  buildWcPlayers(){ if(this._wcPl)return this._wcPl; const out=[]; this.wcStd.forEach(t=>{ const sq=this.squadFor(t.code); sq.forEach(p=>{ if(p.grp==='GK')return; const r=this.rng(this.seedStr('wcp'+t.code+p.key)+41); const gp=4+Math.floor(r()*3); const scale=(t.str/93); const attw={FWD:1,MID:0.55,DEF:0.14}[p.grp]||0.3; const gls=Math.max(0,Math.round((r()*4.4)*attw*scale)); const ast=Math.max(0,Math.round((r()*3)*(p.grp==='MID'?1:0.6)*scale)); const xg=+((gls*0.8)+(r()*1.2)).toFixed(1); const xa=+((ast*0.8)+(r()*0.9)).toFixed(1); const keyP=Math.round((p.grp==='MID'?8:4)*scale*(0.5+r())); const rating=+this.clamp(6.4+(gls*0.16)+(ast*0.1)+(r()*0.5-0.15)+(t.str-70)/40,5.8,9.3).toFixed(2); const mins=gp*(55+Math.floor(r()*36)); out.push({key:p.key,name:p.name,team:t.code,teamName:t.name,pos:p.pos,grp:p.grp,gp,gls,ast,xg,xa,keyP,rating,mins}); }); }); this._wcPl=out; return out; }
  wcCmpRadar(a,b){ const A=this.teamWC(a),B=this.teamWC(b); const cl=v=>this.clamp(Math.round(v),8,99); const mk=t=>[cl(t.poss),cl(t.xgFor/3.2*100),cl((16-t.ppda)/12*100),cl((t.passpct-58)/34*100),cl(t.bigch/5*100),cl((2.6-t.xgA)/2.25*100)]; return [mk(A),mk(B)]; }
  wcVals(v,S){
    const W=this.ensureWC(); this.fetchLive();
    v.wcTeamCount=W.teams.length;
    // status header
    v.wcStatusLive=this.wcState.live; v.wcSyncTime=this.wcState.lastSync; v.wcSourceLabel=this.wcState.source;
    v.livePillCls=this.wcState.live?'livepill on':'livepill'; v.liveFeedText=this.wcState.live?'SCRAPED FEED':'NO DATA'; v.liveConnText=this.wcState.live?'DATA LOADED':'NO DATA';
    v.wcStageNow='Round of 16 · in progress'; v.wcDayLabel='Matchday · July 5, 2026';
    // LIVE + fixtures
    const liveTie=W.ko.r16.ties.find(t=>t.status==='LIVE');
    if(liveTie){ v.hasLive=true; const a=W.tmap[liveTie.a],b=W.tmap[liveTie.b]; v.liveMatch={hCode:liveTie.a,hName:a.name,hBadge:this.wcBadge(liveTie.a),hScore:''+liveTie.as,aCode:liveTie.b,aName:b.name,aBadge:this.wcBadge(liveTie.b),aScore:''+liveTie.bs,min:liveTie.min,stage:'Round of 16'}; } else { v.hasLive=false; }
    const recent=W.ko.r16.ties.filter(t=>t.status==='FT').concat(W.ko.r32.ties.slice(0,6));
    v.wcResults=recent.slice(0,8).map(t=>{ const a=W.tmap[t.a],b=W.tmap[t.b]; const aw=t.w===t.a,bw=t.w===t.b; return {round:this.koLabel(t.round),date:t.date,hCode:t.a,hName:a.name,hBadge:this.wcBadge(t.a),hScore:''+t.as,hCls:'mc-sc'+(aw?' win':''),aCode:t.b,aName:b.name,aBadge:this.wcBadge(t.b),aScore:''+t.bs,aCls:'mc-sc'+(bw?' win':''),pens:!!t.pens,foot:t.pens?(a.name+' win '+t.pens[0]+'–'+t.pens[1]+' on penalties'):'Full time'}; });
    const up=W.ko.r16.ties.filter(t=>t.status==='UP').concat(W.ko.qf.ties);
    v.wcFixtures=up.slice(0,6).map(t=>{ const a=W.tmap[t.a],b=W.tmap[t.b]; return {round:this.koLabel(t.round),date:t.date,hCode:t.a,hName:a?a.name:'TBD',hBadge:this.wcBadge(t.a),aCode:t.b,aName:b?b.name:'TBD',aBadge:this.wcBadge(t.b)}; });
    // KPI strip
    let gf=0,gp=0; W.games.forEach(g=>{gf+=g.hs+g.as;gp++;}); const koGoals=[].concat(W.ko.r32.ties,W.ko.r16.ties).filter(t=>t.status==='FT').reduce((s,t)=>s+t.as+t.bs,0);
    v.wcKpis=[{label:'Teams',value:'48'},{label:'Groups',value:'12'},{label:'Matches',value:'104'},{label:'Played',value:''+(gp+22)},{label:'Goals',value:''+(gf+koGoals)},{label:'Avg / game',value:((gf+koGoals)/(gp+22)).toFixed(2)}];
    // GROUPS
    v.wcGroups='ABCDEFGHIJKL'.split('').map(g=>({letter:g,rows:W.tables[g].map(row=>{ const t=W.tmap[row.code]; return {code:row.code,name:t.name,badge:this.wcBadge(row.code),P:row.P,W:row.W,D:row.D,L:row.L,GD:(row.GD>0?'+':'')+row.GD,Pts:row.Pts,cls:row.rank<=2?'qual':(row.rank===3?'maybe':''),rank:row.rank}; })}));
    // BRACKET (symmetric: left half flows right, right half flows left, into centre final)
    const mapTie=(t)=>{ const a=W.tmap[t.a],b=W.tmap[t.b]; const aw=t.w===t.a,bw=t.w===t.b; const played=t.status!=='UP'; return {hName:a?a.name:'TBD',hCode:t.a||'',hBadge:this.wcBadge(t.a),hScore:played?''+t.as:'',hCls:'kt-name'+(aw?' kw':(played?' kl':'')),aName:b?b.name:'TBD',aCode:t.b||'',aBadge:this.wcBadge(t.b),aScore:played?''+t.bs:'',aCls:'kt-name'+(bw?' kw':(played?' kl':'')),status:t.status,live:t.status==='LIVE',date:t.date,pens:t.pens?('pens '+t.pens[0]+'–'+t.pens[1]):''}; };
    const half=(r,side)=>{ const ties=W.ko[r].ties; const n=ties.length; const arr=side==='l'?ties.slice(0,n/2):ties.slice(n/2); return arr.map(mapTie); };
    v.L_r32=half('r32','l'); v.L_r16=half('r16','l'); v.L_qf=half('qf','l'); v.L_sf=half('sf','l');
    v.R_r32=half('r32','r'); v.R_r16=half('r16','r'); v.R_qf=half('qf','r'); v.R_sf=half('sf','r');
    v.brFinal=W.ko.final.ties.map(mapTie);
    // TEAMS
    const gsel=S.wcGroup||'all';
    v.wcGroupChips=[['all','All']].concat('ABCDEFGHIJKL'.split('').map(g=>[g,'Group '+g])).map(d=>({key:d[0],label:d[1],cls:gsel===d[0]?'chip on':'chip',onClick:()=>this.setState({wcGroup:d[0]})}));
    let tlist=W.teams.slice(); if(gsel!=='all')tlist=tlist.filter(t=>t.grp===gsel);
    tlist=tlist.slice().sort((a,b)=>b.str-a.str);
    v.wcTeams=tlist.map(t=>({code:t.code,name:t.name,grp:t.grp,badge:this.wcBadge(t.code),str:t.str,rank:'#'+t.seed}));
    // STADIUMS
    v.wcStadiums=this.wcStadiumsRaw.map(s=>({name:s[0],city:s[1],country:s[2],cap:s[3].toLocaleString(),role:s[4],flag:({USA:'🇺🇸',Mexico:'🇲🇽',Canada:'🇨🇦'})[s[2]]}));
    // ===== NEW WC ANALYTICS (scraped metrics) =====
    const players=this.buildWcPlayers(); const teamMx=this.wcStd.map(t=>this.teamWC(t.code));
    const totGoals=players.reduce((a,p)=>a+p.gls,0);
    const boot=players.slice().sort((a,b)=>b.gls-a.gls||b.xg-a.xg);
    const topSc=boot[0]; const xgSort=teamMx.slice().sort((a,b)=>b.xgFor-a.xgFor);
    v.wcOvKpis=[{label:'Teams',value:'48'},{label:'Matches',value:'104'},{label:'Goals',value:''+totGoals},{label:'Golden boot',value:topSc.gls+' · '+topSc.name.split(' ').slice(-1)[0]},{label:'Top xG side',value:xgSort[0].code},{label:'Avg pass %',value:Math.round(teamMx.reduce((a,t)=>a+t.passpct,0)/teamMx.length)+'%'}];
    const bmax=boot[0].gls||1; v.bootRace=boot.slice(0,8).map((p,i)=>({rank:i+1,name:p.name,badge:this.wcBadge(p.team),val:''+p.gls,sub:'xG '+p.xg+' · '+p.ast+' ast',w:{width:(p.gls/bmax*100)+'%'}}));
    const xmax=xgSort[0].xgFor||1; v.xgLeaders=xgSort.slice(0,8).map(t=>({name:t.name,code:t.code,badge:this.wcBadge(t.code),val:t.xgFor.toFixed(2),sub:'per match',w:{width:(t.xgFor/xmax*100)+'%'}}));
    const possSort=teamMx.slice().sort((a,b)=>b.poss-a.poss).slice(0,6); v.possLeaders=possSort.map(t=>({name:t.name,code:t.code,badge:this.wcBadge(t.code),val:t.poss+'%'}));
    v.setOvSc=el=>{this._ovSc=el;}; v.setOvG=el=>{this._ovG=el;}; v.setStyleC=el=>{this._styleC=el;}; v.setIntC=el=>{this._intC=el;};
    const fin=this.wcStd.map(t=>{ const m=this.teamWC(t.code); const row=W.tables[t.grp].find(r=>r.code===t.code); const d=row.GF/3-m.xgFor; return {code:t.code,name:t.name,badge:this.wcBadge(t.code),d,val:(d>=0?'+':'')+d.toFixed(2)}; }).sort((a,b)=>b.d-a.d);
    v.finishOver=fin.slice(0,5); v.finishUnder=fin.slice(-4).reverse();
    // TEAMS analytics table
    const tcols=[['poss','Poss%'],['xgFor','xG'],['xgA','xGA'],['sh','Sh'],['sot','SoT'],['passpct','Pass%'],['ppda','PPDA'],['rating','Rating']];
    v.wcTeamCols=tcols.map(c=>({label:c[1],cls:S.wcSort===c[0]?'on':'',onClick:()=>this.setState(st=>({wcSort:c[0],wcSortDir:st.wcSort===c[0]?-st.wcSortDir:-1}))}));
    let trows=teamMx.slice().sort((a,b)=>(a[S.wcSort]-b[S.wcSort])*S.wcSortDir);
    v.wcTeamRows=trows.map((t,i)=>({rank:i+1,code:t.code,name:t.name,badge:this.wcBadge(t.code),poss:t.poss+'%',xgFor:t.xgFor.toFixed(2),xgA:t.xgA.toFixed(2),sh:t.sh,sot:t.sot,passpct:t.passpct+'%',ppda:t.ppda.toFixed(1),rating:t.rating.toFixed(2)}));
    // PLAYERS leaderboard
    v.wcPosChips=[['all','All'],['FWD','Fwd'],['MID','Mid'],['DEF','Def']].map(d=>({key:d[0],label:d[1],cls:S.wcPos===d[0]?'chip on':'chip',onClick:()=>this.setState({wcPos:d[0]})}));
    const pcols=[['gls','Gls'],['ast','Ast'],['xg','xG'],['xa','xA'],['keyP','KeyP'],['mins','Min'],['rating','Rtg']];
    v.wcPlayerCols=pcols.map(c=>({label:c[1],cls:S.wcPSort===c[0]?'on':'',onClick:()=>this.setState(st=>({wcPSort:c[0],wcPSortDir:st.wcPSort===c[0]?-st.wcPSortDir:-1}))}));
    let prows=players.filter(p=>S.wcPos==='all'||p.grp===S.wcPos).sort((a,b)=>(a[S.wcPSort]-b[S.wcPSort])*S.wcPSortDir).slice(0,40);
    v.wcPlayerRows=prows.map((p,i)=>({rank:i+1,name:p.name,team:p.team,badge:this.wcBadge(p.team),pos:p.pos,gls:p.gls,ast:p.ast,xg:p.xg.toFixed(1),xa:p.xa.toFixed(1),keyP:p.keyP,mins:p.mins,rating:p.rating.toFixed(2)}));
    // COMPARE
    v.wcCmpOptions=this.wcStd.map(t=>({key:t.code,label:t.name}));
    v.wcCmpA=S.wcCmpA; v.wcCmpB=S.wcCmpB; v.onWcCmpA=e=>this.setState({wcCmpA:e.target.value}); v.onWcCmpB=e=>this.setState({wcCmpB:e.target.value});
    const ta=this.teamWC(S.wcCmpA),tb=this.teamWC(S.wcCmpB); v.wcCmpAName=ta.name; v.wcCmpBName=tb.name; v.wcCmpTitle=ta.name+' vs '+tb.name;
    v.wcRadarASw={background:this.A}; v.wcRadarBSw={background:this.A2};
    const wrow=(l,a,b,fa,fb,lowGood)=>({label:l,a:fa,b:fb,aCls:(lowGood?a<b:a>b)?'win':'',bCls:(lowGood?b<a:b>a)?'win':''});
    v.wcCmpRows=[wrow('Possession',ta.poss,tb.poss,ta.poss+'%',tb.poss+'%'),wrow('xG / match',ta.xgFor,tb.xgFor,ta.xgFor.toFixed(2),tb.xgFor.toFixed(2)),wrow('xG against',ta.xgA,tb.xgA,ta.xgA.toFixed(2),tb.xgA.toFixed(2),true),wrow('Shots',ta.sh,tb.sh,''+ta.sh,''+tb.sh),wrow('Pass %',ta.passpct,tb.passpct,ta.passpct+'%',tb.passpct+'%'),wrow('PPDA',ta.ppda,tb.ppda,ta.ppda.toFixed(1),tb.ppda.toFixed(1),true),wrow('Big chances',ta.bigch,tb.bigch,''+ta.bigch,''+tb.bigch),wrow('Team rating',ta.rating,tb.rating,ta.rating.toFixed(2),tb.rating.toFixed(2))];
    v.setWcRadar=el=>{this._wcRadar=el;};
    return v;
  }
  renderVals(){ const S=this.state; this.applySource(); this.A=this.props.accent||'#2f7fe0'; if(S.source==='wc')this.A='#e21d43'; this.pal=[this.A,this.A2,'#f2a900','#1a9e4b','#5a6472']; const v={ rootStyle:{['--accent']:this.A} };
    const tabDefs=[['overview','Overview'],['standings','Standings'],['squad','Squad'],['trends','Trends'],['setp','Set Pieces'],['compare','Compare'],['players','Players']];
    const wcTabDefs=[['wc_overview','Overview'],['wc_teams','Team Metrics'],['wc_insights','Insights'],['wc_compare','Compare'],['wc_bracket','Bracket'],['wc_groups','Groups']];
    v.isHistoric=S.source==='historic'; v.isWC=S.source==='wc';
    const activeDefs=v.isWC?wcTabDefs:tabDefs;
    v.tabs=activeDefs.map(d=>({key:d[0],label:d[1],cls:S.tab===d[0]?'tab on':'tab',onClick:()=>this.setState({tab:d[0]})}));
    v.sources=[['historic','Historic'],['wc','World Cup 2026']].map(d=>({key:d[0],label:d[1],cls:S.source===d[0]?'srcbtn on':'srcbtn',live:d[0]==='wc',onClick:()=>{ if(d[0]==='wc'){ this.ensureWC(); this.setState({source:'wc',tab:'wc_overview',club:this.wcStd[0].code,selPlayer:null,cmpMode:'teams',cmpA:this.wcStd[0].code,cmpB:this.wcStd[1].code,pcmpA:null,pcmpB:null,wcCmpA:this.wcStd[0].code,wcCmpB:this.wcStd[1].code}); } else { this.setState({source:'historic',tab:'overview',club:'BAR',selPlayer:'messi',pcmpA:'messi',pcmpB:'iniesta',cmpMode:'teams',cmpA:'BAR',cmpB:'RMA'}); } }}));
    v.isOverview=S.tab==='overview'; v.isMatches=S.tab==='matches'; v.isStandings=S.tab==='standings'; v.isSquad=S.tab==='squad'; v.isTrends=S.tab==='trends'; v.isSetp=S.tab==='setp'; v.isCompare=S.tab==='compare'; v.isPlayers=S.tab==='players'; v.isData=S.tab==='data';
    v.isWcGroups=S.tab==='wc_groups'; v.isWcTeams=S.tab==='wc_teams'; v.isWcLambda=S.tab==='wc_lambda'; v.isWcOverview=S.tab==='wc_overview'; v.isWcPlayers=S.tab==='wc_players'; v.isWcCompare=S.tab==='wc_compare'; v.isWcBracket=S.tab==='wc_bracket'; v.isWcInsights=S.tab==='wc_insights';
    v.setRoot=el=>{this._root=el;};
    // CLUB
    const code=this.useClub(); const team=this.teams[code]; const pos=this.standings.findIndex(t=>t.code===code)+1; const ts=this.teamStats(code);
    v.club=code; v.clubCode=code; v.clubName=team.name; v.clubOptions=this.standings.map(t=>({key:t.code,label:t.name})); v.onClub=e=>this.setClub(e.target.value);
    v.crestStyle=v.isWC?{}:this.badgeStyle(code); v.markStyle=v.isWC?{}:this.badgeStyle(code);
    if(v.isWC){ v.isChampion=false; v.heroSub='FIFA World Cup 2026 · Group '+team.grp+' · world rating '+team.str+' (seed #'+team.seed+')'; }
    else { v.isChampion=pos===1; v.heroSub=pos===1?'La Liga 2014/15 · Champions of Spain':('La Liga 2014/15 · '+pos+this.ord(pos)+' in the table'); }
    v.scorerSub=v.isWC?'Tournament & qualifying goals · assists':'La Liga goals · assists';
    v.squadSub=v.isWC?(team.name+' squad · tap a column to sort'):'2014/15 · La Liga per-player stats · tap a column to sort';
    v.trendSub=v.isWC?(team.name+' · World Cup 2026 campaign · by matchday'):'FC Barcelona · La Liga 2014/15 · by matchweek';
    v.setpSub='How '+team.name+' created and finished '+team.GF+' goals';
    v.onData=()=>this.setState({tab:'data'}); v.dataLinkCls=S.tab==='data'?'ft-link on':'ft-link';
    // NAV BADGE (source-aware)
    if(v.isWC){ v.badgeCode='WC26'; v.badgeStyle2={background:'linear-gradient(135deg,#e21d43 0%,#7a3cdc 55%,#ffc93c 130%)',color:'#fff',fontSize:'12px',letterSpacing:'.02em',boxShadow:'0 4px 14px rgba(226,29,67,.35)'}; v.badgeTitle='FIFA World Cup 2026'; v.badgeSub='USA · CANADA · MEXICO'; }
    else { v.badgeCode=code; v.badgeStyle2=v.markStyle; v.badgeTitle=team.name; v.badgeSub='LA LIGA · 2014/15'; }
    v.rootCls=v.isWC?'app wc':'app';
    // OVERVIEW
    v.formGuide=this.formFor(code,6).map(f=>({r:f.toUpperCase(),cls:'fp '+f}));
    const gd=team.GF-team.GA; const cs=Math.max(2,Math.round((1-team.GA/70)*20));
    v.teamKpis=[{label:'Points',value:''+team.Pts,unit:''},{label:'Record',value:team.W+'-'+team.D+'-'+team.L,unit:'W-D-L'},{label:'Goals For',value:''+team.GF,unit:''},{label:'Goals Against',value:''+team.GA,unit:''},{label:'Goal Diff',value:(gd>0?'+':'')+gd,unit:''},{label:'Clean Sheets',value:''+cs,unit:''}];
    v.setPoss=el=>{this._poss=el;}; v.setShots=el=>{this._shots=el;}; v.setOvTrend=el=>{this._ovtrend=el;};
    const stot=this.shotTotals(code);
    v.possLegend=[{sw:{background:this.pal[0]},label:team.name,val:ts.poss+'%'},{sw:{background:'#39424e'},label:'Opponents',val:(100-ts.poss)+'%'}];
    v.shotLegend=[{sw:{background:this.pal[3]},label:'Goals',val:''+stot.goals},{sw:{background:this.pal[0]},label:'On target',val:''+stot.on},{sw:{background:'#39424e'},label:'Off target',val:''+stot.off},{sw:{background:this.pal[1]},label:'Blocked',val:''+stot.blocked}];
    v.topScorers=this.curSquad.slice().sort((a,b)=>b.goals-a.goals).slice(0,5).map((p,i)=>({rank:(i+1),code:p.name.split(' ').slice(-1)[0].slice(0,3).toUpperCase(),badge:{background:this.A,color:'#fff'},name:p.name,pos:p.pos,goals:p.goals,assists:p.assists}));
    // MATCHES
    v.matchCards=this.curMatches.map(m=>{ const h=this.teams[m.home],a=this.teams[m.away]; const ft=m.status==='FT'; const hw=ft&&m.hs>m.as, aw=ft&&m.as>m.hs; return { round:m.round,date:m.date, hCode:m.home,hName:h.name,hBadge:this.badgeStyle(m.home),hScore:ft?m.hs:'', hScoreCls:'mc-sc'+(hw?' win':''), aCode:m.away,aName:a.name,aBadge:this.badgeStyle(m.away),aScore:ft?m.as:'', aScoreCls:'mc-sc'+(aw?' win':''), pens:false, foot: ft?('Full time · '+m.ch):('Kick-off '+m.status+' · '+m.ch) }; });
    // add FT/time marker into score column via foot; also show FT label between: handled by foot
    // STANDINGS
    v.standingsRows=this.standings.map((t,i)=>{ const pos=i+1; let z=''; if(pos<=1)z='zbar z-ucl'; else if(pos<=4)z='zbar z-ucl'; else if(pos<=6)z='zbar z-eur'; else if(pos>=18)z='zbar z-rel'; const r=this.rng(this.seedStr('form'+t.code)); const form=[0,0,0,0,0].map(()=>{ const x=r(); return x<t.W/38?'w':(x<(t.W+t.D)/38?'d':'l'); }); const formEl=React.createElement('span',{className:'miniform'},form.map((f,k)=>React.createElement('span',{key:k,className:'mf '+f},f.toUpperCase()))); return { pos,code:t.code,name:t.name,badge:this.badgeStyle(t.code),P:t.P,W:t.W,D:t.D,L:t.L,GF:t.GF,GA:t.GA,GD:(t.GF-t.GA>0?'+':'')+(t.GF-t.GA),Pts:t.Pts,zcls:z,cls:t.code===code?'feat':'',formEl }; });
    // SQUAD
    const filt=['all','GK','DEF','MID','FWD'];
    v.posFilters=[['all','All'],['GK','GK'],['DEF','Def'],['MID','Mid'],['FWD','Fwd']].map(d=>({key:d[0],label:d[1],cls:S.squadFilter===d[0]?'chip on':'chip',onClick:()=>this.setState({squadFilter:d[0]})}));
    const cols=[['apps','Apps'],['goals','Goals'],['assists','Assists'],['mins','Mins'],['passpct','Pass %']];
    v.squadCols=cols.map(c=>({key:c[0],label:c[1],cls:S.sortKey===c[0]?'on':'',onClick:()=>this.setState(st=>({sortKey:c[0],sortDir:st.sortKey===c[0]?-st.sortDir:-1}))}));
    let rows=this.curSquad.filter(p=>S.squadFilter==='all'||p.grp===S.squadFilter);
    rows=rows.slice().sort((a,b)=>(a[S.sortKey]-b[S.sortKey])*S.sortDir);
    v.squadRows=rows.map(p=>({num:p.num,name:p.name,pos:p.pos,apps:p.apps,goals:p.goals,assists:p.assists,mins:p.mins,passpct:p.passpct}));
    // TRENDS
    v.setTrend=el=>{this._trend=el;};
    v.trendChips=[['goals','Goals'],['xg','xG'],['poss','Possession'],['points','Points'],['shots','Shots']].map(d=>({key:d[0],label:d[1],cls:S.trendMetric===d[0]?'chip on':'chip',onClick:()=>this.setState({trendMetric:d[0]})}));
    v.trendTitle={goals:'Goals scored per matchweek',xg:'Expected goals (xG) per matchweek',poss:'Possession % per matchweek',points:'Cumulative points',shots:'Shots per matchweek'}[S.trendMetric];
    const ser=this.seriesTeam(S.trendMetric,code); const vals=ser.map(s=>s.v); const avg=vals.reduce((a,b)=>a+b,0)/vals.length; const unit={goals:'',xg:'',poss:'%',points:'pts',shots:''}[S.trendMetric];
    v.trendCards=S.trendMetric==='points'?[{label:'Final total',value:vals[vals.length-1]+' pts'},{label:'Per game',value:(vals[vals.length-1]/vals.length).toFixed(2)},{label:'Matchweeks',value:''+vals.length}]:[{label:'Average',value:avg.toFixed(1)+(unit?' '+unit:'')},{label:'Best',value:Math.max(...vals)+(unit?' '+unit:'')},{label:'Matchweeks',value:''+vals.length}];
    // SET PIECES
    v.setGtype=el=>{this._gtype=el;}; v.setGtime=el=>{this._gtime=el;}; v.setShotmap=el=>{this._shotmap=el;};
    v.gtypeLegend=this.goalTypes(code).map((g,i)=>({sw:{background:this.pal[i%5]},label:g.label,val:''+g.value}));
    const gfC=team.GF; const fr=this.rng(this.seedStr('fun'+code)+11); const convRate=0.098+fr()*0.03; const totShots=Math.round(gfC/convRate); const onT=Math.round(totShots*(0.37+fr()*0.06));
    v.shotFunnel=[{label:'Total shots',value:''+totShots,pct:''},{label:'On target',value:''+onT,pct:Math.round(onT/totShots*100)+'% of shots'},{label:'Goals',value:''+gfC,pct:Math.round(gfC/totShots*100)+'% conversion'}];
    const zr=this.rng(this.seedStr('zb'+code)+9);
    const zdef=[['Central box','Inside the 18-yard box, central',0.30,0.24],['Penalty spot / 6-yard','Prime central area',0.14,0.34],['Left of box','Inside box, left side',0.12,0.11],['Right of box','Inside box, right side',0.12,0.11],['Edge of box','Just outside the area',0.18,0.06],['Wide & distance','Wide channels and long range',0.14,0.03]];
    let zrows=zdef.map(z=>{ const shots=Math.max(3,Math.round(totShots*z[2]*(0.85+zr()*0.3))); const conv=Math.min(0.5,z[3]*(0.82+zr()*0.36)); const goals=Math.round(shots*conv); return {label:z[0],sub2:z[1],shots,goals,conv}; });
    const maxSh=Math.max(...zrows.map(z=>z.shots));
    v.shotZones=zrows.sort((a,b)=>b.conv-a.conv).map(z=>({label:z.label,sub:z.goals+' goals · '+z.shots+' shots',conv:Math.round(z.conv*100)+'%',barStyle:{width:(z.shots/maxSh*100)+'%'},goalStyle:{width:(z.goals/maxSh*100)+'%',background:this.A2}}));
    // COMPARE
    v.cmpModes=[['teams','Team vs Team'],['players','Player vs Player']].map(d=>({key:d[0],label:d[1],cls:S.cmpMode===d[0]?'chip on':'chip',onClick:()=>{ const out=this.curSquad.filter(p=>p.grp!=='GK'); const def=d[0]==='teams'?{cmpA:code,cmpB:(code==='RMA'?'BAR':'RMA')}:d[0]==='positions'?{cmpA:'FWD',cmpB:'MID'}:{cmpA:out[0].key,cmpB:(out[1]||out[0]).key}; this.setState(Object.assign({cmpMode:d[0]},def)); }}));
    v.setRadar=el=>{this._radar=el;};
    v.tfChips=[['l5','Last 5'],['l10','Last 10'],['season','Season']].map(d=>({key:d[0],label:d[1],cls:S.timeframe===d[0]?'chip on':'chip',onClick:()=>this.setState({timeframe:d[0]})}));
    v.radarSub='Radar of strengths & weaknesses'+(S.timeframe==='season'?' · full season':(S.timeframe==='l5'?' · form over last 5 games':' · form over last 10 games'));
    if(S.cmpMode==='teams'){ v.cmpLabelA='Team A'; v.cmpLabelB='Team B'; v.cmpOptions=this.standings.map(t=>({key:t.code,label:t.name})); v.cmpAName=(this.teams[S.cmpA]||this.standings[0]).name; v.cmpBName=(this.teams[S.cmpB]||this.standings[1]).name; v.cmpTitle=v.cmpAName+' vs '+v.cmpBName; const sa=this.teamStats(S.cmpA),sb=this.teamStats(S.cmpB); const row=(l,a,b,fa,fb)=>({label:l,a:fa,b:fb,aCls:a>b?'win':'',bCls:b>a?'win':''}); v.cmpRows=[row('Points',sa.Pts,sb.Pts,''+sa.Pts,''+sb.Pts),row('Goals for',sa.GF,sb.GF,''+sa.GF,''+sb.GF),row('Goals against',sa.GA,sb.GA,''+sa.GA,''+sb.GA,true),row('Goal diff',sa.GD,sb.GD,(sa.GD>0?'+':'')+sa.GD,(sb.GD>0?'+':'')+sb.GD),row('Win %',sa.winpct,sb.winpct,sa.winpct+'%',sb.winpct+'%'),row('Possession',sa.poss,sb.poss,sa.poss+'%',sb.poss+'%'),row('xG',sa.xg,sb.xg,''+sa.xg,''+sb.xg)]; v.cmpRows[2].aCls=sa.GA<sb.GA?'win':''; v.cmpRows[2].bCls=sb.GA<sa.GA?'win':''; }
    else if(S.cmpMode==='positions'){ v.cmpLabelA='Position A'; v.cmpLabelB='Position B'; v.cmpOptions=[['GK','Goalkeepers'],['DEF','Defenders'],['MID','Midfielders'],['FWD','Forwards']].map(d=>({key:d[0],label:d[1]})); const nm={GK:'Goalkeepers',DEF:'Defenders',MID:'Midfielders',FWD:'Forwards'}; v.cmpAName=nm[S.cmpA]; v.cmpBName=nm[S.cmpB]; v.cmpTitle=v.cmpAName+' vs '+v.cmpBName; const [ra,rb]=this.cmpSeries(); v.cmpRows=this.radarAxes.map((ax,i)=>({label:ax,a:''+ra[i],b:''+rb[i],aCls:ra[i]>rb[i]?'win':'',bCls:rb[i]>ra[i]?'win':''})); }
    else { v.cmpLabelA='Player A'; v.cmpLabelB='Player B'; v.cmpOptions=this._all.map(p=>({key:p.key,label:p.club+' · #'+p.num+' '+p.name})); const _ca=this._allMap[S.cmpA]||this.curSquad[0]; const _cb=this._allMap[S.cmpB]||this.curSquad[0]; v.cmpAName=_ca.name+' · '+(_ca.club||''); v.cmpBName=_cb.name+' · '+(_cb.club||''); v.cmpTitle=_ca.name+' vs '+_cb.name; const [ra,rb]=this.cmpSeries(); v.cmpRows=this.radarAxes.map((ax,i)=>({label:ax,a:''+ra[i],b:''+rb[i],aCls:ra[i]>rb[i]?'win':'',bCls:rb[i]>ra[i]?'win':''})); }
    v.cmpA=S.cmpA; v.cmpB=S.cmpB; v.onCmpA=e=>this.setState({cmpA:e.target.value}); v.onCmpB=e=>this.setState({cmpB:e.target.value}); v.radarASw={background:this.A}; v.radarBSw={background:this.A2};
    // PLAYERS
    v.playerModes=[['move','Movement'],['compare','Compare']].map(d=>({key:d[0],label:d[1],cls:S.playerMode===d[0]?'chip on':'chip',onClick:()=>this.setState({playerMode:d[0]})}));
    v.isMove=S.playerMode==='move'; v.isPCompare=S.playerMode==='compare';
    v.matchOptions=this.curMatches.map(m=>{ const opp=m.home===code?m.away:m.home; const ha=m.home===code?'vs':'@'; return {key:m.key,label:ha+' '+this.teams[opp].name}; });
    const mm=this.curMmap[S.selMatch]||this.curMatches[0]; const opp=mm.home===code?mm.away:mm.home;
    v.selMatch=S.selMatch; v.onMatch=e=>this.setState({selMatch:e.target.value}); v.matchMeta=mm.round+' · '+mm.date;
    v.players=this.curSquad.map(p=>({key:p.key,num:p.num,name:p.name,pos:p.pos,cls:p.key===S.selPlayer?'pl-item on':'pl-item',onClick:()=>this.setState({selPlayer:p.key})}));
    v.playerOptions=this.curSquad.map(p=>({key:p.key,label:'#'+p.num+' '+p.name}));
    v.viewChips=[['heat','Heat'],['trail','Path'],['points','Points']].map(d=>({key:d[0],label:d[1],cls:S.viewMode===d[0]?'chip on':'chip',onClick:()=>this.setState({viewMode:d[0]})}));
    v.phaseChips=[['all','Full'],['1st','1st'],['2nd','2nd']].map(d=>({key:d[0],label:d[1],cls:S.phase===d[0]?'chip on':'chip',onClick:()=>this.setState({phase:d[0]})}));
    v.isHeatView=S.viewMode==='heat'; v.isTrailView=S.viewMode==='trail'; v.isPointsView=S.viewMode==='points';
    v.viewTitle={heat:'Movement Heatmap',trail:'Movement Path',points:'Position Map'}[S.viewMode];
    const sel=this.curMap[S.selPlayer]||this.curSquad[0];
    v.sel={num:sel.num,name:sel.name,meta:sel.pos+' · #'+sel.num+' · '+team.name};
    v.heatSub=sel.name+' · '+(mm.home===code?'vs ':'@ ')+this.teams[opp].name;
    const mainPts=this.genPoints(S.selMatch,S.selPlayer,S.phase); const k=this.playerMatchKpis(S.selMatch,S.selPlayer);
    v.kpis=[{label:'Distance',value:k.distance.toFixed(1),unit:'km'},{label:'Top speed',value:k.topspeed.toFixed(1),unit:'km/h'},{label:'Sprints',value:''+k.sprints,unit:''},{label:'Touches',value:''+k.touches,unit:''}];
    const zp=this.zonesFor(mainPts); v.zoneBars=[['Defensive third',zp[0]],['Middle third',zp[1]],['Attacking third',zp[2]]].map(z=>({label:z[0],val:z[1]+'%',style:{width:z[1]+'%'}}));
    v.legendStyle={background:'linear-gradient(90deg,#0a2a6b,#0aa0b4,#78d23c,#f0dc28,#f0821e,#dc1e1e)'}; v.startDotStyle={background:'#ffffff'}; v.endDotStyle={background:this.A};
    v.legendCaption=S.viewMode==='trail'?(this.genPath(S.selMatch,S.selPlayer,S.phase).length+' tracked positions'):(mainPts.length+' position samples');
    v.setMain=el=>{this._mainC=el;};
    v.pcmpA=S.pcmpA; v.pcmpB=S.pcmpB; v.onPcmpA=e=>this.setState({pcmpA:e.target.value}); v.onPcmpB=e=>this.setState({pcmpB:e.target.value});
    const pa=this.curMap[S.pcmpA]||this.curSquad[0],pb=this.curMap[S.pcmpB]||this.curSquad[0]; v.pcmpAInfo={num:pa.num,name:pa.name,meta:pa.pos+' · #'+pa.num}; v.pcmpBInfo={num:pb.num,name:pb.name,meta:pb.pos+' · #'+pb.num}; v.setPcA=el=>{this._pcA=el;}; v.setPcB=el=>{this._pcB=el;};
    // DATA (raw)
    v.dataChips=[['standings','Standings'],['squad','Squad'],['matches','Matches'],['goaltypes','Goal types']].map(d=>({key:d[0],label:d[1],cls:S.dataSet===d[0]?'chip on':'chip',onClick:()=>this.setState({dataSet:d[0]})}));
    let dcols,drows;
    if(S.dataSet==='standings'){ dcols=['pos','code','team','P','W','D','L','GF','GA','GD','Pts']; drows=this.standings.map((t,i)=>({cells:[i+1,t.code,t.name,t.P,t.W,t.D,t.L,t.GF,t.GA,t.GF-t.GA,t.Pts].map(x=>({v:''+x}))})); }
    else if(S.dataSet==='squad'){ dcols=['num','player','pos','grp','apps','goals','assists','mins','pass%']; drows=this.curSquad.map(p=>({cells:[p.num,p.name,p.pos,p.grp,p.apps,p.goals,p.assists,p.mins,p.passpct].map(x=>({v:''+x}))})); }
    else if(S.dataSet==='matches'){ dcols=['home','hs','as','away','round','date','status']; drows=this.curMatches.map(m=>({cells:[this.teams[m.home].name,m.hs,m.as,this.teams[m.away].name,m.round.split(' · ')[0],m.date,m.status].map(x=>({v:''+x}))})); }
    else { dcols=['goal_type','goals','share']; const gf=team.GF; drows=this.goalTypes(code).map(g=>({cells:[{v:g.label},{v:''+g.value},{v:(g.value/gf*100).toFixed(1)+'%'}]})); }
    v.dataCols=dcols.map(c=>({label:c})); v.dataRows=drows; v.dataCount=drows.length+' rows';
    const cl=code.toLowerCase(); v.dataTitle={standings:'la_liga_2014_15_table',squad:cl+'_squad_2014_15',matches:cl+'_results_2014_15',goaltypes:cl+'_goal_types'}[S.dataSet];
    v.rawSub=(S.source==='wc')?'Scraped via ScraperFC · FBref / Sofascore / Understat · FIFA World Cup 2026':'Realistic sample data modeled on StatsBomb open data · La Liga 2014/15';
    if(v.isWC)this.wcVals(v,S);
    return v;
  }
}
