
/* ---------- contato montado em tempo de execução (dificulta coleta por robôs) ---------- */
(function(){
  const u=['vncruzm','gmail.com'], t=['55','82','99168','7117'];
  const mail=u[0]+String.fromCharCode(64)+u[1], tel=t[1]+t[2]+t[3], wa='https://wa.me/'+t.join('');
  document.querySelectorAll('[data-wa]').forEach(a=>{a.href=wa});
  document.querySelectorAll('[data-ct="m"]').forEach(b=>b.textContent=mail);
  document.querySelectorAll('[data-ct="t"]').forEach(b=>b.textContent='('+t[1]+') '+t[2]+'-'+t[3]);
  document.querySelectorAll('[data-ct-copy]').forEach(btn=>btn.dataset.c=btn.dataset.ctCopy==='m'?mail:tel);
})();
(function(){
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
const DESK = () => innerWidth >= 960;
const $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const hasG = typeof gsap!=='undefined' && typeof ScrollTrigger!=='undefined';
if(hasG) gsap.registerPlugin(ScrollTrigger);

/* nav + progress */
const nav=$('.nav'), bar=$('.bar');
function onScroll(){const y=scrollY;nav.classList.toggle('solid',y>40);const h=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?y/h:0)+')'}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* cursor */
if(FINE && !RM){
  document.documentElement.classList.add('cursor');
  const c=$('.cur'), r=$('.cur-r'), lab=r.querySelector('span');
  let mx=-100,my=-100,rx=-100,ry=-100;
  addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;c.style.transform=`translate(${mx}px,${my}px)`},{passive:true});
  (function loop(){rx+=(mx-rx)*.18;ry+=(my-ry)*.18;r.style.transform=`translate(${rx}px,${ry}px)`;requestAnimationFrame(loop)})();
  document.addEventListener('pointerover',e=>{const t=e.target.closest('[data-cursor],a,button');r.classList.remove('big','link');lab.textContent='';
    if(!t)return; if(t.dataset.cursor){r.classList.add('big');lab.textContent=t.dataset.cursor}else r.classList.add('link')});
}

