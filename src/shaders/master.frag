// src/shaders/master.frag
precision highp float;

uniform sampler2D uInputTex;
uniform vec2 uResolution; // render target pixels (DPR-aware)
uniform float uTime;

// Photometric/color controls
uniform float uExposure;
uniform float uGamma;
uniform float uContrast;
uniform float uSaturation;
uniform float uHue;
uniform float uVibrance;

// Vignette, CA, grain, posterize
uniform float uVignette;
uniform float uVignetteSoft;
uniform float uCA;
uniform float uGrain;
uniform float uPosterize;

// Effects toggles/params
uniform int uPixelizeEnabled;
uniform float uPixelSize;

uniform int uRainbowEnabled;
uniform float uRainbowStrength;
uniform float uRainbowSpeed;
uniform float uRainbowScale;

uniform int uWarpEnabled;
uniform float uWarpAmount;
uniform float uWarpFreq;

uniform int uGlitchEnabled;
uniform float uGlitchStrength;
uniform float uGlitchBlock;
uniform float uGlitchSpeed;
uniform float uGlitchRGBSplit;

varying vec2 vUv;

float luma(vec3 c){ return dot(c, vec3(0.2126,0.7152,0.0722)); }

vec3 hueRotate(vec3 c, float deg){
  float a = radians(deg);
  float s = sin(a), co = cos(a);
  mat3 m = mat3(
    0.213 + 0.787*co - 0.213*s, 0.715 - 0.715*co - 0.715*s, 0.072 - 0.072*co + 0.928*s,
    0.213 - 0.213*co + 0.143*s, 0.715 + 0.285*co + 0.140*s, 0.072 - 0.072*co - 0.283*s,
    0.213 - 0.213*co - 0.787*s, 0.715 - 0.715*co + 0.715*s, 0.072 + 0.928*co + 0.072*s
  );
  return clamp(m*c, 0.0, 1.0);
}

float hash21(vec2 p){
  p = fract(p*vec2(123.34,456.21));
  p += dot(p,p+45.32);
  return fract(p.x*p.y);
}

void main(){
  vec2 uv = vUv;

  // Pixelize in screen space
  if (uPixelizeEnabled==1){
    float px = max(1.0, uPixelSize);
    uv = (floor(uv * uResolution / px) * px) / uResolution;
  }

  // Screen-space warp
  if (uWarpEnabled==1){
    vec2 S = uv - 0.5;
    float w = sin((S.x+S.y) * uWarpFreq * 6.28318 + uTime*2.0) * uWarpAmount;
    uv += vec2(w, -w);
  }

  // Row glitch (UV shift)
  if (uGlitchEnabled==1){
    float t = floor(uTime * uGlitchSpeed);
    float row = floor((vUv.y * uResolution.y) / uGlitchBlock);
    float rnd = hash21(vec2(row, t));
    float jump = (rnd - 0.5) * uGlitchStrength * 0.1;
    uv.x += jump;
  }

  // Chromatic aberration
  vec2 dir = normalize(uv - 0.5 + 1e-6);
  vec2 o = dir * uCA * 0.002;
  vec3 col;
  if (uCA > 0.0001){
    vec3 r = texture2D(uInputTex, uv + o).rgb;
    vec3 g = texture2D(uInputTex, uv).rgb;
    vec3 b = texture2D(uInputTex, uv - o).rgb;
    col = vec3(r.r, g.g, b.b);
  } else {
    col = texture2D(uInputTex, uv).rgb;
  }

  // Glitch RGB split overlay
  if (uGlitchEnabled==1 && uGlitchRGBSplit>0.0){
    float t = floor(uTime * uGlitchSpeed);
    float row = floor((vUv.y * uResolution.y) / uGlitchBlock);
    float rnd = hash21(vec2(row, t+3.14));
    vec2 s = vec2((rnd-0.5)*uGlitchRGBSplit, 0.0);
    float r = texture2D(uInputTex, uv + s).r;
    float g = texture2D(uInputTex, uv).g;
    float b = texture2D(uInputTex, uv - s).b;
    col = mix(col, vec3(r,g,b), clamp(uGlitchStrength, 0.0, 1.0));
  }

  // Rainbow sweep
  if (uRainbowEnabled==1){
    float phase = uTime * uRainbowSpeed;
    float band = uv.x * uRainbowScale + phase;
    vec3 rainbow = 0.5 + 0.5*cos(6.28318*vec3(band, band+0.33, band+0.66));
    col = mix(col, col * rainbow, clamp(uRainbowStrength, 0.0, 1.0));
  }

  // Exposure/contrast
  col *= exp2(uExposure);
  col = (col - 0.5) * uContrast + 0.5;

  // Saturation/vibrance
  float L = luma(col);
  col = mix(vec3(L), col, uSaturation);
  float sat = clamp(1.0 - abs(col.r - L) - abs(col.g - L) - abs(col.b - L), 0.0, 1.0);
  col = mix(col, mix(vec3(L), col, 1.5), uVibrance * sat);

  // Hue
  if (abs(uHue) > 0.01) col = hueRotate(col, uHue);

  // Vignette in UV space
  float r = length(uv - 0.5);
  float vig = 1.0 - uVignette * smoothstep(1.0 - uVignetteSoft, 1.0, r);
  col *= vig;

  // Grain (stable in pixel space)
  if (uGrain > 0.0001){
    float n = hash21(vUv * uResolution + uTime*60.0) * 2.0 - 1.0;
    col += n * uGrain * 0.1;
  }

  // Posterize
  if (uPosterize >= 2.0){
    float steps = floor(uPosterize);
    col = floor(col * steps + 0.5) / steps;
  }

  // Gamma
  col = pow(max(col, 0.0), vec3(1.0 / max(0.001, uGamma)));

  gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
}
