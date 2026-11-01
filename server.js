const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000, ADMIN_PIN=process.env.ADMIN_PIN||'CHANGEZ-MOI', ROOM=process.env.ROOM_CODE||'TUCHES';
const positions=new Set([2,5,8,11,14,17,19]);
let questions=Array.from({length:20},(_,i)=>({type:positions.has(i)?'THÈME':'CULTURE G',question:'',answers:['','','',''],correct:0}));
let current=0,visible=false,revealed=false,deadline=0,round=0,players={},responses={};
const tokens=new Map();
const json=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
const body=async req=>{let s='';for await(const c of req){s+=c;if(s.length>200000)throw Error('Trop volumineux')}return JSON.parse(s||'{}')};
const auth=req=>req.headers['x-admin-pin']===ADMIN_PIN;
const clean=s=>String(s||'').trim().slice(0,32);
const publicState=()=>({current,visible,revealed,deadline:deadline||null,round,question:visible?questions[current].question:'',answers:visible?questions[current].answers:[],type:questions[current].type,correct:revealed?questions[current].correct:null,responded:Object.keys(responses).length,players:Object.keys(players).length});
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&['/','/admin','/play','/screen'].includes(url.pathname)){const name=url.pathname==='/play'?'play.html':url.pathname==='/screen'?'screen.html':'admin.html';res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return fs.createReadStream(path.join(__dirname,name)).pipe(res)}
 if(req.method==='GET'&&url.pathname==='/api/state')return json(res,200,publicState());
 if(req.method==='POST'&&url.pathname==='/api/join'){const b=await body(req),name=clean(b.name);if(clean(b.room).toUpperCase()!==ROOM.toUpperCase())return json(res,403,{error:'Code de partie incorrect'});if(!name)return json(res,400,{error:'Pseudo requis'});if(Object.values(players).some(p=>p.name.toLowerCase()===name.toLowerCase()))return json(res,409,{error:'Pseudo déjà utilisé'});const token=crypto.randomBytes(24).toString('hex');tokens.set(token,name);players[token]={name};return json(res,200,{token,name})}
 if(req.method==='GET'&&url.pathname==='/api/me'){const token=req.headers['x-player-token'];if(!tokens.has(token))return json(res,401,{error:'Reconnecte-toi'});return json(res,200,{name:tokens.get(token),answer:responses[token]??null,round})}
 if(req.method==='POST'&&url.pathname==='/api/answer'){const token=req.headers['x-player-token'];if(!tokens.has(token))return json(res,401,{error:'Connexion requise'});const b=await body(req);if(!visible||revealed||!deadline||Date.now()>=deadline)return json(res,403,{error:'Réponses fermées'});if(b.round!==round)return json(res,409,{error:'Question dépassée'});if(responses[token]!==undefined)return json(res,409,{error:'Réponse déjà verrouillée'});if(!Number.isInteger(b.answer)||b.answer<0||b.answer>3)return json(res,400,{error:'Réponse invalide'});responses[token]=b.answer;return json(res,200,{ok:true,answer:b.answer})}
 if(url.pathname.startsWith('/api/admin')){if(!auth(req))return json(res,401,{error:'Code organisateur incorrect'});
 if(req.method==='GET')return json(res,200,{...publicState(),questions,players:Object.entries(players).map(([token,p])=>({name:p.name,answer:responses[token]??null})),room:ROOM});
 if(req.method==='POST'){const b=await body(req);if(url.pathname==='/api/admin/questions'){if(!Array.isArray(b.questions)||b.questions.length!==20)return json(res,400,{error:'20 questions requises'});questions=b.questions.map((q,i)=>({type:positions.has(i)?'THÈME':'CULTURE G',question:String(q.question||'').slice(0,500),answers:Array.from({length:4},(_,j)=>String(q.answers?.[j]||'').slice(0,200)),correct:Math.max(0,Math.min(3,Number(q.correct)||0))}));return json(res,200,{ok:true})}
 if(url.pathname==='/api/admin/action'){const action=b.action;if(action==='select'){if(!Number.isInteger(b.index)||b.index<0||b.index>=20)return json(res,400,{error:'Index invalide'});current=b.index;visible=false;revealed=false;deadline=0;round++;responses={}}
 else if(action==='show'){visible=true;revealed=false;deadline=0;round++;responses={}}
 else if(action==='start'){if(!visible||revealed)return json(res,400,{error:'Affiche la question avant de lancer le chrono'});if(deadline)return json(res,400,{error:'Chrono déjà lancé'});deadline=Date.now()+30000}
 else if(action==='reveal'){visible=true;revealed=true;deadline=0}
 else if(action==='hide'){visible=false;deadline=0}
 else if(action==='resetplayers'){players={};tokens.clear();responses={}}
 else return json(res,400,{error:'Action inconnue'});return json(res,200,{ok:true})}
 }}
 return json(res,404,{error:'Introuvable'});
 }catch(e){return json(res,400,{error:e.message})}}).listen(PORT,()=>console.log('Quiz prêt sur le port '+PORT));