/* ---------- HERO: halftone portrait (three.js) ---------- */
const stage=$('#stage'), cv=$('#ht'), still=$('#still'), ring=$('#ring'), ltag=$('#ltag');
const IA=1429/1400, HEAD={x:.43,y:.30,r:.29};
let rect={x:0,y:0,w:0,h:0};
function layout(){
  const W=stage.clientWidth, H=stage.clientHeight;
  let w,h,x,y;
  if(DESK()){h=H*0.97; w=h*IA; x=Math.min(W*0.645-w*0.45, W-w*0.86); y=H-h;}
  else{w=Math.min(W*1.0,H*IA); h=w/IA; x=(W-w)/2+W*0.13; y=H-h;}
  rect={x,y,w,h};
  Object.assign(still.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
  const s=w*HEAD.r*2.55; Object.assign(ring.style,{width:s+'px',height:s+'px',left:(x+w*HEAD.x-s/2)+'px',top:(y+h*HEAD.y-s/2)+'px'});
  return {W,H};
}
let dims=layout();
let ht=null;
function initHalftone(){
  if(typeof THREE==='undefined') return;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:false,premultipliedAlpha:true});}catch(e){return}
  const dpr=Math.min(devicePixelRatio||1,2);
  renderer.setPixelRatio(dpr); renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene(), cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const tex=new THREE.TextureLoader().load('retrato.webp',()=>{stage.classList.add('gl');start()});
  tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
  const U={uTex:{value:tex},uRes:{value:new THREE.Vector2()},uRect:{value:new THREE.Vector4()},uMouse:{value:new THREE.Vector2(-999,-999)},
    uLoupe:{value:110*dpr},uAmt:{value:0},uCell:{value:7.2*dpr},uScroll:{value:0},uIntro:{value:RM?1:0},uDpr:{value:dpr},
    uPaper:{value:new THREE.Color('#EDE9E3')},uRed:{value:new THREE.Color('#E3241B')},uTime:{value:0}};
  const mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,blending:THREE.NoBlending,depthTest:false,
    vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`precision highp float;
uniform sampler2D uTex;uniform vec2 uRes;uniform vec4 uRect;uniform vec2 uMouse;uniform float uLoupe,uAmt,uCell,uScroll,uIntro,uDpr,uTime;uniform vec3 uPaper,uRed;
float lumAt(vec2 px,out float a){vec2 uv=(px-uRect.xy)/uRect.zw;if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.){a=0.;return 0.;}vec4 t=texture2D(uTex,uv);a=t.a;return t.r;}
float screenDot(vec2 p,float ang,float cell,vec2 off,float mode){
  float s=sin(ang),c=cos(ang);mat2 R=mat2(c,-s,s,c);mat2 Ri=mat2(c,s,-s,c);
  vec2 q=R*(p-off);vec2 cq=(floor(q/cell)+.5)*cell;vec2 ctr=Ri*cq+off;
  float a;float l=lumAt(ctr,a);
  float v=mode<.5?pow(l,0.78):clamp((.34-l)*2.4,0.,1.);
  float uvy=(ctr.y-uRect.y)/uRect.w;
  float rev=clamp(uIntro*1.8-(1.-uvy)*.8,0.,1.);
  float lift=clamp(uScroll*2.2-uvy*1.2,0.,1.);
  float r=cell*.6*sqrt(v)*a*rev*(1.-lift);
  return 1.-smoothstep(r-.9*uDpr,r+.9*uDpr,length(q-cq));
}
void main(){
  vec2 p=gl_FragCoord.xy;
  float cell=uCell*(1.+uScroll*1.6);
  float k=screenDot(p,.7854,cell,vec2(0.),0.);
  vec2 mis=vec2(4.,-3.)*uDpr*(.6+uScroll*6.);
  float rd=screenDot(p,.2618,cell*1.08,mis,1.)*clamp(.22+uScroll*1.6,0.,.92);
  vec4 col=vec4(uRed*rd,rd);
  col=col*(1.-k)+vec4(uPaper,1.)*k;
  float d=distance(p,uMouse);
  float inside=(1.-smoothstep(uLoupe-1.5*uDpr,uLoupe+.5*uDpr,d))*uAmt;
  if(inside>0.){
    vec2 lp=uMouse+(p-uMouse)/1.4;float la;float ll=lumAt(lp,la);
    ll=smoothstep(.02,.98,ll);
    vec3 lc=mix(vec3(.05),uPaper,ll);
    vec4 L=vec4(lc*la+vec3(.07)*(1.-la)*.72,la+(1.-la)*.72);
    float cr=step(abs(p.x-uMouse.x),.6*uDpr)+step(abs(p.y-uMouse.y),.6*uDpr);
    cr*=step(d,uLoupe*.22)*step(uLoupe*.06,d);
    L=mix(L,vec4(uRed,1.),clamp(cr,0.,1.)*.9);
    col=mix(col,L,inside);
  }
  float ring=(1.-smoothstep(.8*uDpr,2.2*uDpr,abs(d-uLoupe)))*uAmt;
  float tick=0.;
  vec2 dv=p-uMouse;float ang=atan(dv.y,dv.x);
  tick=step(.985,abs(cos(ang*2.)))*step(uLoupe,d)*step(d,uLoupe+12.*uDpr)*uAmt;
  col=mix(col,vec4(uRed,1.),max(ring,tick));
  gl_FragColor=col;
}`});
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat));
  function size(){dims=layout();renderer.setSize(dims.W,dims.H,false);U.uRes.value.set(dims.W*dpr,dims.H*dpr);
    U.uRect.value.set(rect.x*dpr,(dims.H-rect.y-rect.h)*dpr,rect.w*dpr,rect.h*dpr);U.uLoupe.value=(DESK()?118:62)*dpr;U.uCell.value=(DESK()?7.4:5.6)*dpr;}
  size(); addEventListener('resize',size);
  let tx=-999,ty=-999,cx=-999,cy=-999,amt=0,tamt=0,over=false,lastMove=0,visible=true,running=false;
  stage.addEventListener('pointermove',e=>{const b=stage.getBoundingClientRect();tx=e.clientX-b.left;ty=e.clientY-b.top;if(cx<-900){cx=tx;cy=ty}over=true;lastMove=performance.now();});
  stage.addEventListener('pointerleave',()=>{over=false});
  if(!FINE){stage.addEventListener('pointerdown',e=>{const b=stage.getBoundingClientRect();tx=e.clientX-b.left;ty=e.clientY-b.top;lastMove=performance.now();over=true;setTimeout(()=>over=false,2600)})}
  new IntersectionObserver(es=>{visible=es[0].isIntersecting; if(visible&&!running&&tex.image) start()}).observe(stage);
  function frame(t){
    if(!visible){running=false;return}
    running=true;
    const idle=!over&&performance.now()-lastMove>1800;
    if(idle&&!RM){const hx=rect.x+rect.w*HEAD.x, hy=rect.y+rect.h*HEAD.y, R=rect.w*.2, s=t*.00035;tx=hx+Math.cos(s)*R*1.1;ty=hy+Math.sin(s*1.7)*R*.8;}
    tamt=(over||(idle&&!RM))?1:0;
    if(cx<-900){cx=tx;cy=ty}
    cx+=(tx-cx)*.12;cy+=(ty-cy)*.12;amt+=(tamt-amt)*.08;
    U.uMouse.value.set(cx*dpr,(dims.H-cy)*dpr);U.uAmt.value=amt;U.uTime.value=t*.001;
    if(U.uIntro.value<1)U.uIntro.value=Math.min(1,U.uIntro.value+.012);
    ltag.style.transform=`translate(${cx+U.uLoupe.value/dpr*0.72}px,${cy+U.uLoupe.value/dpr*0.72}px)`;
    ltag.classList.toggle('on',amt>.5&&over);
    renderer.render(scene,cam);
    if(RM&&U.uIntro.value>=1&&!over){running=false;return}
    requestAnimationFrame(frame);
  }
  function start(){if(!running)requestAnimationFrame(frame)}
  if(RM) stage.addEventListener('pointermove',start);
  ht={U,start};
}
try{initHalftone()}catch(e){console.warn(e)}
addEventListener('resize',()=>{if(!ht)dims=layout()});

