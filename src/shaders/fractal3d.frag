// src/shaders/fractal3d.frag
precision highp float;

// Common uniforms (shared with 2D shader)
uniform vec2 uResolution;      // render target pixels (DPR aware)
uniform float uTime;           // seconds shaped by loop mode (phase * period)
uniform float uLoopPeriod;     // seconds per loop
uniform float uZoom;           // camera dolly (mapped)
uniform vec2 uPan;             // camera target offset in XY (normalized space)
uniform float uAspect;         // aspect = width/height of render target

// Transform texture (same layout and count as 2D)
uniform sampler2D uTransformTex;
uniform int uTransformCount;   // number of rows (transforms)
uniform int uIterations;       // iteration budget (used by DEs)

// 2D-blend uniforms reused by 3D for set selection
uniform float uFWeights[5];    // [Bulb, JuliaBulb, Mandelbox, Menger, Sierpinski]
uniform vec2 uJuliaC;          // used as part of vec3 c for JuliaBulb
uniform float uMultiPower;     // bulb power
uniform float uPhoenixP;       // unused here; reserved

// Varying
varying vec2 vUv;

// --------------- Helpers ---------------

float loopT() {
  float period = max(0.001, uLoopPeriod);
  return fract(uTime / period);
}

mat2 rot2(float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.2831853 * (c * t + d));
}

// --------------- Transform texture fetch (width = 5 columns) ---------------
// Layout per transform row:
// col0 (T0): [typeId, weight, pos.x, pos.y]
// col1 (T1): [p0, p1, p2, p3]
// col2 (T2): [color.r, color.g, color.b, 0]
// col3 (T3): [setW0, setW1, setW2, setW3]  // not used directly in 3D pass
// col4 (T4): [setW4, 0, 0, 0]

vec4 fetchCol(sampler2D tex, int i, int h, float col) {
  float y = (float(i) + 0.5) / float(h);
  return texture2D(tex, vec2((col + 0.5) / 5.0, y));
}

vec4 T0(sampler2D tex, int i, int h) { return fetchCol(tex, i, h, 0.0); }
vec4 T1(sampler2D tex, int i, int h) { return fetchCol(tex, i, h, 1.0); }
vec4 T2(sampler2D tex, int i, int h) { return fetchCol(tex, i, h, 2.0); }
vec4 T3(sampler2D tex, int i, int h) { return fetchCol(tex, i, h, 3.0); }
vec4 T4(sampler2D tex, int i, int h) { return fetchCol(tex, i, h, 4.0); }

// --------------- 2D-style transforms applied to p.xy in 3D domain ---------------

vec3 applyTransform3D(vec3 p, sampler2D tex, int i, int count, int texH, float t) {
  if (i < 0 || i >= count) return p;

  vec4 a = T0(tex, i, texH);
  vec4 b = T1(tex, i, texH);

  int typeId = int(a.x + 0.5);
  float w = a.y;
  vec2 pos = a.zw;

  // Gentle loop animation for transform weight
  float wAnim = w * (0.8 + 0.2 * sin(6.2831853 * t));

  // Operate on xy-plane; z preserved unless noted
  vec2 uv = p.xy;

  if (typeId == 0) {
    // translate: pull uv toward pos
    uv += (pos - uv) * 0.2 * wAnim;
  } else if (typeId == 1) {
    // rotate about z-axis around pos, angle from b.x
    float ang = b.x * wAnim;
    vec2 d = uv - pos;
    uv = pos + rot2(ang) * d;
  } else if (typeId == 2) {
    // swirl
    vec2 d = uv - pos;
    float r = length(d);
    float ang = wAnim * r * 2.5;
    uv = pos + rot2(ang) * d;
  } else if (typeId == 3) {
    // sin bend
    float freq = max(0.1, b.x);
    float amp = b.y * wAnim;
    uv += vec2(
      sin(uv.y * freq + t * 6.2831853) * amp,
      sin(uv.x * freq - t * 6.2831853) * amp
    );
  } else if (typeId == 4) {
    // star warp
    vec2 d = uv - pos;
    float n = max(3.0, b.x);
    float amp = b.y * wAnim;
    float ang = atan(d.y, d.x);
    float k = cos(ang * n);
    d *= (1.0 + amp * k);
    uv = pos + d;
  } else if (typeId == 5) {
    // diamond pinch (L1 norm emphasis)
    vec2 d = uv - pos;
    float m = abs(d.x) + abs(d.y) + 1e-5;
    float amp = max(0.0, b.x) * wAnim;
    d = normalize(d) * mix(length(d), m, amp);
    uv = pos + d;
  } else if (typeId == 6) {
    // heart warp
    vec2 d = uv - pos;
    float r = length(d) + 1e-6;
    float th = atan(d.y, d.x);
    float aAmt = b.x * wAnim;
    float rp = r * (1.0 - aAmt * sin(th));
    uv = pos + rp * vec2(cos(th), sin(th));
  } else if (typeId == 7) {
    // explode radial
    vec2 d = uv - pos;
    float r = length(d);
    float amp = b.x * wAnim;
    float freq = max(0.1, b.y);
    float f = 1.0 + amp * sin(6.2831853 * t * freq + r * 4.0);
    uv = pos + d * f;
  } else if (typeId == 8) {
    // mirrorX: fold across horizontal line y = pos.y
    vec2 folded = vec2(uv.x, pos.y + abs(uv.y - pos.y));
    uv = mix(uv, folded, clamp(wAnim, 0.0, 1.0));
  } else if (typeId == 9) {
    // mirrorY: fold across vertical line x = pos.x
    vec2 folded = vec2(pos.x + abs(uv.x - pos.x), uv.y);
    uv = mix(uv, folded, clamp(wAnim, 0.0, 1.0));
  }

  p.xy = uv;
  return p;
}

