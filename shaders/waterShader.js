// Vertex Shader
export const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment Shader with water ripple effects
export const fragmentShader = `
  uniform sampler2D uTexture;
  uniform sampler2D uTexture2;
  uniform float uMixFactor;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uRipples[5];
  uniform int uRippleCount;

  varying vec2 vUv;

  // Simplex noise function for caustics
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;

    // Ambient water movement
    float ambientWave1 = sin(uv.x * 10.0 + uTime * 0.5) * cos(uv.y * 8.0 + uTime * 0.3) * 0.001;
    float ambientWave2 = sin(uv.x * 15.0 - uTime * 0.4) * cos(uv.y * 12.0 - uTime * 0.6) * 0.0008;

    // Caustics effect using noise
    float caustics = snoise(uv * 8.0 + uTime * 0.2) * 0.5 + 0.5;
    caustics += snoise(uv * 12.0 - uTime * 0.15) * 0.3;
    caustics = pow(caustics, 2.0) * 0.005;

    // Mouse ripples
    vec2 distortion = vec2(0.0);
    float totalRipple = 0.0;

    for(int i = 0; i < 5; i++) {
      if(i >= uRippleCount) break;

      vec2 ripplePos = uRipples[i].xy;
      float rippleTime = uRipples[i].z;

      vec2 diff = uv - ripplePos;
      float dist = length(diff);

      // Ripple parameters
      float rippleAge = uTime - rippleTime;
      float rippleRadius = rippleAge * 0.3;
      float rippleWidth = 0.05;

      // Decay over time
      float decay = exp(-rippleAge * 2.0);

      // Multiple wave frequencies for complex ripple
      float wave1 = sin((dist - rippleRadius) * 40.0) * decay;
      float wave2 = sin((dist - rippleRadius) * 60.0) * decay * 0.5;
      float wave3 = cos((dist - rippleRadius) * 50.0) * decay * 0.3;

      // Smooth falloff
      float rippleMask = smoothstep(rippleRadius + rippleWidth, rippleRadius, dist) *
                         smoothstep(rippleRadius - rippleWidth * 3.0, rippleRadius, dist);

      float rippleStrength = (wave1 + wave2 + wave3) * rippleMask * 0.008;
      totalRipple += rippleStrength;

      // Distortion based on ripple direction
      if(dist > 0.001) {
        distortion += normalize(diff) * rippleStrength;
      }
    }

    // Combine all distortions
    vec2 finalUV = uv + distortion + vec2(ambientWave1 + ambientWave2);

    // Sample both textures with distorted UV
    vec4 texColor1 = texture2D(uTexture, finalUV);
    vec4 texColor2 = texture2D(uTexture2, finalUV);

    // Mix between the two textures based on transition factor
    vec4 texColor = mix(texColor1, texColor2, uMixFactor);

    // Add caustics lighting
    vec3 color = texColor.rgb;
    color += vec3(caustics) * vec3(1.0, 1.0, 1.0) * 0.3;

    // Add fresnel-like edge highlights
    vec2 center = vec2(0.5);
    float distFromCenter = length(uv - center);
    float fresnel = pow(distFromCenter * 1.5, 2.0) * 0.03;
    color += vec3(fresnel) * vec3(1.0, 1.0, 1.0);

    // Add specular highlights on ripples
    float specular = pow(max(totalRipple * 10.0, 0.0), 3.0) * 0.2;
    color += vec3(specular) * vec3(1.0, 1.0, 0.95);

    // Subtle chromatic aberration on strong ripples
    if(abs(totalRipple) > 0.005) {
      float aberration = totalRipple * 2.0;
      vec2 offsetR = finalUV + vec2(aberration * 0.002, 0.0);
      vec2 offsetB = finalUV - vec2(aberration * 0.002, 0.0);

      float r = texture2D(uTexture, offsetR).r;
      float b = texture2D(uTexture, offsetB).b;

      color.r = mix(color.r, r, 0.3);
      color.b = mix(color.b, b, 0.3);
    }

    // Tone mapping for HDR-like effect
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(0.98));

    gl_FragColor = vec4(color, 1.0);
  }
`
