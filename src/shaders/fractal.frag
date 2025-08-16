precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uLoopPeriod;
uniform float uZoom;
uniform vec2 uPan;
uniform float uAspect;

uniform sampler2D uTransformTex;
uniform int uTransformCount;
uniform int uIterations;

uniform float uFWeights[5];
uniform vec2 uJuliaC;
uniform float uMultiPower;
uniform float uPhoenixP;
uniform int uUsePerTransformWeights;

varying vec2 vUv;

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
mat2 rot(float a) { float s = sin(a), c = cos(a); return mat2(c,-s,s,c); }

// Layout (width=5): tex0..tex4
vec4 fetchCol(sampler2D tex, int i, int h, float col) {
  float y = (float(i)+0.5)/float(h);
  return texture2D(tex, vec2((col+0.5)/5.0, y));
}
vec4 T0(sampler2D tex,int i,int h){return fetchCol(tex,i,h,0.0);}
vec4 T1(sampler2D tex,int i,int h){return fetchCol(tex,i,h,1.0);}
vec4 T2(sampler2D tex,int i,int h){return fetchCol(tex,i,h,2.0);}
vec4 T3(sampler2D tex,int i,int h){return fetchCol(tex,i,h,3.0);}
vec4 T4(sampler2D tex,int i,int h){return fetchCol(tex,i,h,4.0);}

vec2 applyTransform(vec2 uv, sampler2D tex, int i, int count, int texH, float time) {
  if (i < 0 || i >= count) return uv;
  vec4 a = T0(tex,i,texH);
  vec4 b = T1(tex,i,texH);
  int typeId = int(a.x+0.5);
  float w = a.y;
  vec2 pos = a.zw;
  float wAnim = w * (0.8 + 0.2 * sin(6.28318*time));

  if (typeId == 0) {
    uv += (pos - uv) * 0.2 * wAnim;
  } else if (typeId == 1) {
    float ang = b.x * wAnim;
    vec2 d = uv - pos;
    uv = pos + mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*d;
  } else if (typeId == 2) {
    vec2 d = uv - pos;
    float r = length(d);
    float ang = wAnim * r * 2.5;
    uv = pos + mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*d;
  } else if (typeId == 3) {
    float freq = max(0.1, b.x);
    float amp = b.y * wAnim;
    uv += vec2(
      sin(uv.y*freq + time*6.28318)*amp,
      sin(uv.x*freq - time*6.28318)*amp
    );
  } else if (typeId == 4) {
    vec2 d = uv - pos;
    float n = max(3.0, b.x);
    float amp = b.y * wAnim;
    float ang = atan(d.y, d.x);
    float k = cos(ang * n);
    d *= (1.0 + amp * k);
    uv = pos + d;
  } else if (typeId == 5) {
    vec2 d = uv - pos;
    float m = abs(d.x) + abs(d.y) + 1e-5;
    float amp = max(0.0, b.x) * wAnim;
    d = normalize(d) * mix(length(d), m, amp);
    uv = pos + d;
  } else if (typeId == 6) {
    vec2 d = uv - pos;
    float r = length(d)+1e-6;
    float th = atan(d.y, d.x);
    float aAmt = b.x * wAnim;
    float rp = r * (1.0 - aAmt * sin(th));
    uv = pos + rp * vec2(cos(th), sin(th));
  } else if (typeId == 7) {
    vec2 d = uv - pos;
    float r = length(d);
    float amp = b.x * wAnim;
    float freq = max(0.1, b.y);
    float f = 1.0 + amp * sin(6.28318*time*freq + r*4.0);
    uv = pos + d * f;
  } else if (typeId == 8) {
    // mirrorX: fold across horizontal line y = pos.y; blend by wAnim
    vec2 folded = vec2(uv.x, pos.y + abs(uv.y - pos.y));
    uv = mix(uv, folded, clamp(wAnim, 0.0, 1.0));
  } else if (typeId == 9) {
    // mirrorY: fold across vertical line x = pos.x; blend by wAnim
    vec2 folded = vec2(pos.x + abs(uv.x - pos.x), uv.y);
    uv = mix(uv, folded, clamp(wAnim, 0.0, 1.0));
  }
  return uv;
}

