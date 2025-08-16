// src/shaders/raymarch.glsl
#ifndef RAYMARCH_GLSL
#define RAYMARCH_GLSL

// Generic helpers for DE-based raymarching.
// To use with a specific distance estimator, define DE_FN before including:
//   #define DE_FN mandelbulbDE
// and provide: float mandelbulbDE(in vec3 p, out float trap);

#ifndef DE_FN
#define DE_FN mandelbulbDE
#endif

// Small numeric epsilon for gradient
#ifndef RM_EPS
#define RM_EPS 1e-3
#endif

// Hash (2D -> 1D), handy for noise-like effects in screen or world space
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Finite-difference normal from DE
vec3 rmEstimateNormal(vec3 p) {
  float t;
  vec3 dx = vec3(RM_EPS, 0.0, 0.0);
  vec3 dy = vec3(0.0, RM_EPS, 0.0);
  vec3 dz = vec3(0.0, 0.0, RM_EPS);
  float d1 = DE_FN(p + dx, t);
  float d2 = DE_FN(p - dx, t);
  float d3 = DE_FN(p + dy, t);
  float d4 = DE_FN(p - dy, t);
  float d5 = DE_FN(p + dz, t);
  float d6 = DE_FN(p - dz, t);
  return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

// Simple soft shadow using DE stepping (k typically ~10)
float rmSoftShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < 48; i++) {
    if (t > maxt) break;
    float trap;
    float h = DE_FN(ro + rd * t, trap);
    if (h < 1e-4) return 0.0;
    res = min(res, k * h / t);
    t += clamp(h, 0.01, 0.2);
  }
  return clamp(res, 0.0, 1.0);
}

// Very rough ambient occlusion sampler
float rmAmbientOcclusion(vec3 p, vec3 n) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float hr = 0.01 + 0.05 * float(i);
    float trap;
    float d = DE_FN(p + n * hr, trap);
    occ += (hr - d) * sca;
    sca *= 0.7;
  }
  return clamp(1.0 - 1.5 * occ, 0.0, 1.0);
}

// Orthonormal basis from a forward vector
void rmBasis(vec3 forward, out vec3 right, out vec3 up) {
  right = normalize(cross(forward, vec3(0.0, 0.0, 1.0)));
  if (length(right) < 1e-5) right = vec3(1.0, 0.0, 0.0);
  up = normalize(cross(right, forward));
}

// 2D rotation (useful for simple camera/light motion)
mat2 rmRot2(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

#endif
