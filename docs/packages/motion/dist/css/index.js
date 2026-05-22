export{a as getFadeInStyle}from'../chunk-JD5GYL2O.js';function f(t,o={}){let{color:l="rgba(99, 102, 241, 0.4)",duration:a=600}=o,n=t.currentTarget,e=document.createElement("span"),s=n.getBoundingClientRect(),r=Math.max(s.width,s.height),i=t.clientX-s.left-r/2,c=t.clientY-s.top-r/2;e.style.width=`${r}px`,e.style.height=`${r}px`,e.style.left=`${i}px`,e.style.top=`${c}px`,e.style.position="absolute",e.style.borderRadius="50%",e.style.backgroundColor=l,e.style.pointerEvents="none",e.style.transform="scale(0)",e.style.opacity="1",e.style.transition=`transform ${a}ms ease-out, opacity ${a}ms ease-out`,n.style.position="relative",n.style.overflow="hidden",n.appendChild(e),requestAnimationFrame(()=>{e.style.transform="scale(2)",e.style.opacity="0";}),setTimeout(()=>e.remove(),a);}function d(t,o,l,a=1e3,n=0){let e=Date.now(),s=l-o,r=false,i=()=>{if(r)return;let c=Math.min((Date.now()-e)/a,1),p=1-Math.pow(1-c,3);t.textContent=(o+s*p).toFixed(n),c<1&&requestAnimationFrame(i);};return requestAnimationFrame(i),()=>{r=true;}}var m={ripple:`@keyframes yyc3-ripple {
  from { transform: scale(0); opacity: 1; }
  to { transform: scale(2); opacity: 0; }
}`,pulseGlow:`@keyframes yyc3-pulse-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6); }
}`,slideInBottom:`@keyframes yyc3-slide-in-bottom {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`,fadeInScale:`@keyframes yyc3-fade-in-scale {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}`,shimmer:`@keyframes yyc3-shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}`,float:`@keyframes yyc3-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}`,rotateSlow:`@keyframes yyc3-rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,gradientShift:`@keyframes yyc3-gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}`};function u(){if(typeof document>"u")return;let t="yyc3-motion-keyframes";if(document.getElementById(t))return;let o=document.createElement("style");o.id=t,o.textContent=Object.values(m).join(`

`),document.head.appendChild(o);}export{d as animateNumber,f as createRipple,m as cssKeyframes,u as injectKeyframes};//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map