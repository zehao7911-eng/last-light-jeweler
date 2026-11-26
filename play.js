const orders=[
 ['Tide Letter','Catch a wave inside the sea glass.',0x3bbfae,'oval',1],
 ['Apricot Hour','Set a little sunset in rose gold.',0xff884d,'emerald',2],
 ['Violet Duet','Light both amethysts in turn.',0xb585ef,'round',2],
 ['Winter Window','Follow the blue light across three facets.',0x66ceff,'emerald',3],
 ['Wild Honey','Seal three drops of afternoon light.',0xffc13b,'oval',3],
 ['Midnight Vow','Finish the night with a constellation.',0xdc516c,'round',4]
];
const key='last-light-jeweler-v1', $=s=>document.querySelector(s);
let profile={done:0,rewards:{}};
function merge(p){profile.done=Math.max(profile.done,Math.min(6,Math.max(0,Number(p?.done)|0)));profile.rewards={...profile.rewards,...p?.rewards};try{localStorage.setItem(key,JSON.stringify(profile))}catch{}}
try{merge(JSON.parse(localStorage.getItem(key)))}catch{}
const sdk=bridge({read:()=>profile,write:merge});sdk.connect();addEventListener('pagehide',()=>sdk.stop(),{once:true});
const world=new THREE.Scene(),cam=new THREE.PerspectiveCamera(33,1,.1,60),renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
const panel=$('main');panel.prepend(renderer.domElement);renderer.setPixelRatio(Math.min(devicePixelRatio,2));cam.position.set(0,4.6,7);cam.lookAt(0,.2,0);
function piece(geo,color,parent=world,metal=.15){let m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,metalness:metal,roughness:.25,flatShading:true}));parent.add(m);return m}
world.add(new THREE.HemisphereLight(0xffefde,0x9993c7,1.8));
for(let [x,y,z,c] of [[-4,6,2,0xffe8ab],[4,3,-3,0x88ffee],[1,1,5,0xffbccf]]){let l=new THREE.DirectionalLight(c,1.9);l.position.set(x,y,z);world.add(l)}
let mount=new THREE.Group();world.add(mount);mount.rotation.z=-.22;mount.rotation.y=-.32;
const gold=0xe5b46d;
for(let z of [-.075,.075]){let hoop=piece(new THREE.TorusGeometry(1,.083,12,96),gold,mount,.58);hoop.position.z=z}
let tray=piece(new THREE.CylinderGeometry(2,1.88,.22,96),0x563747);tray.position.y=-1.16;
let trim=piece(new THREE.TorusGeometry(1.94,.025,8,100),gold);trim.rotation.x=Math.PI/2;trim.position.y=-1.04;
let stones=[],claws=[],order,step,angle,target,held=false,charge=0,finished=false,started=false,clock=0,last=0,audio;
function tone(f){try{audio??=new AudioContext();audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;o.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(.09,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.38);o.start();o.stop(audio.currentTime+.4)}catch{}}
function begin(){if(!started){sdk.start();started=true}}
function load(n){order=n;step=0;finished=started=held=false;charge=0;angle=0;target=1.35+n*.25;sdk.prepare();
 for(let m of [...stones,...claws]){mount.remove(m);m.geometry.dispose();m.material.dispose()}stones=[];claws=[];
 let [name,wish,color,cut,count]=orders[n];$('#serial').textContent='LAST LIGHT JEWELER   /   '+(n+1)+' OF 6';$('#name').textContent=name;$('#wish').textContent=wish;$('#action').textContent='Hold to set';
 for(let i=0;i<count;i++){let size=count===1?1.13:.70, theta=(i-(count-1)/2)*.53;
 let s=piece(createGemGeometry(cut,{length:size,width:size*(cut==='round'?1:.78),crownHeight:size*.18,pavilionDepth:size*.30,girdleThickness:.025}),color,mount,.28);s.position.set(1.14*Math.sin(theta),1.14*Math.cos(theta),0);stones.push(s);
 for(let j=0;j<4;j++){let p=piece(new THREE.SphereGeometry(.062,10,10),gold,mount,.55);p.position.copy(s.position);p.position.x+=Math.cos(j*Math.PI/2+.7)*size*.45;p.position.z+=Math.sin(j*Math.PI/2+.7)*size*.4;p.scale.y=2;claws.push(p)}}
}
let px=null;const surface=renderer.domElement;
surface.onpointerdown=e=>{if(finished)return;begin();px=e.clientX;surface.setPointerCapture(e.pointerId)};
surface.onpointermove=e=>{if(px!==null){angle+=(e.clientX-px)*.023;px=e.clientX}};surface.onpointerup=surface.onpointercancel=()=>px=null;
function match(){return (1+Math.cos(angle-target))/2}
const button=$('#action');button.onpointerdown=e=>{if(finished)return;begin();button.setPointerCapture(e.pointerId);held=true;if(match()<.95)tone(150)};button.onpointerup=button.onpointercancel=()=>{held=false};
button.onclick=()=>{if(finished&&performance.now()-last>550)load((order+1)%orders.length)};
function resize(){cam.aspect=panel.clientWidth/panel.clientHeight;cam.position.z=Math.max(6.8,3.5/cam.aspect);cam.lookAt(0,.15,0);cam.updateProjectionMatrix();renderer.setSize(panel.clientWidth,panel.clientHeight,false)}new ResizeObserver(resize).observe(panel);
load(Math.min(5,profile.done));resize();
function draw(t){requestAnimationFrame(draw);let dt=Math.min(.05,(t-clock)/1000);clock=t;
 if(!finished){let quality=match(),ready=quality>=.95;charge=held&&ready?Math.min(1,charge+dt*1.6):Math.max(0,charge-dt*3);
 let s=stones[step];s.rotation.y=angle;s.position.z=.08*Math.sin(angle);s.material.emissive.setHex(orders[order][2]);s.material.emissiveIntensity=ready?.36:.035;
 for(let j=0;j<4;j++)claws[step*4+j].scale.y=2-charge*.95;
 $('#note').textContent=ready?'Light caught · hold to close the prongs':held?'Turn the stone until the light catches':'Slide across the jewel to catch the light';
 $('i').style.width=(held&&ready?charge:quality)*100+'%';
 if(charge>=1){tone(660+step*110);step++;charge=0;held=false;
 if(step===stones.length){finished=true;last=t;merge({done:order+1});sdk.end();sdk.save();$('#note').textContent='Commission sealed · '+orders[order][0];button.textContent=order===5?'Replay collection':'Open next box'}else target=angle+1.8*(step%2?1:-1)}}
 mount.rotation.y=finished?-.32+Math.sin((t-last)/1500)*.78:-.32+.1*Math.sin(angle);renderer.render(world,cam)}requestAnimationFrame(draw);
