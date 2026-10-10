(()=>{'use strict';
const $=id=>document.getElementById(id);
const KEY='kanji-trainer-weather-city-v1';
const DEFAULT={name:'Madrid',country:'España',admin:'Comunidad de Madrid',latitude:40.4168,longitude:-3.7038,timezone:'Europe/Madrid'};
let city=DEFAULT,seq=0,lastFetch=0;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved.name==='string'&&saved.name.length<100&&Number.isFinite(saved.latitude)&&Number.isFinite(saved.longitude)&&Math.abs(saved.latitude)<=90&&Math.abs(saved.longitude)<=180)city=saved}catch{}
const labels={0:'☀️ 晴れ',1:'🌤️ 晴れ',2:'⛅ 晴れ時々曇り',3:'☁️ 曇り',45:'🌫️ 霧',48:'🌫️ 霧',51:'🌦️ 霧雨',53:'🌦️ 霧雨',55:'🌧️ 霧雨',56:'🌧️ 凍る霧雨',57:'🌧️ 凍る霧雨',61:'🌧️ 雨',63:'🌧️ 雨',65:'🌧️ 強い雨',66:'🌧️ 凍る雨',67:'🌧️ 凍る雨',71:'❄️ 雪',73:'❄️ 雪',75:'❄️ 大雪',77:'❄️ 雪',80:'🌦️ にわか雨',81:'🌧️ にわか雨',82:'🌧️ 強いにわか雨',85:'🌨️ にわか雪',86:'🌨️ にわか雪',95:'⛈️ 雷雨',96:'⛈️ 雷雨',99:'⛈️ 雷雨'};
function cityLabel(c){return c.name+(c.admin?', '+c.admin:'')+(c.country?', '+c.country:'')}
async function getJson(url){const controller=new AbortController();const t=setTimeout(()=>controller.abort(),9000);try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
async function refresh(){const request=++seq;const c=city;$('weatherDisplay').textContent=c.name+' · Consultando tiempo…';try{const params=new URLSearchParams({latitude:String(c.latitude),longitude:String(c.longitude),current:'weather_code,temperature_2m',timezone:'auto'});const data=await getJson('https://api.open-meteo.com/v1/forecast?'+params);if(request!==seq)return;const code=data.current?.weather_code;const label=labels[code];if(!label)throw Error('Código meteorológico no disponible');const temp=data.current.temperature_2m;const tempText=typeof temp==='number'&&Number.isFinite(temp)?' · '+Math.round(temp)+'°C':'';$('weatherDisplay').textContent=c.name+' · '+label+tempText;lastFetch=Date.now()}catch{if(request!==seq)return;$('weatherDisplay').textContent=c.name+' · Tiempo no disponible';}}
function setPicker(open){if(!open){++searchSeq;clearTimeout(searchTimer)}$('weatherPicker').hidden=!open;$('weatherChange').setAttribute('aria-expanded',String(open));if(open)$('weatherCity').focus()}
$('weatherChange').addEventListener('click',()=>setPicker($('weatherPicker').hidden));
let searchTimer=null,searchSeq=0;
function clearResults(){ $('weatherResults').replaceChildren(); }
async function search(){
 const q=$('weatherCity').value.trim(),msg=$('weatherMessage'),results=$('weatherResults');
 const request=++searchSeq;
 clearResults();
 if(q.length<2){msg.textContent=q?'Escribe al menos dos letras.':'';return}
 msg.textContent='Buscando ciudades…';
 try{
  const data=await getJson('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:q,count:'10',language:'es',format:'json'}));
  if(request!==searchSeq||$('weatherCity').value.trim()!==q||$('weatherPicker').hidden)return;
  const cities=(data.results||[]).filter(x=>Number.isFinite(x.latitude)&&Number.isFinite(x.longitude));
  if(!cities.length){msg.textContent='No se encontraron ciudades. Prueba con otro nombre.';return}
  msg.textContent='Selecciona una ciudad:';
  for(const item of cities){
   const c={name:item.name,country:item.country||'',admin:item.admin1||'',latitude:item.latitude,longitude:item.longitude,timezone:item.timezone||'auto'};
   const b=document.createElement('button');b.type='button';b.textContent=cityLabel(c);
   b.addEventListener('click',()=>{
    ++searchSeq;clearTimeout(searchTimer);city=c;
    try{localStorage.setItem(KEY,JSON.stringify(city))}catch{}
    setPicker(false);clearResults();msg.textContent='';refresh();
   });
   results.appendChild(b);
  }
 }catch{if(request===searchSeq&&!$('weatherPicker').hidden)msg.textContent='No se pudo buscar. Comprueba la conexión a Internet.'}
}
$('weatherCity').addEventListener('input',()=>{
 ++searchSeq;clearTimeout(searchTimer);clearResults();
 const q=$('weatherCity').value.trim();
 $('weatherMessage').textContent=q.length<2?(q?'Escribe al menos dos letras.':''):'Esperando para buscar…';
 if(q.length>=2)searchTimer=setTimeout(search,350);
});
$('weatherCity').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(searchTimer);search()}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastFetch>30*60*1000)refresh()});
refresh();
})();
