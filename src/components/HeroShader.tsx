import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const VERT_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_progress;

float hash(vec2 p) {
    p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
    return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
              mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
}

float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 5; i++) {
        f += w * noise(p);
        p *= 2.0;
        w *= 0.5;
    }
    return f;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    float mDist = length(uv - u_mouse);
    float lensPull = 0.035 / (mDist + 0.08);
    uv -= normalize(uv - u_mouse + vec2(0.0001)) * lensPull * 0.12;

    float zoom = 1.0 + pow(u_progress, 2.4) * 24.0;
    uv /= zoom;

    float d = length(uv);

    float twist     = 4.5;
    float spinSpeed = 0.15 + pow(u_progress, 2.0) * 8.0;
    float angle     = -u_time * spinSpeed - log(d + 0.001) * twist;

    float s = sin(angle), c = cos(angle);
    mat2 rotMat = mat2(c, -s, s, c);
    vec2 p = uv * rotMat;

    float arms     = 2.0;
    float spiral   = cos(arms * atan(p.y, p.x));

    float n         = fbm(p * 10.0 - u_time * 0.015);
    float structure = smoothstep(-0.2, 1.3, spiral + n * 1.5);

    float falloff = exp(-d * 4.5);
    structure *= falloff;
    float core = exp(-d * 22.0);

    vec3 bg        = vec3(0.04, 0.04, 0.047);
    vec3 dustColor = vec3(0.15, 0.15, 0.15);
    vec3 armColor  = vec3(0.35, 0.35, 0.45);
    vec3 coreColor = vec3(0.7,  0.7,  0.7);

    vec3 col = bg;
    col = mix(col, dustColor, smoothstep(0.0, 1.0, n) * falloff * 1.2);
    col += armColor  * structure * 1.8;
    col += coreColor * core      * 3.0;

    float h2 = smoothstep(0.6, 1.0, fbm(p * 20.0)) * structure;
    col += vec3(0.9, 0.9, 0.9) * h2 * 1.8;

    float starHash  = fract(sin(dot(uv * 180.0, vec2(12.9898, 78.233))) * 43758.5453);
    float starfield = step(0.995, starHash) * (starHash - 0.995) * 200.0;
    col += vec3(1.0) * starfield * max(falloff, 0.15);

    {
      float effectProgress = max(u_progress, 0.03);
      float ang    = atan(uv.y, uv.x);
      float radius = length(uv) + 0.0008;

      float sectors    = 160.0;
      float sector     = floor(ang * sectors);
      float sectorHash = fract(sin(sector * 91.345) * 47453.5);

      float speed       = u_time * 1.2 + pow(u_progress, 2.0) * 35.0;
      float radialCoord = fract(1.0 / radius * 0.55 - speed + sectorHash * 3.0);

      float trailLength = mix(0.02, 0.95, effectProgress);
      float line        = smoothstep(trailLength, 0.0, radialCoord);

      line *= step(0.32, sectorHash);

      float tunnel      = line / (radius * 2.0 + 0.1);
      vec3  tunnelColor = mix(vec3(0.45, 0.5, 0.75), vec3(1.0, 1.0, 1.0), u_progress);

      col += tunnelColor * tunnel * effectProgress * 8.5;
    }

    col += vec3(1.0) * pow(u_progress, 2.0) * 1.1;
    col *= smoothstep(1.5, 0.2, d);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export interface HeroShaderHandle {
  setProgress: (p: number) => void;
}

