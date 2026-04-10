import { Mesh, Program, Renderer, Triangle, Vec2, Vec3 } from "ogl";
import { useEffect, useRef } from "react";
import "./LiquidEther.css";

function hexToVec3(color) {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16) / 255;
    const g = parseInt(color.slice(3, 5), 16) / 255;
    const b = parseInt(color.slice(5, 7), 16) / 255;
    return new Vec3(r, g, b);
  }
  return new Vec3(1, 1, 1);
}

export default function LiquidEther({
  mouseForce = 20,
  cursorSize = 100,
  isViscous = true,
  viscous = 30,
  colors = ["#f8f2e7", "#d1bfa3", "#1c1208"],
  autoDemo = true,
  autoSpeed = 0.5,
  autoIntensity = 2.2,
  isBounce = false,
  resolution = 0.5,
}) {
  const containerRef = useRef(null);

  const vert = /* glsl */ `
    precision highp float;
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const frag = /* glsl */ `
    precision highp float;

    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 iMouse;
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform vec3 colorC;
    uniform float mouseForce;
    uniform float cursorSize;
    uniform float viscous;

    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) +
             (c - a) * u.y * (1.0 - u.x) +
             (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float sum = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 5; i++) {
        sum += amp * noise(p);
        p *= 2.03;
        amp *= 0.5;
      }
      return sum;
    }

    void main() {
      vec2 uv = vUv;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= iResolution.x / max(iResolution.y, 1.0);

      vec2 m = iMouse * 2.0 - 1.0;
      m.x *= iResolution.x / max(iResolution.y, 1.0);

      vec2 toMouse = p - m;
      float dist = length(toMouse);

      float cursorRadius = max(cursorSize / max(iResolution.y, 1.0), 0.001);
      float falloff = exp(-pow(dist / max(cursorRadius, 0.0001), 2.0) * 2.2);

      float force = mouseForce * 0.012;
      float smoothness = mix(0.55, 1.05, clamp(viscous / 40.0, 0.0, 1.0));

      vec2 flowDir = normalize(vec2(toMouse.y, -toMouse.x) + 1e-5);
      p += flowDir * falloff * force * smoothness;

      float t = iTime * 0.24;
      vec2 q = vec2(
        fbm(p * 1.35 + vec2(t, -t * 0.7)),
        fbm(p * 1.35 + vec2(-t * 0.6, t))
      );

      vec2 r = p + (q - 0.5) * 1.4;
      float n1 = fbm(r * 2.0 + t * 0.9);
      float n2 = fbm((r + vec2(2.8, -1.6)) * 2.2 - t * 0.7);
      float n3 = fbm((r + vec2(-3.1, 1.9)) * 1.7 + t * 0.45);

      float liquid = n1 * 0.6 + n2 * 0.3 + n3 * 0.25;
      float veins = smoothstep(0.42, 0.9, liquid);
      float glow = smoothstep(0.2, 1.0, liquid) * (0.65 + falloff * 0.9);

      vec3 col = mix(colorA, colorB, smoothstep(0.18, 0.85, liquid));
      col = mix(col, colorC, veins * 0.75);
      col += colorB * pow(glow, 2.0) * 0.35;

      float alpha = smoothstep(0.02, 0.96, liquid) * 0.96;
      gl_FragColor = vec4(col, alpha);
    }
  `;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const colorA = hexToVec3(colors[0] ?? "#f8f2e7");
    const colorB = hexToVec3(colors[1] ?? "#d1bfa3");
    const colorC = hexToVec3(colors[2] ?? "#1c1208");

    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vec2(1, 1) },
        iMouse: { value: new Vec2(0.5, 0.5) },
        colorA: { value: colorA },
        colorB: { value: colorB },
        colorC: { value: colorC },
        mouseForce: { value: mouseForce },
        cursorSize: { value: cursorSize },
        viscous: { value: isViscous ? viscous : 8 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    let width = 1;
    let height = 1;
    let raf = 0;
    let lastTime = 0;

    const targetMouse = { x: 0.5, y: 0.5 };
    const currentMouse = { x: 0.5, y: 0.5 };
    let pointerInside = false;

    const updateMouseFromClient = (clientX, clientY) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      pointerInside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      targetMouse.x = Math.min(Math.max(x, 0), 1);
      targetMouse.y = 1 - Math.min(Math.max(y, 0), 1);
    };

    const onWindowPointerMove = (event) => {
      updateMouseFromClient(event.clientX, event.clientY);
    };

    const onWindowPointerLeave = () => {
      pointerInside = false;
    };

    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const scale = Math.min(Math.max(resolution, 0.2), 1);

      renderer.setSize(width * dpr * scale, height * dpr * scale);
      gl.canvas.style.width = `${width}px`;
      gl.canvas.style.height = `${height}px`;
      program.uniforms.iResolution.value.set(width, height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerleave", onWindowPointerLeave);

    resize();

    const animate = (time) => {
      raf = window.requestAnimationFrame(animate);
      const dt = (time - lastTime) * 0.001;
      lastTime = time;

      if (!pointerInside && autoDemo) {
        const centerX = 0.5;
        const centerY = 0.5;
        const ampX = 0.18 * autoIntensity;
        const ampY = 0.14 * autoIntensity;

        const orbitX = Math.sin(time * 0.001 * autoSpeed) * ampX;
        const orbitY = isBounce
          ? Math.abs(Math.sin(time * 0.001 * autoSpeed * 1.4)) * ampY - ampY * 0.5
          : Math.cos(time * 0.001 * autoSpeed * 1.3) * ampY;

        targetMouse.x = centerX + orbitX;
        targetMouse.y = centerY + orbitY;
      }

      const tracking = Math.min(1, dt * (isViscous ? 6.5 : 10));
      currentMouse.x += (targetMouse.x - currentMouse.x) * tracking;
      currentMouse.y += (targetMouse.y - currentMouse.y) * tracking;

      program.uniforms.iTime.value = time * 0.001;
      program.uniforms.iMouse.value.set(currentMouse.x, currentMouse.y);
      program.uniforms.mouseForce.value = mouseForce;
      program.uniforms.cursorSize.value = cursorSize;
      program.uniforms.viscous.value = isViscous ? viscous : 8;
      program.uniforms.colorA.value = hexToVec3(colors[0] ?? "#f8f2e7");
      program.uniforms.colorB.value = hexToVec3(colors[1] ?? "#d1bfa3");
      program.uniforms.colorC.value = hexToVec3(colors[2] ?? "#1c1208");

      renderer.render({ scene: mesh });
    };

    raf = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerleave", onWindowPointerLeave);
      container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    autoDemo,
    autoIntensity,
    autoSpeed,
    colors,
    cursorSize,
    isBounce,
    isViscous,
    mouseForce,
    resolution,
    viscous,
  ]);

  return <div ref={containerRef} className="liquid-ether" />;
}
