
export const vertexShader = `
  uniform float uFlip;
  uniform float uPerspective;
  uniform float uApproach;
  uniform float uScale;

  varying vec2 vUv;
  varying float vShade;

  void main() {
    vUv = uv;

    float c = uFlip;
    float s = sqrt(max(1.0 - c * c, 0.0));

    vec2 p = position.xy * uScale;

    float x = p.x * c;
    float z = p.x * s;

    vShade = mix(0.25, 1.0, c);

    float approach = (1.0 - uFlip) * uApproach;

    float w = 1.0 + (z + approach) * uPerspective;
    gl_Position = vec4(x, p.y, 0.0, w);
  }
`

export const fragmentShader = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec2 uCoverScale;
  uniform vec2 uCoverOffset;

  varying vec2 vUv;
  varying float vShade;

  void main() {
    vec2 uv = (vUv - 0.5) * uCoverScale + 0.5 + uCoverOffset;
    uv = clamp(uv, vec2(0.001), vec2(0.999));

    gl_FragColor = vec4(texture2D(uTexture, uv).rgb * vShade, 1.0);
  }
`