vec3 runTransforms3D(vec3 p, sampler2D tex, int count, int texH, float t) {
  for (int i = 0; i < 64; i++) {
    if (i >= count) break;
    p = applyTransform3D(p, tex, i, count, texH, t);
  }
  return p;
}

// --------------- DEs for multiple 3D fractal sets ---------------

// Mandelbulb (variable power)
float mandelbulbDEp(in vec3 pos, float power, out float trap) {
  vec3 z = pos;
  float dr = 1.0;
  float r = 0.0;
  trap = 1e9;

  int maxIters = min(uIterations, 30);
  for (int i = 0; i < 128; i++) {
    if (i >= maxIters) break;

    r = length(z);
    trap = min(trap, r);
    if (r > 4.0) break;

    // Spherical coords
    float theta = acos(z.z / r);
    float phi = atan(z.y, z.x);

    float rPow = pow(r, power - 1.0);
    dr = rPow * power * dr + 1.0;

    float zr = rPow * r; // r^power
    theta *= power;
    phi *= power;

    z = zr * vec3(
      sin(theta) * cos(phi),
      sin(theta) * sin(phi),
      cos(theta)
    ) + pos;
  }

  return 0.5 * log(r) * r / max(dr, 1e-6);
}

// Julia Bulb (variable power, c parameter)
float juliaBulbDE(in vec3 pos, in vec3 c, float power, out float trap) {
  vec3 z = pos;
  float dr = 1.0;
  float r = 0.0;
  trap = 1e9;

  int maxIters = min(uIterations, 30);
  for (int i = 0; i < 128; i++) {
    if (i >= maxIters) break;

    r = length(z);
    trap = min(trap, r);
    if (r > 4.0) break;

    // Spherical coords
    float theta = acos(z.z / r);
    float phi = atan(z.y, z.x);

    float rPow = pow(r, power - 1.0);
    dr = rPow * power * dr + 1.0;

    float zr = rPow * r; // r^power
    theta *= power;
    phi *= power;

    z = zr * vec3(
      sin(theta) * cos(phi),
      sin(theta) * sin(phi),
      cos(theta)
    ) + c;
  }

  return 0.5 * log(r) * r / max(dr, 1e-6);
}

// Utility: signed distance to axis-aligned box
float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Mandelbox (approximate DE)
float mandelboxDE(in vec3 pos, out float trap) {
  vec3 z = pos;
  float dr = 1.0;
  float scale = 2.0;
  float minR = 0.5;
  float fixedR = 1.0;
  float minR2 = minR * minR;
  float fixedR2 = fixedR * fixedR;
  trap = 1e9;

  int maxIters = min(uIterations, 18);
  for (int i = 0; i < 60; i++) {
    if (i >= maxIters) break;

    // Box fold
    z = clamp(z, -1.0, 1.0) * 2.0 - z;

    // Sphere fold
    float r2 = dot(z, z);
    trap = min(trap, sqrt(r2));
    float k = fixedR2 / max(minR2, r2);
    z *= k;
    dr *= abs(k);

    // Scale and translate
    z = z * scale + pos;
    dr = dr * abs(scale) + 1.0;
  }

  float r = length(z);
  // Heuristic DE (not exact but decent)
  return (r - 2.0) / abs(dr);
}

