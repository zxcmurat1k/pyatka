
const words=['HTML5','CSS3','JavaScript','Node.js','Backend Development'];
let i=0,j=0,d=false;const el=document.getElementById('typing');
function type(){let w=words[i];el.textContent=w.substring(0,j);
if(!d){j++;if(j>w.length){d=true;setTimeout(type,1200);return;}}
else{j--;if(j===0){d=false;i=(i+1)%words.length;}}
setTimeout(type,d?50:100)} type();

document.querySelectorAll('.reveal').forEach(e=>{
new IntersectionObserver(x=>x.forEach(v=>{if(v.isIntersecting)e.classList.add('active')})).observe(e);
});

document.querySelectorAll('[data-target]').forEach(el=>{
new IntersectionObserver(es=>es.forEach(en=>{
if(en.isIntersecting){let t=+el.dataset.target,c=0;
let id=setInterval(()=>{c++;el.textContent=c;if(c>=t)clearInterval(id)},60)}
})).observe(el);
});
