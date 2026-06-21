
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
