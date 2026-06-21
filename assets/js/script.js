
// anime intro
document.addEventListener("DOMContentLoaded",()=>{
anime.timeline()
.add({
  targets:'#hero h1',
  opacity:[0,1],
  translateY:[-30,0],
  duration:1000
})
.add({
  targets:'.hero-anim',
  opacity:[0,1],
  translateY:[20,0],
  delay:300
});

anime({targets:'.badge',scale:[0,1],duration:800,easing:'easeOutBack'});
anime({targets:'.card',translateY:[30,0],opacity:[0,1],delay:anime.stagger(100)});
anime({targets:'.btn',scale:[0.8,1],delay:anime.stagger(200)});
anime({targets:'.section',opacity:[0,1],translateY:[50,0],delay:anime.stagger(150)});
anime({targets:'.tech-card',rotateX:[90,0],delay:anime.stagger(100)});
anime({targets:'#typing',opacity:[0,1],duration:800});

});
// theme toggle (keyboard T)
document.addEventListener("keydown",(e)=>{
  if(e.key==="t"){
    document.body.classList.toggle("light");
  }
});