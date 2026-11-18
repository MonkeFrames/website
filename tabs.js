(function(){
var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Hero timecode */
var tc=document.getElementById('rec-tc'),hero=document.querySelector('.hero');
if(tc&&hero&&!reduced){var t0=performance.now(),vis=true,pad=function(n){return(n<10?'0':'')+n};
if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(hero);
(function tick(now){if(vis&&!document.hidden){var ms=now-t0,s=Math.floor(ms/1000);tc.textContent='00:'+pad(Math.floor(s/60)%60)+':'+pad(s%60)+':'+pad(Math.floor(ms%1000*60/1000))}requestAnimationFrame(tick)})(t0)}
/* Explore tabs */
var t=[].slice.call(document.querySelectorAll('.tab')),p=[].slice.call(document.querySelectorAll('.tab-panel')),sec=document.querySelector('.explore');if(!t.length)return;
var cur=0,auto=!reduced,inView=false,hover=false;
t.forEach(function(b){var i=document.createElement('i');i.className='tab-prog';i.setAttribute('aria-hidden','true');b.appendChild(i)});
function pause(){sec.classList.toggle('is-paused',!inView||hover||document.hidden)}
function run(){t.forEach(function(b){b.classList.remove('is-running')});if(!auto)return;void t[cur].offsetWidth;t[cur].classList.add('is-running')}
function show(i,f){cur=i;t.forEach(function(b,j){b.setAttribute('aria-selected',j===i);b.tabIndex=j===i?0:-1;p[j].classList.toggle('is-active',j===i)});if(f)t[i].focus();run()}
function user(){auto=false;run()}
t.forEach(function(b,i){
b.addEventListener('animationend',function(e){if(auto&&e.target.className==='tab-prog')show((cur+1)%t.length)});
b.addEventListener('click',function(){user();show(i)});
b.addEventListener('keydown',function(e){var n={ArrowRight:1,ArrowLeft:-1}[e.key];if(e.key==='Home'){user();e.preventDefault();return show(0,1)}if(e.key==='End'){user();e.preventDefault();return show(t.length-1,1)}if(n){user();e.preventDefault();show((i+n+t.length)%t.length,1)}})});
if(auto){sec.classList.add('is-paused');
sec.addEventListener('mouseenter',function(){hover=true;pause()});sec.addEventListener('mouseleave',function(){hover=false;pause()});
sec.addEventListener('focusin',function(){hover=true;pause()});sec.addEventListener('focusout',function(){hover=false;pause()});
document.addEventListener('visibilitychange',pause);
if('IntersectionObserver' in window)new IntersectionObserver(function(e){inView=e[0].isIntersecting;pause()},{threshold:.35}).observe(sec);else{inView=true;pause()}
run()}
})();