// Menger sponge (approximate DE)
float mengerDE(in vec3 p, out float trap) {
  float d = sdBox(p, vec3(1.0));
  float s = 1.0;
  trap = 1e9;

  int maxIters = min(uIterations, 8);
  vec3 z = p;
  for (int i = 0; i < 40; i++) {
    if (i >= maxIters) break;

    z = abs(z);
    if (z.x < z.y) z.xy = z.yx;
    if (z.x < z.z) z.xz = z.zx;
    z = z * 3.0 - vec3(2.0);

    vec3 q = vec3(z.x - 1.0, min(z.y, z.z) - 1.0, 0.0);
    float c = max(q.x, q.y);
    d = max(d, -c / s);

    s *= 3.0;
    trap = min(trap, length(z) / s);
  }
  return d;
}

// Sierpinski tetrahedron (approximate DE)
float sierpinskiDE(in vec3 p, out float trap) {
  vec3 z = p;
  float s = 1.0;
  trap = 1e9;

  int maxIters = min(uIterations, 16);
  for (int i = 0; i < 64; i++) {
    if (i >= maxIters) break;

    if (z.x + z.y + z.z < 0.0) z = -z.yzx;
    z = z * 2.0 - vec3(1.0);
    s *= 2.0;
    trap = min(trap, length(z) / s);
  }
  // Distance to tetrahedron (rough)
  float d = (length(z) - 0.5) / s;
  return d;
}

// Combined DE: choose minimum of weighted distances across sets
float combinedDE(vec3 p, out float trap, out int setId) {
  // Normalize weights
  float w[5];
  float sumW = 0.0;
  for (int i = 0; i < 5; i++) {
    w[i] = uFWeights[i];
    sumW += w[i];
  }
  if (sumW < 1e-5) {
    w[0] = 1.0;
    sumW = 1.0;
  }
  for (int i = 0; i < 5; i++) w[i] /= sumW;

  float dBest = 1e9;
  float tBest = 1e9;
  int idBest = 0;

  // Set 0: Mandelbulb
  if (w[0] > 1e-6) {
    float t0;
    float d0 = mandelbulbDEp(p, max(2.0, uMultiPower), t0);
    float e0 = d0 / (w[0] + 1e-3);
    if (e0 < dBest) { dBest = e0; tBest = t0; idBest = 0; }
  }

  // Set 1: Julia Bulb (c from uJuliaC and loop-based z)
  if (w[1] > 1e-6) {
    float t1;
    float zc = 0.6 * sin(6.2831853 * loopT());
    vec3 c = vec3(uJuliaC, zc);
    float d1 = juliaBulbDE(p, c, max(2.0, uMultiPower), t1);
    float e1 = d1 / (w[1] + 1e-3);
    if (e1 < dBest) { dBest = e1; tBest = t1; idBest = 1; }
  }

  // Set 2: Mandelbox
  if (w[2] > 1e-6) {
    float t2;
    float d2 = mandelboxDE(p, t2);
    float e2 = d2 / (w[2] + 1e-3);
    if (e2 < dBest) { dBest = e2; tBest = t2; idBest = 2; }
  }

  // Set 3: Menger sponge
  if (w[3] > 1e-6) {
    float t3;
    float d3 = mengerDE(p, t3);
    float e3 = d3 / (w[3] + 1e-3);
    if (e3 < dBest) { dBest = e3; tBest = t3; idBest = 3; }
  }

  // Set 4: Sierpinski tetrahedron
  if (w[4] > 1e-6) {
    float t4;
    float d4 = sierpinskiDE(p, t4);
    float e4 = d4 / (w[4] + 1e-3);
    if (e4 < dBest) { dBest = e4; tBest = t4; idBest = 4; }
  }

  trap = tBest;
  setId = idBest;
  return dBest;
}

// Estimate normal via gradient of combined DE
vec3 estimateNormalCombined(vec3 p) {
  const float e = 1e-3;
  float t; int id;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  float d1 = combinedDE(p + dx, t, id);
  float d2 = combinedDE(p - dx, t, id);
  float d3 = combinedDE(p + dy, t, id);
  float d4 = combinedDE(p - dy, t, id);
  float d5 = combinedDE(p + dz, t, id);
  float d6 = combinedDE(p - dz, t, id);
  return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

// Soft shadow with combined DE
float softShadowCombined(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < 48; i++) {
    if (t > maxt) break;
    float trap; int id;
    float h = combinedDE(ro + rd * t, trap, id);
    if (h < 1e-4) return 0.0;
    res = min(res, k * h / t);
    t += clamp(h, 0.01, 0.2);
  }
  return clamp(res, 0.0, 1.0);
}

