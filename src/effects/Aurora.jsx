import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { useEffect, useRef } from "react";

import "./Aurora.css";

const VERT = `
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec2 uResolution;
uniform float uBlend;

varying vec2 vUv;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ),
      0.0
  );
  m = m * m;
  m = m * m;

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
  vec2 uv = gl_FragCoord.xy / uResolution;

  vec3 rampColor = mix(uColor0, uColor1, smoothstep(0.0, 0.5, uv.x));
  rampColor = mix(rampColor, uColor2, smoothstep(0.5, 1.0, uv.x));

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  gl_FragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

export default function Aurora(props) {
  const {
    colorStops = ["#f8f2e7", "#d1bfa3", "#1c1208"],
    amplitude = 1.0,
    blend = 0.5,
    speed = 1,
    className = "",
  } = props;

  const propsRef = useRef(props);
  propsRef.current = props;

  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = "transparent";

    let program;

    const resize = () => {
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      renderer.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = [width, height];
      }
    };

    window.addEventListener("resize", resize);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = colorStops.slice(0, 3).map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    const [color0 = [0.97, 0.95, 0.91], color1 = [0.82, 0.75, 0.64], color2 = [0.11, 0.07, 0.03]] = colorStopsArray;

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColor0: { value: color0 },
        uColor1: { value: color1 },
        uColor2: { value: color2 },
        uResolution: { value: [container.offsetWidth, container.offsetHeight] },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    let animationFrame = 0;

    const update = (t) => {
      animationFrame = requestAnimationFrame(update);

      const {
        time = t * 0.01,
        speed: currentSpeed = speed,
        amplitude: currentAmplitude = amplitude,
        blend: currentBlend = blend,
        colorStops: currentStops = colorStops,
      } = propsRef.current;

      program.uniforms.uTime.value = time * currentSpeed * 0.16;
      program.uniforms.uAmplitude.value = currentAmplitude;
      program.uniforms.uBlend.value = currentBlend;
      const nextStops = currentStops.slice(0, 3).map((hex) => {
        const c = new Color(hex);
        return [c.r, c.g, c.b];
      });
      const [nextColor0 = [0.97, 0.95, 0.91], nextColor1 = [0.82, 0.75, 0.64], nextColor2 = [0.11, 0.07, 0.03]] =
        nextStops;
      program.uniforms.uColor0.value = nextColor0;
      program.uniforms.uColor1.value = nextColor1;
      program.uniforms.uColor2.value = nextColor2;

      renderer.render({ scene: mesh });
    };

    animationFrame = requestAnimationFrame(update);
    resize();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      if (container && gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [amplitude, blend, colorStops, speed]);

  return (
    <div ref={containerRef} className={`aurora-container ${className}`.trim()}>
      <div className="aurora-fallback" />
    </div>
  );
}
