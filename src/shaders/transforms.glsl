#ifndef TRANSFORMS_GLSL
#define TRANSFORMS_GLSL

// Layout matches transformTexture.ts
// texel0: [typeId, weight, pos.x, pos.y]
// texel1: [p0, p1, p2, p3]

vec4 fetchT0(sampler2D tex, int i, int h) {
  float y = (float(i) + 0.5) / float(h);
  return texture(tex, vec2((0.5) / 2.0, y));
}

vec4 fetchT1(sampler2D tex, int i, int h) {
  float y = (float(i) + 0.5) / float(h);
  return texture(tex, vec2((1.5) / 2.0, y));
}

vec2 applyTransform(
  vec2 uv,
  sampler2D tex,
  int i,
  int count,
  int texH,
  float time
) {
  if (i < 0 || i >= count) return uv;
  vec4 a = fetchT0(tex, i, texH);
  vec4 b = fetchT1(tex, i, texH);
  int typeId = int(a.x + 0.5);
  float w = a.y;
  vec2 pos = a.zw;

  // Animated weight (gentle loop)
  float wAnim = w * (0.8 + 0.2 * sin(6.28318 * time));

  if (typeId == 0) {
    // translate: pull uv toward pos
    uv += (pos - uv) * 0.2 * wAnim;
  } else if (typeId == 1) {
    // rotate around pos, angle from b.x
    float ang = b.x * wAnim;
    vec2 d = uv - pos;
    uv = pos + mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * d;
  } else if (typeId == 2) {
    // swirl: angle proportional to distance and weight
    vec2 d = uv - pos;
    float r = length(d);
    float ang = wAnim * r * 2.5;
    uv = pos + mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * d;
  } else if (typeId == 3) {
    // sin bend: b.x = freq, b.y = amp
    float freq = max(0.1, b.x);
    float amp = b.y * wAnim;
    uv += vec2(
      sin(uv.y * freq + time * 6.28318) * amp,
      sin(uv.x * freq - time * 6.28318) * amp
    );
  }

  return uv;
}

vec2 runTransforms(
  vec2 uv,
  sampler2D tex,
  int count,
  int texH,
  float time
) {
  for (int i = 0; i < 64; i++) {
    if (i >= count) break;
    uv = applyTransform(uv, tex, i, count, texH, time);
  }
  return uv;
}

#endif
