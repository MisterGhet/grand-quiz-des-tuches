const fs=require('fs'),path=require('path');
const themes=['Animaux et nature','Disney & Pixar','Gastronomie','Sport','Cinéma','Séries','Mythologie grecque','Jeux vidéo','Célébrités','Géographie','Nouvelles technologies','Histoire de France','Marques et logos','Super-héros'];
const file=path.join(__dirname,'manche2.json');
const blank=()=>({players:Array.from({length:7},(_,i)=>({id:i+1,name:'Joueur '+(i+1),streakUsed:false})),themes:themes.map((name,i)=>({id:i,name,used:false,questions:Array.from({length:15},()=>({question:'',answer:''}))})),phase:'grid',theme:null,player:null,streak:false,startedAt:null,remaining:90,answers:[],history:[],version:0});
let state=blank(),status='local';try{if(fs.existsSync(file)){let saved=JSON.parse(fs.readFileSync(file));if(saved.themes?.length===14&&saved.players?.length===7)state=saved}}catch(e){console.error('Manche2 local:',e)}
// Les données de la manche 2 sont stockées sur une branche GitHub dédiée.
// Les commits de cette branche ne déclenchent pas les déploiements Render de main.
const TOKEN=process.env.GITHUB_TOKEN||'',REPO=process.env.GITHUB_REPO||'MisterGhet/grand-quiz-des-tuches';
const DATA_BRANCH=process.env.QUIZ_DATA_BRANCH||'quiz-data';
let queue=Promise.resolve(), ready=false;
async function gh(endpoint,method='GET',payload){
 const r=await fetch(`https://api.github.com/repos/${REPO}/${endpoint}`,{
  method,headers:{Authorization:`Bearer ${TOKEN}`,Accept:'application/vnd.github+json','User-Agent':'grand-quiz-des-tuches','Content-Type':'application/json'},
  body:payload?JSON.stringify(payload):undefined
 });
 if(r.status===404)return null;
 if(!r.ok)throw Error('GitHub HTTP '+r.status+' : '+(await r.text()).slice(0,140));
 return r.json();
}
async function ensureBranch(){
 const branch=await gh('branches/'+encodeURIComponent(DATA_BRANCH));
 if(branch)return;
 const base=await gh('git/ref/heads/main');
 if(!base?.object?.sha)throw Error('Branche main introuvable');
 await gh('git/refs','POST',{ref:'refs/heads/'+DATA_BRANCH,sha:base.object.sha});
}
async function getRemote(){return gh('contents/manche2.json?ref='+encodeURIComponent(DATA_BRANCH))}
async function putRemote(snapshot){
 const old=await getRemote();
 return gh('contents/manche2.json','PUT',{
  message:'Sauvegarde manche 2 (sans redéploiement)',branch:DATA_BRANCH,
  content:Buffer.from(snapshot).toString('base64'),...(old?{sha:old.sha}:{})
 });
}
async function init(){
 if(!TOKEN){status='ATTENTION : GITHUB_TOKEN absent, sauvegarde durable désactivée';return}
 try{
  await ensureBranch();
  let x=await getRemote();
  if(x){let d=JSON.parse(Buffer.from(x.content.replace(/\s/g,''),'base64').toString());if(d.themes?.length===14&&d.players?.length===7)state=d}
  else await putRemote(JSON.stringify(state,null,2));
  status='Sauvegarde sur la branche '+DATA_BRANCH+' (sans redéploiement)';ready=true;persistLocal();
 }catch(e){status='ERREUR sauvegarde : '+e.message;console.error(status)}
}
function persistLocal(){try{fs.writeFileSync(file,JSON.stringify(state,null,2))}catch(e){console.error(e)}}
async function persist(){
 if(!ready)throw Error('Sauvegarde durable indisponible : '+status);
 state.version++;
 const snapshot=JSON.stringify(state,null,2);
 await putRemote(snapshot);
 persistLocal();
 status='Sauvegarde sur la branche '+DATA_BRANCH+' (sans redéploiement)';
}
function elapsed(){if(state.phase!=='running'||!state.startedAt)return state.remaining;return Math.max(0,Math.ceil((state.startedAt+state.remaining*1000-Date.now())/1000))}
function total(playerId){return state.history.filter(x=>x.player===playerId).reduce((a,x)=>a+x.points,0)}
function publicState(admin=false){let p=state.players.find(x=>x.id===state.player);let t=state.themes.find(x=>x.id===state.theme);let good=state.answers.filter(x=>x===true).length;return {phase:state.phase,theme:state.theme,themeName:t?.name||null,player:state.player,playerName:p?.name||null,streak:state.streak,seconds:elapsed(),startedAt:state.startedAt,remaining:state.remaining,points:good*(state.streak?2:1),correct:good,answered:state.answers.length,themes:state.themes.map(x=>({id:x.id,name:x.name,used:x.used})),ranking:state.players.map(x=>({id:x.id,name:x.name,points:total(x.id),streakUsed:x.streakUsed})).sort((a,b)=>b.points-a.points),version:state.version,...(admin?{players:state.players,questions:t?.questions||[],allQuestions:state.themes.map(x=>({id:x.id,questions:x.questions})),answers:state.answers,history:state.history,storageStatus:status}: {})}}
function fail(message){let e=new Error(message);e.status=400;throw e}
async function action(b){let before=JSON.stringify(state);try{let a=b.action,p=state.players.find(x=>x.id===Number(b.player)),t=state.themes.find(x=>x.id===Number(b.theme));
if(a==='players'){if(!Array.isArray(b.names)||b.names.length!==7)fail('7 noms requis');state.players.forEach((x,i)=>x.name=String(b.names[i]||'Joueur '+(i+1)).trim().slice(0,40));}
else if(a==='questions'){let z=state.themes.find(x=>x.id===Number(b.theme));if(!z||!Array.isArray(b.questions)||b.questions.length!==15)fail('15 questions requises');z.questions=b.questions.map(x=>({question:String(x.question||'').slice(0,500),answer:String(x.answer||'').slice(0,300)}));}
else if(a==='select'){if(!p||!t||t.used||state.phase!=='grid')fail('Joueur, thème ou phase invalide');state.player=p.id;state.theme=t.id;state.streak=false;state.answers=[];state.remaining=90;state.startedAt=null;state.phase='preview';}
else if(a==='streak'){if(state.phase!=='preview')fail('Streak uniquement avant le départ');let current=state.players.find(x=>x.id===state.player);if(!current||current.streakUsed)fail('Streak déjà utilisée');state.streak=!!b.enabled;}
else if(a==='start'){if(state.phase!=='preview')fail('Choisis un thème avant de démarrer');let current=state.players.find(x=>x.id===state.player);if(state.streak){if(current.streakUsed)fail('Streak déjà utilisée');current.streakUsed=true}state.phase='running';state.remaining=90;state.startedAt=Date.now();}
else if(a==='pause'){if(state.phase!=='running')fail('Chrono non actif');state.remaining=elapsed();state.startedAt=null;state.phase='paused';}
else if(a==='resume'){if(state.phase!=='paused')fail('Chrono non en pause');state.startedAt=Date.now();state.phase='running';}
else if(a==='timer'){if(!['running','paused'].includes(state.phase))fail('Chrono non lancé');state.remaining=Math.max(0,Math.min(600,Number(b.seconds)||0));state.startedAt=state.phase==='running'?Date.now():null;}
else if(a==='answer'){if(!['running','paused','finished'].includes(state.phase))fail('Commence le passage');if(state.answers.length>=15)fail('15 questions maximum');state.answers.push(b.correct===true);}
else if(a==='undo'){if(!['running','paused','finished'].includes(state.phase))fail('Passage non commencé');state.answers.pop();}
else if(a==='finish'){if(!['running','paused','finished'].includes(state.phase))fail('Passage non commencé');state.remaining=elapsed();state.startedAt=null;state.phase='finished';}
else if(a==='commit'){if(state.phase!=='finished')fail('Termine le passage avant validation');let theme=state.themes[state.theme];if(theme.used)fail('Thème déjà validé');let correct=state.answers.filter(Boolean).length;state.history.push({player:state.player,theme:state.theme,correct,streak:state.streak,points:correct*(state.streak?2:1),at:new Date().toISOString()});theme.used=true;state.phase='grid';state.player=null;state.theme=null;state.streak=false;state.answers=[];state.startedAt=null;state.remaining=90;}
else if(a==='back'){if(state.phase!=='preview')fail('Retour possible avant le démarrage seulement');state.phase='grid';state.player=null;state.theme=null;state.streak=false;}
else if(a==='correctHistory'){let h=state.history[Number(b.index)];if(!h)fail('Passage introuvable');h.correct=Math.max(0,Math.min(15,Number(b.correct)||0));h.points=h.correct*(h.streak?2:1);}
else if(a==='reset'){if(b.confirm!=='REINITIALISER')fail('Confirmation requise');state=blank();}
else fail('Action inconnue');await persist();}catch(e){state=JSON.parse(before);throw e}}
function handler(req,res,url,auth,body,json){if(req.method==='GET'&&url.pathname==='/admin/manche2')return serve('admin2.html',res);if(req.method==='GET'&&url.pathname==='/screen/manche2')return serve('screen2.html',res);if(url.pathname==='/api/manche2/state'&&req.method==='GET')return json(res,200,publicState());if(url.pathname.startsWith('/api/manche2/admin')){if(!auth(req))return json(res,401,{error:'Code organisateur incorrect'});if(req.method==='GET')return json(res,200,publicState(true));if(req.method==='POST')return body(req).then(b=>queue=queue.catch(()=>{}).then(async()=>{await action(b);return json(res,200,publicState(true))}));}return false}
function serve(name,res){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(path.join(__dirname,name)).pipe(res);return true}
module.exports={handler,init};
