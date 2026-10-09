"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WebGLErrorBoundary, WebGLFallback } from "@/components/ui/webgl-error-boundary";

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_colorDeep;
uniform vec3 u_colorMid;
uniform vec3 u_colorHighlight;
uniform float u_speed;
uniform float u_flowStrength;
uniform float u_grain;
uniform float u_contrast;
uniform float u_opacity;
uniform float u_reveal;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.86, 0.51, -0.51, 0.86);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

vec3 applyContrast(vec3 c, float contrast) {
  return clamp((c - 0.5) * contrast + 0.5, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * (0.14 * u_speed);
  vec2 aspect = vec2(u_res.x / max(u_res.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;

  vec2 flowP = vec2(p.x * 1.1, p.y - t * 0.35);
  float n1 = fbm(flowP * 2.8 + vec2(0.0, t * 0.2));
  float n2 = fbm((flowP + n1 * 0.45) * 4.0 - vec2(0.0, t * 0.35));
  float n3 = fbm((flowP + n2 * 0.4) * 6.5 + vec2(t * 0.15, 0.0));

  float structure = n3 * 1.15 + (n2 - 0.5) * 0.5;
  structure += (n1 - 0.5) * 0.3 * u_flowStrength;

  float lowBand = smoothstep(0.18, 0.6, structure);
  float highBand = smoothstep(0.62, 1.08, structure);
  vec3 col = mix(u_colorDeep, u_colorMid, lowBand);
  col = mix(col, u_colorHighlight, highBand);

  float glow = smoothstep(0.52, 0.95, structure) * (0.35 + 0.5 * u_flowStrength);
  col += glow * u_colorHighlight * 0.35;

  float verticalMask = 1.0 - smoothstep(0.05, 1.05, uv.y);
  verticalMask = pow(verticalMask, 1.1);

  float vignette = 1.0 - smoothstep(0.36, 1.28, length(uv - 0.5));
  col *= mix(0.9, 1.05, vignette);

  col = applyContrast(col, u_contrast);

  float dither = (hash(gl_FragCoord.xy + t * 10.0) - 0.5) * u_grain;
  col += dither;

  float alpha = verticalMask * smoothstep(0.08, 0.95, structure);
  alpha *= smoothstep(0.0, 0.28, u_reveal - uv.x);
  alpha *= u_opacity;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), clamp(alpha, 0.0, 1.0));
}
`;

const HEX_COLOR_REGEX = /^#?[0-9a-fA-F]{6}$/;
const FALLBACK_DEEP = "#04050b";
const FALLBACK_MID = "#134d93";
const FALLBACK_HIGHLIGHT = "#8cecff";
const MAX_RENDER_PIXELS = 1_000_000;
const FRAME_INTERVAL_MS = 1000 / 30;

function sanitizeHexColor(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return fallback;
  }
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function hexToRgb01(hex: string): [number, number, number] {
  const normalized = sanitizeHexColor(hex, FALLBACK_DEEP).replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return [r, g, b];
}

export interface WebGLLiquidProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  description?: string;
  colorDeep?: string;
  colorMid?: string;
  colorHighlight?: string;
  speed?: number;
  flowStrength?: number;
  grain?: number;
  contrast?: number;
  opacity?: number;
  reveal?: boolean;
  delayMs?: number;
  revealDuration?: number;
  backgroundOnly?: boolean;
  children?: React.ReactNode;
}

const LIQUID_HEADLINE_CLASS =
  "pb-[0.08em] text-[11cqi] md:text-[7cqi] lg:text-[5.5cqi] leading-[0.92] tracking-[-0.03em] font-semibold text-white";

export function WebGLLiquid({
  title = "Fluid Motion",
  subtitle = "Premium Presence",
  description = "A cinematic liquid field tuned for modern hero sections with polished depth and restrained motion.",
  colorDeep = FALLBACK_DEEP,
  colorMid = FALLBACK_MID,
  colorHighlight = FALLBACK_HIGHLIGHT,
  speed = 1,
  flowStrength = 1,
  grain = 0.05,
  contrast = 1.1,
  opacity = 0.95,
  reveal = true,
  delayMs = 0,
  revealDuration = 1.2,
  backgroundOnly = false,
  className,
  children,
  style,
  ...props
}: WebGLLiquidProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [contextGeneration, setContextGeneration] = useState(0);
  const renderStaticFrameRef = useRef<(() => void) | null>(null);
  const pathname = usePathname();

  const settings = useMemo(
    () => ({
      colorDeep,
      colorMid,
      colorHighlight,
      speed,
      flowStrength,
      grain,
      contrast,
      opacity,
      reveal,
      delayMs,
      revealDuration,
    }),
    [
      colorDeep,
      colorMid,
      colorHighlight,
      speed,
      flowStrength,
      grain,
      contrast,
      opacity,
      reveal,
      delayMs,
      revealDuration,
    ],
  );
  const settingsRef = useRef(settings);
  const previousSettingsRef = useRef(settings);

  useEffect(() => {
    if (hasWebGLError) {
      return;
    }

    const reportWebGLError = () => {
      window.setTimeout(() => setHasWebGLError(true), 0);
    };
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) {
      return;
    }
    let contextLossTimeout = 0;

    try {
      const gl = canvas.getContext("webgl", {
        antialias: false,
        alpha: true,
      });
      if (!gl) {
        reportWebGLError();
        return;
      }

      const compileShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) {
          return null;
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (!vertexShader || !fragmentShader) {
        reportWebGLError();
        return;
      }

      const program = gl.createProgram();
      if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        reportWebGLError();
        return;
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        reportWebGLError();
        return;
      }

      gl.useProgram(program);

      const positionLocation = gl.getAttribLocation(program, "position");
      const quadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const uRes = gl.getUniformLocation(program, "u_res");
      const uTime = gl.getUniformLocation(program, "u_time");
      const uColorDeep = gl.getUniformLocation(program, "u_colorDeep");
      const uColorMid = gl.getUniformLocation(program, "u_colorMid");
      const uColorHighlight = gl.getUniformLocation(program, "u_colorHighlight");
      const uSpeed = gl.getUniformLocation(program, "u_speed");
      const uFlowStrength = gl.getUniformLocation(program, "u_flowStrength");
      const uGrain = gl.getUniformLocation(program, "u_grain");
      const uContrast = gl.getUniformLocation(program, "u_contrast");
      const uOpacity = gl.getUniformLocation(program, "u_opacity");
      const uReveal = gl.getUniformLocation(program, "u_reveal");

      if (
        !uRes ||
        !uTime ||
        !uColorDeep ||
        !uColorMid ||
        !uColorHighlight ||
        !uSpeed ||
        !uFlowStrength ||
        !uGrain ||
        !uContrast ||
        !uOpacity ||
        !uReveal
      ) {
        gl.deleteBuffer(quadBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        reportWebGLError();
        return;
      }

      let redrawAfterResize: (() => void) | null = null;
      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        const dpr = Math.min(
          window.devicePixelRatio || 1,
          1.25,
          Math.sqrt(MAX_RENDER_PIXELS / Math.max(width * height, 1)),
        );
        const pixelWidth = Math.max(1, Math.floor(width * dpr));
        const pixelHeight = Math.max(1, Math.floor(height * dpr));
        const canvasResized = canvas.width !== pixelWidth || canvas.height !== pixelHeight;
        if (canvasResized) {
          canvas.width = pixelWidth;
          canvas.height = pixelHeight;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        if (canvasResized) redrawAfterResize?.();
      };

      resize();

      let rafId = 0;
      let frameTimeout = 0;
      let scrollTimeout = 0;
      let isInView = false;
      let isScrolling = false;
      let lastFrameTime = 0;
      let start = performance.now();
      const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
      let appliedSettings: typeof settings | null = null;

      const applySettings = () => {
        const current = settingsRef.current;
        if (current === appliedSettings) return current;

        const deep = hexToRgb01(current.colorDeep);
        const mid = hexToRgb01(current.colorMid);
        const highlight = hexToRgb01(current.colorHighlight);
        gl.uniform3f(uColorDeep, deep[0], deep[1], deep[2]);
        gl.uniform3f(uColorMid, mid[0], mid[1], mid[2]);
        gl.uniform3f(uColorHighlight, highlight[0], highlight[1], highlight[2]);
        gl.uniform1f(uSpeed, current.speed);
        gl.uniform1f(uFlowStrength, current.flowStrength);
        gl.uniform1f(uGrain, current.grain);
        gl.uniform1f(uContrast, current.contrast);
        gl.uniform1f(uOpacity, current.opacity);
        appliedSettings = current;
        return current;
      };

      const stopRenderLoop = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        if (frameTimeout) window.clearTimeout(frameTimeout);
        frameTimeout = 0;
      };

      const startRenderLoop = () => {
        if (
          rafId ||
          frameTimeout ||
          !isInView ||
          isScrolling ||
          document.hidden ||
          motionPreference.matches
        ) {
          return;
        }

        const delay = Math.max(0, FRAME_INTERVAL_MS - (performance.now() - lastFrameTime));
        frameTimeout = window.setTimeout(() => {
          frameTimeout = 0;
          rafId = requestAnimationFrame(render);
        }, delay);
      };

      const render = (now: number, force = false) => {
        rafId = 0;
        lastFrameTime = force ? performance.now() : now;
        const current = applySettings();
        const elapsedSec = Math.max(0, (now - start - current.delayMs) / 1000);
        const revealProgress = current.reveal
          ? Math.min(1, elapsedSec / Math.max(current.revealDuration, 0.05))
          : 1;

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform1f(uTime, elapsedSec);
        gl.uniform1f(uReveal, revealProgress);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        startRenderLoop();
      };

      const renderStaticFrame = () => {
        stopRenderLoop();
        const current = applySettings();
        const now = performance.now();
        start = now - current.delayMs - current.revealDuration * 1000;
        render(now, true);
      };
      redrawAfterResize = () => {
        if (motionPreference.matches) renderStaticFrame();
        else render(performance.now(), true);
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      window.addEventListener("resize", resize);
      renderStaticFrameRef.current = renderStaticFrame;
      const handleMotionPreferenceChange = () => {
        if (motionPreference.matches) {
          renderStaticFrame();
        } else {
          startRenderLoop();
        }
      };
      const handleVisibilityChange = () => {
        if (document.hidden) stopRenderLoop();
        else resumeRendering();
      };
      const resumeRendering = () => {
        if (document.hidden || isScrolling) return;
        const bounds = host.getBoundingClientRect();
        isInView =
          bounds.bottom > 0 &&
          bounds.top < window.innerHeight &&
          bounds.right > 0 &&
          bounds.left < window.innerWidth;
        if (!isInView) {
          stopRenderLoop();
          return;
        }
        stopRenderLoop();
        if (motionPreference.matches) {
          renderStaticFrame();
        } else {
          render(performance.now());
        }
      };
      const handleScroll = () => {
        isScrolling = true;
        stopRenderLoop();
        if (scrollTimeout) window.clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
          scrollTimeout = 0;
          isScrolling = false;
          resumeRendering();
        }, 180);
      };
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        isInView = entry.isIntersecting;
        if (!isInView) {
          stopRenderLoop();
          return;
        }
        if (motionPreference.matches) renderStaticFrame();
        else render(performance.now(), true);
      });
      intersectionObserver.observe(host);
      const handleContextLost = (event: Event) => {
        event.preventDefault();
        stopRenderLoop();
        contextLossTimeout = window.setTimeout(() => setHasWebGLError(true), 2_000);
      };
      const handleContextRestored = () => {
        if (contextLossTimeout) window.clearTimeout(contextLossTimeout);
        contextLossTimeout = 0;
        setHasWebGLError(false);
        setContextGeneration((generation) => generation + 1);
      };
      canvas.addEventListener("webglcontextlost", handleContextLost);
      canvas.addEventListener("webglcontextrestored", handleContextRestored);
      motionPreference.addEventListener("change", handleMotionPreferenceChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("pageshow", resumeRendering);
      window.addEventListener("focus", resumeRendering);

      renderStaticFrame();

      return () => {
        stopRenderLoop();
        if (renderStaticFrameRef.current === renderStaticFrame) {
          renderStaticFrameRef.current = null;
        }
        motionPreference.removeEventListener("change", handleMotionPreferenceChange);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("pageshow", resumeRendering);
        window.removeEventListener("focus", resumeRendering);
        window.removeEventListener("resize", resize);
        intersectionObserver.disconnect();
        resizeObserver.disconnect();
        canvas.removeEventListener("webglcontextlost", handleContextLost);
        canvas.removeEventListener("webglcontextrestored", handleContextRestored);
        if (contextLossTimeout) window.clearTimeout(contextLossTimeout);
        if (scrollTimeout) window.clearTimeout(scrollTimeout);
        gl.deleteBuffer(quadBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      };
    } catch {
      reportWebGLError();
      return;
    }
  }, [hasWebGLError, contextGeneration]);

  useEffect(() => {
    renderStaticFrameRef.current?.();
  }, [pathname]);

  useEffect(() => {
    const settingsChanged = previousSettingsRef.current !== settings;
    settingsRef.current = settings;
    previousSettingsRef.current = settings;
    if (settingsChanged) {
      renderStaticFrameRef.current?.();
    }
  }, [settings]);

  const fallbackContent = backgroundOnly ? (
    <div
      className={cn("catalog-liquid-fallback", className)}
      style={{ containerType: "size", ...style }}
      aria-hidden="true"
    />
  ) : (
    <div
      className={cn(
        "relative flex min-h-screen w-full items-center overflow-hidden bg-[#02040b] text-white",
        className,
      )}
      style={{ containerType: "size", ...style }}
      {...props}
    >
      <WebGLFallback className="absolute inset-0 h-full w-full" />
      {(title || subtitle || description || children) && (
        <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6 py-20 md:px-10 md:py-28">
          <div className="max-w-[760px]">
            {title && <h1 className={LIQUID_HEADLINE_CLASS}>{title}</h1>}
            {subtitle && (
              <h2 className="mt-2 text-[11cqi] md:text-[7cqi] lg:text-[5.5cqi] leading-[0.9] tracking-[-0.03em] font-bold text-white/95">
                {subtitle}
              </h2>
            )}
            {description && (
              <p className="mt-6 max-w-[620px] text-base leading-relaxed text-white/75 md:text-xl">
                {description}
              </p>
            )}
            {children && <div className="mt-10">{children}</div>}
          </div>
        </div>
      )}
    </div>
  );

  if (hasWebGLError) {
    return fallbackContent;
  }

  return (
    <WebGLErrorBoundary fallback={fallbackContent}>
      <div
        ref={hostRef}
        className={cn(
          backgroundOnly
            ? "relative h-full w-full overflow-hidden bg-transparent"
            : "relative flex min-h-screen w-full items-center overflow-hidden bg-[#02040b] text-white",
          className,
        )}
        style={{ containerType: "size", ...style }}
        {...props}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {!backgroundOnly ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/15 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_65%_40%,rgba(255,255,255,0.16),transparent_45%)]" />
          </>
        ) : null}

        {!backgroundOnly && (title || subtitle || description || children) && (
          <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6 py-20 md:px-10 md:py-28">
            <div className="max-w-[760px]">
              {title && <h1 className={LIQUID_HEADLINE_CLASS}>{title}</h1>}
              {subtitle && (
                <h2 className="mt-2 text-[11cqi] md:text-[7cqi] lg:text-[5.5cqi] leading-[0.9] tracking-[-0.03em] font-bold text-white/95">
                  {subtitle}
                </h2>
              )}
              {description && (
                <p className="mt-6 max-w-[620px] text-base leading-relaxed text-white/75 md:text-xl">
                  {description}
                </p>
              )}
              {children && <div className="mt-10">{children}</div>}
            </div>
          </div>
        )}
      </div>
    </WebGLErrorBoundary>
  );
}

export default WebGLLiquid;