// Ambient occlusion (rough) with combined DE
float ambientOcclusionCombined(vec3 p, vec3 n) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float hr = 0.01 + 0.05 * float(i);
    float trap; int id;
    float d = combinedDE(p + n * hr, trap, id);
    occ += (hr - d) * sca;
    sca *= 0.7;
  }
  return clamp(1.0 - 1.5 * occ, 0.0, 1.0);
}

// --------------- Camera & Raymarch ---------------

struct Hit {
  float t;
  vec3 pos;
  vec3 nor;
  float trap;
  bool hit;
  int setId;
};

Hit march(vec3 ro, vec3 rd) {
  Hit h;
  h.t = 0.0;
  h.pos = ro;
  h.nor = vec3(0.0);
  h.trap = 1e9;
  h.hit = false;
  h.setId = 0;

  float t = 0.0;
  for (int i = 0; i < 200; i++) {
    vec3 p = ro + rd * t;

    // Apply 2D transforms to XY of domain before DE
    int texH = (uTransformCount > 0) ? uTransformCount : 1;
    float lt = loopT();
    p = runTransforms3D(p, uTransformTex, uTransformCount, texH, lt);

    float trap; int sid;
    float d = combinedDE(p, trap, sid);
    h.trap = min(h.trap, trap);

    if (d < 0.0008) {
      h.t = t;
      h.pos = p;
      h.nor = estimateNormalCombined(p);
      h.hit = true;
      h.setId = sid;
      break;
    }
    t += clamp(d, 0.003, 0.2);
    if (t > 40.0) break;
  }
  return h;
}

// --------------- Main ---------------

void main() {
  // NDC to screen plane in [-1,1] with aspect
  vec2 uv = (gl_FragCoord.xy / uResolution - 0.5) * vec2(uAspect, 1.0);

  // Camera setup
  float tLoop = loopT();

  // Camera target (world) — map uPan in normalized space
  vec3 target = vec3(uPan, 0.0);

  // Camera orbit around target on a gentle loop
  float yaw = 6.2831853 * tLoop;        // full rotation over loop
  float pitch = 0.35 * sin(6.2831853 * tLoop); // subtle pitch
  float dist = mix(2.0, 6.0, 1.0 / max(0.5, uZoom)); // uZoom acts as dolly

  vec3 eye = target + vec3(
    dist * cos(pitch) * cos(yaw),
    dist * cos(pitch) * sin(yaw),
    dist * sin(pitch)
  );

  // Build view basis
  vec3 forward = normalize(target - eye);
  vec3 right = normalize(cross(forward, vec3(0.0, 0.0, 1.0)));
  vec3 up = normalize(cross(right, forward));

  // Ray direction with a 60-degree FOV
  float fov = radians(60.0);
  vec3 rd = normalize(
    forward +
    uv.x * right * tan(fov * 0.5) * 2.0 +
    uv.y * up    * tan(fov * 0.5) * 2.0
  );
  vec3 ro = eye;

  // March
  Hit h = march(ro, rd);

  vec3 col = vec3(0.0);

  if (h.hit) {
    // Lighting
    vec3 n = h.nor;

    // Directional light tied to loop for motion: rotate XY by angle
    float ang = 6.2831853 * tLoop;
    vec2 lxy = rot2(ang) * vec2(0.6, 0.5);
    vec3 lightDir = normalize(vec3(lxy, 0.8));

    float diff = max(0.0, dot(n, lightDir));
    float sh = softShadowCombined(h.pos + n * 0.001, lightDir, 0.02, 12.0, 10.0);
    float ao = ambientOcclusionCombined(h.pos, n);

    // Base palette changes slightly by setId
    float trapT = clamp(h.trap * 0.6, 0.0, 1.0);
    float hueShift = float(h.setId) * 0.1;
    vec3 base = palette(
      trapT + hueShift,
      vec3(0.52, 0.48, 0.54),
      vec3(0.5, 0.5, 0.5),
      vec3(1.0, 0.9, 0.45),
      vec3(0.0, 0.25, 0.75)
    );

    float tone = clamp(0.5 + 0.5 * diff * sh, 0.0, 1.0);
    col = base * tone * ao;

    // Rim light
    float rim = pow(1.0 - max(0.0, dot(n, -rd)), 3.0);
    col += rim * 0.25;

  } else {
    // Sky gradient
    float v = 0.5 + 0.5 * rd.z;
    vec3 skyA = vec3(0.02, 0.02, 0.03);
    vec3 skyB = vec3(0.08, 0.09, 0.12);
    col = mix(skyA, skyB, v);
  }

  // Subtle vignette in screen space
  float r = length(gl_FragCoord.xy / uResolution - 0.5);
  col *= 1.0 - 0.25 * r;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
