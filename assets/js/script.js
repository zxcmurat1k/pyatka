// sidebar anime toggle
const sidebar=document.getElementById('sidebar');
const toggle=document.getElementById('toggle');

let open=false;

function animateSidebar(){
if(open){
anime({targets:'.sidebar',translateX:-180,duration:500,easing:'easeInOutQuad'});
}else{
anime({targets:'.sidebar',translateX:0,duration:500,easing:'easeInOutQuad'});
}
open=!open;
}

toggle.addEventListener('click',animateSidebar);

// smooth scroll
document.querySelectorAll('.sidebar a').forEach(a=>{
a.addEventListener('click',e=>{
e.preventDefault();
const id=a.getAttribute('href');
const el=document.querySelector(id);
if(el){
anime({targets:document.documentElement,scrollTop:el.offsetTop,duration:800,easing:'easeInOutQuad'});
sidebar.classList.add('collapsed');
open=false;
}
});
});

// hero animation
anime.timeline()
.add({targets:'.hero h1',opacity:[0,1],translateY:[-40,0],duration:1200})
.add({targets:'.badge',scale:[0,1],duration:600},'-=800')
.add({targets:'.btn',opacity:[0,1],delay:anime.stagger(200)});

// typing simple anime fade
anime({targets:'#typing',opacity:[0,1],duration:1500,loop:true,direction:'alternate'});
const words = [
'HTML5',
'CSS3',
'JavaScript',
'Node.js',
'Git/GitHub'
];