const HeroShader = forwardRef<HeroShaderHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);

  useImperativeHandle(ref, () => ({
    setProgress: (p: number) => {
      progressRef.current = Number.isNaN(p) ? 0 : p;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buf: WebGLBuffer | null = null;
    let vertShader: WebGLShader | null = null;
    let fragShader: WebGLShader | null = null;

    let uRes: WebGLUniformLocation | null = null;
    let uTime: WebGLUniformLocation | null = null;
    let uMouse: WebGLUniformLocation | null = null;
    let uProgress: WebGLUniformLocation | null = null;

    let rafId = 0;
    let isContextLost = false;

    let targetMouseX = 0, targetMouseY = 0;
    let currentMouseX = 0, currentMouseY = 0;

    const setPointer = (clientX: number, clientY: number) => {
      const minD = Math.min(window.innerWidth, window.innerHeight);
      if (minD <= 0) return;
      targetMouseX =  (clientX - 0.5 * window.innerWidth)  / minD;
      targetMouseY = -(clientY - 0.5 * window.innerHeight) / minD;
    };

    const onMouseMove = (e: MouseEvent) => setPointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cw = 0, ch = 0;

    // mobile: usa viewport se canvas ainda sem layout
    const resize = () => {
      if (!canvas || !gl || isContextLost) return;

      let clientW = canvas.clientWidth;
      let clientH = canvas.clientHeight;
      if (clientW <= 0 || clientH <= 0) {
        clientW = window.innerWidth;
        clientH = window.innerHeight;
      }
      if (clientW <= 0 || clientH <= 0) return;

      const dw = Math.round(clientW * dpr);
      const dh = Math.round(clientH * dpr);

      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width  = dw;
        canvas.height = dh;
        gl.viewport(0, 0, dw, dh);
      }
      cw = dw;
      ch = dh;
    };

    const initGL = () => {
      if (!canvas) return false;

      gl = (canvas.getContext('webgl', { powerPreference: 'high-performance' }) ||
            canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

      if (!gl) return false;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gl.clearColor(0.04, 0.04, 0.047, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return false;
      }

      vertShader = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
      fragShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
      if (!vertShader || !fragShader) return false;

      program = gl.createProgram();
      if (!program) return false;

      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return false;
      }

      gl.useProgram(program);

      buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

      const posLoc = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      uRes      = gl.getUniformLocation(program, 'u_resolution');
      uTime     = gl.getUniformLocation(program, 'u_time');
      uMouse    = gl.getUniformLocation(program, 'u_mouse');
      uProgress = gl.getUniformLocation(program, 'u_progress');

      resize();
      return true;
    };

    const cleanupGL = () => {
      if (!gl) return;
      if (program) {
        if (vertShader) gl.detachShader(program, vertShader);
        if (fragShader) gl.detachShader(program, fragShader);
        gl.deleteProgram(program);
      }
      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
      if (buf) gl.deleteBuffer(buf);
      program = null;
      vertShader = null;
      fragShader = null;
      buf = null;
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isContextLost = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      cleanupGL();
    };

    const handleContextRestored = () => {
      isContextLost = false;
      if (initGL()) startLoop();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    if (!initGL()) {
      return () => {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      };
    }

    const startTime = performance.now();

    const render = (now: number) => {
      if (isContextLost || !gl || !program) return;

      if (cw <= 0 || ch <= 0) resize();

      const elapsed = (now - startTime) / 1000;

      currentMouseX += (targetMouseX - currentMouseX) * 0.08;
      currentMouseY += (targetMouseY - currentMouseY) * 0.08;

      const safeCw       = (Number.isNaN(cw) || cw <= 0) ? canvas.width  || window.innerWidth  : cw;
      const safeCh       = (Number.isNaN(ch) || ch <= 0) ? canvas.height || window.innerHeight : ch;
      const safeMouseX   = Number.isNaN(currentMouseX) ? 0 : currentMouseX;
      const safeMouseY   = Number.isNaN(currentMouseY) ? 0 : currentMouseY;
      const safeProgress = Number.isNaN(progressRef.current) ? 0 : progressRef.current;
      const safeTime     = Number.isNaN(elapsed) ? 0 : elapsed;

      gl.useProgram(program);
      gl.uniform2f(uRes,      safeCw, safeCh);
      gl.uniform1f(uTime,     safeTime);
      gl.uniform2f(uMouse,    safeMouseX, safeMouseY);
      gl.uniform1f(uProgress, safeProgress);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafId = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(render);
    };

    startLoop();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('resize', resize);

    // redimensiona quando site aparece após loader
    const siteEl = document.getElementById('site');
    const onSiteVisible = () => requestAnimationFrame(resize);
    siteEl?.addEventListener('transitionend', onSiteVisible);
    if (siteEl?.classList.contains('is-visible')) onSiteVisible();

    const onVisibility = () => {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      } else if (!isContextLost) {
        resize();
        startLoop();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    (window as any).__shaderSetProgress = (p: number) => {
      progressRef.current = Number.isNaN(p) ? 0 : p;
    };

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', resize);
      siteEl?.removeEventListener('transitionend', onSiteVisible);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      delete (window as any).__shaderSetProgress;
      cleanupGL();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="shaderBg"
      className="hero-shader-bg"
      aria-hidden="true"
    />
  );
});

HeroShader.displayName = 'HeroShader';
export default HeroShader;