vec2 runTransforms(vec2 uv, sampler2D tex, int count, int texH, float time) {
  for (int i = 0; i < 64; i++) {
    if (i >= count) break;
    uv = applyTransform(uv, tex, i, count, texH, time);
  }
  return uv;
}

vec2 cpow(vec2 z, float p) {
  float r = length(z);
  float a = atan(z.y,z.x);
  float rp = pow(r,p);
  float ap = a*p;
  return vec2(rp*cos(ap), rp*sin(ap));
}

float loopT(){ float period=max(0.001,uLoopPeriod); return fract(uTime/period); }

vec3 renderFractal(vec2 S) {
  vec2 uv = (S - uPan) / max(0.001, uZoom);
  float t = loopT();
  int texH = (uTransformCount>0)?uTransformCount:1;
  uv = runTransforms(uv, uTransformTex, uTransformCount, texH, t);

  float w[5];
  for (int i=0;i<5;i++){ w[i]=uFWeights[i]; }

  if (uUsePerTransformWeights==1) {
    vec4 accA = vec4(0.0); float acc4=0.0; float sum=0.0;
    for (int i=0;i<64;i++){
      if (i>=uTransformCount) break;
      vec4 a = T0(uTransformTex,i,texH);
      vec4 swA = T3(uTransformTex,i,texH);
      vec4 swB = T4(uTransformTex,i,texH);
      float wt=a.y; vec2 pos=a.zw;
      float inf = wt * exp(-dot(uv-pos, uv-pos) * 1.75);
      accA += swA * inf; acc4 += swB.x * inf; sum += inf;
    }
    if (sum>1e-5){
      accA/=sum; acc4/=sum;
      w[0]*=(accA.x+0.0001);
      w[1]*=(accA.y+0.0001);
      w[2]*=(accA.z+0.0001);
      w[3]*=(accA.w+0.0001);
      w[4]*=(acc4+0.0001);
    }
  }
  float wsum=w[0]+w[1]+w[2]+w[3]+w[4];
  if (wsum<1e-5){ w[0]=1.0; wsum=1.0; }
  for (int i=0;i<5;i++){ w[i]/=wsum; }

  vec2 z=uv, c=uv, zPrev=z;
  float trap=1e9; int it;
  for (it=0; it<4000; it++){
    if (it>=uIterations) break;
    float ang = 0.6 * sin(6.28318*t);
    z = rot(ang) * z;

    vec2 f0 = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
    vec2 f1 = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + uJuliaC;
    vec2 zbs = vec2(abs(z.x), abs(z.y));
    vec2 f2 = vec2(zbs.x*zbs.x - zbs.y*zbs.y, 2.0*zbs.x*zbs.y) + c;
    vec2 f3 = cpow(z,uMultiPower) + c;
    vec2 f4 = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c + uPhoenixP * zPrev;

    vec2 zNext = w[0]*f0 + w[1]*f1 + w[2]*f2 + w[3]*f3 + w[4]*f4;
    zPrev=z; z=zNext;

    float r2=dot(z,z);
    trap=min(trap, abs(z.x)+abs(z.y));
    if (r2>64.0) break;
  }

  float fi = float(it)/float(max(1,uIterations));
  float d = clamp(trap*0.5, 0.0, 1.0);
  vec3 col = palette(
    0.25 + 0.75 * fi + 0.2 * sin(6.28318 * t),
    vec3(0.53,0.49,0.55),
    vec3(0.5,0.5,0.5),
    vec3(1.0,0.8,0.35),
    vec3(0.0,0.33,0.67)
  );
  col = mix(vec3(0.02), col, smoothstep(0.0, 1.0, 1.0 - d));
  return col;
}

void main(){
  vec2 S = (gl_FragCoord.xy/uResolution - 0.5) * vec2(uAspect,1.0);
  vec3 col = renderFractal(S);
  gl_FragColor = vec4(col,1.0);
}