/* ---------- GSAP scroll work ---------- */
if(hasG && !RM){
  // hero scroll: dots grow, plates drift, name parallax
  ScrollTrigger.create({trigger:'.hero',start:'top top',end:'bottom top',scrub:true,onUpdate:s=>{if(ht){ht.U.uScroll.value=s.progress;ht.start()}}});
  gsap.to('.h-name .first',{yPercent:-28,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.h-name .last',{xPercent:14,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('#ring svg',{rotate:-180,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  // intro
  gsap.from('.h-name .first, .h-name .last',{yPercent:30,duration:1.2,ease:'expo.out',stagger:.08});
  gsap.from('.chain > *',{y:18,duration:.8,ease:'back.out(2)',stagger:.06,delay:.4});
  // marquee skew on velocity
  const mq=$('#mqt'); let sk=0;
  ScrollTrigger.create({onUpdate:s=>{const v=gsap.utils.clamp(-14,14,s.getVelocity()/120);if(Math.abs(v)>Math.abs(sk))sk=v}});
  gsap.ticker.add(()=>{sk*=.9;mq.style.setProperty('--sk',sk);mq.parentElement.style.transform=`skewX(${-sk*.6}deg)`});

  // manifesto word fill
  const m=$('#mani'); const parts=[];
  m.childNodes.forEach(n=>{if(n.nodeType===3){n.textContent.split(/(\s+)/).forEach(w=>{if(!w)return; if(/^\s+$/.test(w))parts.push(document.createTextNode(w)); else {const s=document.createElement('span');s.className='w';s.textContent=w;parts.push(s)}})}else{const s=document.createElement('span');s.className='w k';s.textContent=n.textContent;parts.push(s)}});
  m.textContent='';parts.forEach(p=>m.appendChild(p));
  const ws=$$('.w',m);
  ScrollTrigger.create({trigger:m,start:'top 82%',end:'bottom 45%',scrub:true,onUpdate:s=>{const n=Math.round(s.progress*ws.length);ws.forEach((w,i)=>w.classList.toggle('on',i<n))}});

  // counters
  $$('.num b').forEach(b=>{const n=+b.dataset.n, suf=b.dataset.s||'';const o={v:0};
    ScrollTrigger.create({trigger:b,start:'top 88%',once:true,onEnter:()=>gsap.to(o,{v:n,duration:1.6,ease:'power3.out',onUpdate:()=>b.textContent=Math.round(o.v)+suf})})});

  // process: horizontal pin on desktop
  ScrollTrigger.matchMedia({
    '(min-width: 960px)':function(){
      const proc=$('.proc'), tr=$('#ptrack'); proc.classList.add('pin');
      const dist=()=>Math.max(0,tr.scrollWidth-innerWidth+60);
      const tw=gsap.to(tr,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:proc,start:'top top',end:()=>'+='+dist(),pin:true,scrub:.6,invalidateOnRefresh:true}});
      $$('.pstep',tr).forEach((el,i)=>gsap.fromTo(el.querySelector('h3'),{xPercent:12},{xPercent:-6,ease:'none',scrollTrigger:{trigger:el,containerAnimation:tw,start:'left right',end:'right left',scrub:true}}));
      return ()=>{proc.classList.remove('pin');gsap.set(tr,{clearProps:'transform'})};
    }
  });

  // projects deck
  ScrollTrigger.matchMedia({
    '(min-width: 960px)':function(){
      const sec=$('.work'), cards=$$('#deck .card'), N=cards.length, items=$$('#wkl li'), nEl=$('#wkn'), tEl=$('#wkt'), gEl=$('#wkg');
      sec.classList.add('on'); let cur=-1;
      function set(p){
        const f=p*(N-1);
        cards.forEach((c,i)=>{
          const t=f-i; let y,z,rx,sc,br,op=1;
          if(t<0){const k=Math.min(-t,1);y=k*112;z=0;rx=-8*k;sc=1;br=1;}
          else{const k=Math.min(t,3.2);y=-k*8.5;z=-k*90;rx=k*16;sc=1-k*.05;br=1-Math.min(k,2)*.28;op=t>3.1?0:1;}
          c.style.transform=`translate3d(0,${y}%,${z}px) rotateX(${rx}deg) scale(${sc})`;
          c.style.filter=`brightness(${br})`;c.style.opacity=op;c.style.zIndex=10+i;
          c.style.pointerEvents=Math.abs(t)<.5?'auto':'none';
        });
        const a=Math.min(N-1,Math.max(0,Math.round(f)));
        if(a!==cur){cur=a;items.forEach((li,i)=>li.classList.toggle('on',i===a));nEl.textContent=String(a+1).padStart(2,'0');tEl.textContent=cards[a].dataset.t;gEl.textContent=cards[a].dataset.g;
          gsap.fromTo([nEl,tEl],{yPercent:30,opacity:.2},{yPercent:0,opacity:1,duration:.5,ease:'power3.out'})}
      }
      const st=ScrollTrigger.create({trigger:sec,start:'top top',end:'bottom bottom',scrub:.4,onUpdate:s=>set(s.progress)});
      set(0);
      return ()=>{sec.classList.remove('on');cards.forEach(c=>{c.style.cssText=''})};
    }
  });

  // gentle reveal (transform only, content is visible at rest)
  $$('.xrow, .icard, .ed > div, .chips').forEach(el=>gsap.from(el,{y:30,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}));
  gsap.from('.c-title',{yPercent:20,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:'.contact',start:'top 75%',once:true}});
  addEventListener('load',()=>ScrollTrigger.refresh());
}

