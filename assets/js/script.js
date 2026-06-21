
const links=document.querySelectorAll('.sidebar a');
const sidebar=document.getElementById('sidebar');
const toggle=document.getElementById('toggle');

toggle.addEventListener('click',()=>{
sidebar.classList.toggle('collapsed');
});

links.forEach(l=>{
l.addEventListener('click',()=>{
document.querySelector(l.getAttribute('href')).scrollIntoView({behavior:'smooth'});
sidebar.classList.add('collapsed');
});
});

// typing
const words=['HTML5','CSS3','JavaScript','Node.js','Backend'];
let i=0,j=0,del=false;
const el=document.getElementById('typing');

function type(){
let w=words[i];
el.textContent=w.substring(0,j);

if(!del){
j++;
if(j>w.length){del=true;setTimeout(type,1000);return;}
}else{
j--;
if(j===0){del=false;i=(i+1)%words.length;}
}

setTimeout(type,del?50:100);
}
type();

document.querySelectorAll('a[href^="#"]').forEach(a=>{
a.addEventListener('click',e=>{
const id=a.getAttribute('href');
const el=document.querySelector(id);
if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'});}
});
});
const bg=document.getElementById('matrix-bg');
if(bg){
for(let i=0;i<80;i++){
 const d=document.createElement('div');
 d.className='bit';
 d.textContent=Math.random()>0.5?'1':'0';
 d.style.left=Math.random()*100+'vw';
 d.style.fontSize=(12+Math.random()*40)+'px';
 d.style.animationDuration=(8+Math.random()*15)+'s';
 d.style.animationDelay=(-Math.random()*20)+'s';
 bg.appendChild(d);
}
}
