# Workflow: 3D Viewer — Axis & Orbit Convention

**Apply this automatically whenever building any 3D viewer. No trigger phrase needed.**

---

## Rule

Every 3D viewer in BE Eng must:
1. Use **pure WebGL only** — no Three.js or external 3D libraries (blocked in artifact sandbox)
2. Match the **APF axis orientation** exactly (same visual as Ch3_APF.html)
3. Include the **standard axis HUD** in the bottom-left corner
4. Use the **standard default view** angles

---

## Coordinate convention

**Z is vertical (up), X goes left, Y goes right — right-handed.**

Verify with the right-hand rule: point fingers from X (left) toward Y (right), curl upward → thumb points toward Z (up). ✓

The rotation pipeline pre-applies a **negate-X + swap-Y↔Z** transform so that world-z maps to screen-up and world-x maps to screen-left:

1. **NegXSwapYZ** first — maps world [x,y,z] → camera [-x, z, y]
2. **RotY(azimuth)** second — horizontal spin around the visual vertical
3. **RotX(elevation)** third — vertical tilt

```javascript
function mat4RotY(a){ const c=Math.cos(a),s=Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
function mat4RotX(a){ const c=Math.cos(a),s=Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }
function mat4Mul(a,b){ const o=new Float32Array(16); for(let i=0;i<4;i++) for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[i+k*4]*b[k+j*4];o[i+j*4]=s;} return o; }

// NegXSwapYZ: col0=[-1,0,0,0], col1=[0,0,1,0], col2=[0,1,0,0], col3=[0,0,0,1]
// Maps world x→-camera_x (LEFT), world y→camera_z (depth), world z→camera_y (UP)
function getRotMat(){
  const negXSwapYZ=new Float32Array([-1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1]);
  return mat4Mul(mat4RotX(orbElevation), mat4Mul(mat4RotY(orbAzimuth), negXSwapYZ));
}
```

**For canvas-2D viewers** (APF / Miller indices style), apply the same mapping in the CPU-side transform. Note: `p` is already centred (center subtracted) before being passed in:

```javascript
function transform(p){
  // [−x, z, y]: negate x (→ left) + swap y↔z (z → vertical up). Right-handed ✓
  const mapped = {x: -p.x, y: p.z, z: p.y};
  let q = rotateY(mapped, yaw);
  q = rotateX(q, pitch);
  return q;
}
```

For the xform / invXform pair in the Miller indices viewer:
```javascript
function xform(p) {
  let q = V.sub(p, CENTER);
  q = [-q[0], q[2], q[1]];   // negate x + swap y↔z
  q = rotY(q, yaw);
  q = rotX(q, pitch);
  return q;
}
function invXform(q) {
  let p = rotX(q, -pitch);
  p = rotY(p, -yaw);
  p = [-p[0], p[2], p[1]];   // inverse of [-x, z, y]
  return V.add(p, CENTER);
}
// Axis indicator direction vectors use the same mapping:
// rotY([-a.p[0], a.p[2], a.p[1]], yaw)
```

---

## HCP geometry

HCP positions must store the c-axis in **z** (not y). Hexagonal in-plane arrangement is in the **xy** plane:

```javascript
// Bottom ring (z = 0), top ring (z = c), interstitial (z = c/2)
a.push({pos:[Math.cos(th), Math.sin(th), 0],   label:'corner'});  // bottom
a.push({pos:[Math.cos(th), Math.sin(th), c],   label:'corner'});  // top
// center: [0, 0, C_OVER_A/2], axisLabels: ['a','a','c']
```

---

## Default & reset view

```javascript
let yaw   =  0.55;  // positive — matches x-left convention
let pitch =  0.45;  // vertical tilt
// or for WebGL:
let orbAzimuth   =  0.55;
let orbElevation =  0.45;
```

View presets (positive yaw — the negXSwapYZ handles axis orientation):
```javascript
const VIEW_PRESETS = {
  front: { yaw: 0,    pitch: 0           },
  top:   { yaw: 0,    pitch: Math.PI / 2 },
  iso:   { yaw: 0.55, pitch: 0.45        },
};
// WebGL equivalent:
const views = {
  front: { az: 0,         el: 0    },
  side:  { az: Math.PI/2, el: 0    },
  reset: { az: 0.55,      el: 0.45 },
};
```

---

## Drag handler

```javascript
let isDrag=false, lastDragX=0, lastDragY=0;

cv.addEventListener('pointerdown', e => {
  isDrag=true; lastDragX=e.clientX; lastDragY=e.clientY;
  cv.setPointerCapture(e.pointerId); cv.style.cursor='grabbing';
});
cv.addEventListener('pointerup',     () => { isDrag=false; cv.style.cursor='grab'; });
cv.addEventListener('pointercancel', () => { isDrag=false; cv.style.cursor='grab'; });
cv.addEventListener('pointermove', e => {
  if(!isDrag) return;
  const dx=e.clientX-lastDragX, dy=e.clientY-lastDragY;
  lastDragX=e.clientX; lastDragY=e.clientY;
  orbAzimuth  += dx*0.01;
  orbElevation = Math.max(-Math.PI/2+0.05, Math.min(Math.PI/2-0.05, orbElevation+dy*0.01));
});
```

---

## Axis HUD (bottom-left corner)

Draws x (red), y (green), z (blue) — depth-sorted so front axes render on top. **No origin dot.**

```javascript
function drawAxisHUD(){
  const hud=document.getElementById('axisHUD');
  const dpr=window.devicePixelRatio||1, S=56;
  if(hud.width!==S*dpr){ hud.width=S*dpr; hud.height=S*dpr; }
  const ctx=hud.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,S,S);
  const cx=S/2, cy=S/2, len=20;
  const me=getRotMat();
  const axes=[{d:[1,0,0],c:'#dd2222',l:'x'},{d:[0,1,0],c:'#22aa22',l:'y'},{d:[0,0,1],c:'#2244cc',l:'z'}];
  const pts=axes.map(({d,c,l})=>{
    const rx=me[0]*d[0]+me[4]*d[1]+me[8]*d[2];
    const ry=me[1]*d[0]+me[5]*d[1]+me[9]*d[2];
    const rz=me[2]*d[0]+me[6]*d[1]+me[10]*d[2];
    return{px:cx+rx*len, py:cy-ry*len, depth:rz, c, l};
  });
  pts.sort((a,b)=>a.depth-b.depth);
  pts.forEach(({px,py,c,l})=>{
    ctx.strokeStyle=c; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
    ctx.fillStyle=c; ctx.font='bold 9px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(l, px+(px-cx)*0.32, py+(py-cy)*0.32);
  });
}
```

Required HTML element:
```html
<canvas id="axisHUD" style="position:absolute;bottom:8px;left:8px;width:56px;height:56px;pointer-events:none;z-index:10;"></canvas>
```