/* ---------- pills physics ---------- */
(function(){
  const box=$('#pillbox'); if(typeof Matter==='undefined'||RM) return;
  let started=false;
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting&&!started){started=true;io.disconnect();setTimeout(go,250)}},{threshold:.35});
  io.observe(box);
  function go(){
    const {Engine,Bodies,Composite,Body,Mouse,MouseConstraint}=Matter;
    const B=box.getBoundingClientRect(), W=B.width, H=B.height;
    const els=$$('.pp',box);
    const eng=Engine.create(); eng.gravity.y=1.05;
    const bodies=els.map((el,i)=>{const r=el.getBoundingClientRect();const w=r.width,h=r.height;
      const x=Math.min(W-w/2-8,Math.max(w/2+8,r.left-B.left+w/2+(Math.random()-.5)*40));
      const y=-(60+i*55+Math.random()*80);
      const b=Bodies.rectangle(x,y,w,h,{chamfer:{radius:h/2-1},restitution:.32,friction:.25,frictionAir:.012,density:.002,angle:(Math.random()-.5)*1.1});
      b.el=el;b.w=w;b.h=h;return b;});
    const T=200, walls=[Bodies.rectangle(W/2,H+T/2,W*3,T,{isStatic:true}),Bodies.rectangle(-T/2,H/2-600,T,H*3+1200,{isStatic:true}),Bodies.rectangle(W+T/2,H/2-600,T,H*3+1200,{isStatic:true})];
    Composite.add(eng.world,[...bodies,...walls]);
    box.classList.add('live');
    els.forEach(el=>{el.style.transform='translate(-999px,-999px)'});
    if(FINE){
      const mouse=Mouse.create(box);
      ['mousewheel','DOMMouseScroll','wheel'].forEach(ev=>box.removeEventListener(ev,mouse.mousewheel));
      const mc=MouseConstraint.create(eng,{mouse,constraint:{stiffness:.18,render:{visible:false}}});
      Composite.add(eng.world,mc);
      Matter.Events.on(mc,'startdrag',()=>box.classList.add('grab'));Matter.Events.on(mc,'enddrag',()=>box.classList.remove('grab'));
    }else{
      box.addEventListener('click',e=>{const b=box.getBoundingClientRect();const x=e.clientX-b.left,y=e.clientY-b.top;
        bodies.forEach(bd=>{const dx=bd.position.x-x,dy=bd.position.y-y,d=Math.hypot(dx,dy);if(d<180)Body.applyForce(bd,bd.position,{x:dx/d*.04*bd.mass,y:-.07*bd.mass})})});
    }
    let vis=true; new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis)requestAnimationFrame(tick)}).observe(box);
    let last=performance.now();
    function tick(now){
      if(!vis)return;
      const dt=Math.min(32,now-last);last=now;Engine.update(eng,dt||16.6);
      for(const b of bodies){b.el.style.transform=`translate(${b.position.x-b.w/2}px,${b.position.y-b.h/2}px) rotate(${b.angle}rad)`}
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();

/* ---------- IA orb: halftone sphere ---------- */
(function(){
  const host=$('#orb'), c=$('#orbc'); if(typeof THREE==='undefined')return;
  let r;try{r=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:true})}catch(e){return}
  const dpr=Math.min(devicePixelRatio||1,2);r.setPixelRatio(dpr);r.setClearColor(0,0);
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(35,1,.1,100);cam.position.z=6.2;
  const N=2600,pos=new Float32Array(N*3),col=new Float32Array(N*3),sz=new Float32Array(N);
  const paper=new THREE.Color('#EDE9E3'),red=new THREE.Color('#E3241B');
  for(let i=0;i<N;i++){const y=1-(i/(N-1))*2,rad=Math.sqrt(1-y*y),th=i*2.399963;const x=Math.cos(th)*rad,z=Math.sin(th)*rad;
    pos.set([x*1.6,y*1.6,z*1.6],i*3);const isR=Math.random()<.07;const cc=isR?red:paper;col.set([cc.r,cc.g,cc.b],i*3);
    sz[i]=isR?7:(2.2+ (0.5+0.5*Math.sin(x*5.0+y*4.0))*3.6);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('size',new THREE.BufferAttribute(sz,1));
  const U={uT:{value:0},uD:{value:dpr},uM:{value:new THREE.Vector2()}};
  const m=new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,vertexColors:true,
    vertexShader:`attribute float size;varying vec3 vC;varying float vF;uniform float uT,uD;uniform vec2 uM;
    void main(){vC=color;vec3 p=position;float w=sin(p.y*3.+uT*1.2)*.06+sin(p.x*4.-uT)*.04;p*=1.+w;
    vec4 mv=modelViewMatrix*vec4(p,1.);vF=smoothstep(-7.9,-4.7,mv.z);gl_PointSize=size*uD*(5.2/-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying vec3 vC;varying float vF;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=smoothstep(.5,.38,d);gl_FragColor=vec4(vC,a*(.25+.75*vF));}`});
  const pts=new THREE.Points(g,m);sc.add(pts);
  function size(){const s=host.clientWidth;r.setSize(s,s,false)}size();addEventListener('resize',size);
  let mx=0,my=0,vis=false;
  host.addEventListener('pointermove',e=>{const b=host.getBoundingClientRect();mx=(e.clientX-b.left)/b.width-.5;my=(e.clientY-b.top)/b.height-.5});
  new IntersectionObserver(es=>{vis=es[0].isIntersecting;if(vis)requestAnimationFrame(f)}).observe(host);
  let ry=0,rx=0;
  function f(t){if(!vis)return;U.uT.value=t*.001;ry+=(RM?0:.0025)+(mx*.6-0)*.004;rx+=((my*.6)-rx)*.05;pts.rotation.y=ry;pts.rotation.x=rx+.25;r.render(sc,cam);if(!RM)requestAnimationFrame(f)}
})();

/* ---------- contato: ilustração 3D viva ---------- */
(function(){
  const fig=$('#fig3d'), c=$('#c3d'); if(!fig||typeof THREE==='undefined'||RM) return;
  let r;try{r=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:false,premultipliedAlpha:true})}catch(e){return}
  const dpr=Math.min(devicePixelRatio||1,2); r.setPixelRatio(dpr); r.setClearColor(0,0);
  const sc=new THREE.Scene(), cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  // pontos de movimento: x, y (0..1, y de cima), raio, dx, dy, velocidade, fase
  const P=[[.325,.30,.045,.008,.004,1.7,0],[.571,.30,.04,-.005,.005,1.3,1.2],[.479,.44,.05,0,.008,1.1,2.1],[.215,.47,.05,.007,-.006,1.5,.6],
           [.771,.54,.055,-.007,-.006,1.25,3.0],[.486,.31,.07,.003,.004,.8,1.0],[.111,.49,.055,.005,.003,.9,.3],[.03,.66,.04,.009,-.005,2.1,1.5],
           [.693,.70,.055,-.003,.004,.7,2.4],[.80,.74,.04,.008,.004,1.9,.9],[.93,.345,.016,.006,0,1.6,0],[.45,.62,.14,0,.0035,.6,0]];
  const N=P.length;
  const tex=new THREE.TextureLoader().load('ilustra3d.webp',()=>{fig.classList.add('gl');go()});
  tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
  const U={uTex:{value:tex},uT:{value:0},uM:{value:new THREE.Vector2(0,0)},
    uP:{value:P.map(p=>new THREE.Vector4(p[0],p[1],p[2],p[6]))},uD:{value:P.map(p=>new THREE.Vector3(p[3],p[4],p[5]))}};
  const mat=new THREE.ShaderMaterial({uniforms:U,transparent:true,blending:THREE.NoBlending,depthTest:false,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`precision highp float;varying vec2 vUv;uniform sampler2D uTex;uniform float uT;uniform vec2 uM;
uniform vec4 uP[${N}];uniform vec3 uD[${N}];
void main(){vec2 uv=vec2(vUv.x,1.-vUv.y);vec2 off=vec2(0.);
for(int i=0;i<${N};i++){vec2 d=(uv-uP[i].xy)*vec2(1.135,1.);float w=exp(-dot(d,d)/(2.*uP[i].z*uP[i].z));
float s=sin(uT*uD[i].z+uP[i].w);off+=w*uD[i].xy*s;}
off+=uM*.012*(.4+smoothstep(.9,.1,uv.y));
vec2 q=uv-off;vec4 t=texture2D(uTex,vec2(q.x,1.-q.y));
float in0=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);t.a*=in0;
gl_FragColor=vec4(t.rgb*t.a,t.a);}`});
  sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat));
  function size(){r.setSize(fig.clientWidth,fig.clientHeight,false)} size(); addEventListener('resize',size);
  let vis=false,run=false,mx=0,my=0,cx=0,cy=0;
  $('.contact').addEventListener('pointermove',e=>{const b=fig.getBoundingClientRect();mx=((e.clientX-b.left)/b.width-.5);my=((e.clientY-b.top)/b.height-.5)});
  new IntersectionObserver(es=>{vis=es[0].isIntersecting;go()}).observe(fig);
  function go(){if(vis&&!run&&tex.image){run=true;requestAnimationFrame(f)}}
  function f(t){if(!vis){run=false;return} cx+=(mx-cx)*.05;cy+=(my-cy)*.05;U.uT.value=t*.001;U.uM.value.set(cx,cy);r.render(sc,cam);requestAnimationFrame(f)}
})();

/* ---------- magnetic button ---------- */
(function(){const b=$('#mag');if(!FINE||RM||!b)return;const area=b.parentElement;
  area.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const d=Math.hypot(dx,dy);
    if(d<190){b.style.transform=`translate(${dx*.32}px,${dy*.32}px)`}else b.style.transform=''});
  area.addEventListener('pointerleave',()=>b.style.transform='');})();

/* ---------- contato 3D: tilt ---------- */

/* ---------- copy ---------- */
$$('.copy').forEach(btn=>btn.addEventListener('click',()=>{const v=btn.dataset.c;const done=()=>{const o=btn.textContent;btn.textContent='copiado';setTimeout(()=>btn.textContent=o,1600)};
  const sel=()=>{const s=btn.previousElementSibling;const rg=document.createRange();rg.selectNodeContents(s);const w=getSelection();w.removeAllRanges();w.addRange(rg);btn.textContent='selecionado';setTimeout(()=>btn.textContent='copiar',1600)};
  try{navigator.clipboard.writeText(v).then(done,sel)}catch(e){sel()}}));
})();
