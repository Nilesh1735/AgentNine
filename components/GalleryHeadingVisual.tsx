"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { galleryHeadingSource } from "@/components/effects/gallery-heading/gallery-heading-source";

const halftoneArtworkBlock = `function fill(x,style){ x.fillStyle = style; x.fillRect(0,0,TS,TS); }

function rgbOf(hex){
  var v = parseInt(hex.slice(1),16);
  return [(v>>16)&255,(v>>8)&255,v&255];
}
function mixRGB(a,b,t){
  return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
}
function cssRGB(c){
  return 'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')';
}
function noiseField(seed){
  var g = new Float32Array(4096), r = rng(seed), i;
  for (i=0;i<4096;i++) g[i] = r();
  return function(x,y){
    var x0 = Math.floor(x), y0 = Math.floor(y);
    var fx = x - x0, fy = y - y0;
    fx = fx*fx*(3-2*fx); fy = fy*fy*(3-2*fy);
    var ra = (y0 & 63)*64, rb = ((y0+1) & 63)*64, ca = x0 & 63, cb = (x0+1) & 63;
    var a = g[ra+ca], b = g[ra+cb], c = g[rb+ca], d = g[rb+cb];
    return a + (b-a)*fx + (c-a)*fy + (a-b-c+d)*fx*fy;
  };
}
function fbm(n,x,y,oct){
  var v = 0, amp = 0.5, f = 1, tot = 0, i;
  for (i=0;i<oct;i++){ v += amp*n(x*f,y*f); tot += amp; amp *= 0.5; f *= 2; }
  return v/tot;
}
function grain(x, alpha){
  x.save();
  x.globalCompositeOperation = 'overlay';
  x.globalAlpha = alpha;
  x.fillStyle = x.createPattern(grainTile,'repeat');
  x.fillRect(0,0,TS,TS);
  x.restore();
}
function paintHalftone(x, base, i){
  fill(x, cssRGB(base));
  if (HALFTONE_DOT_DENSITY <= 0) return;
  var n = noiseField(0x3F19 + i*21467), gx, gy;
  var dot = mixRGB(base,[0,0,0],HALFTONE_DOT_INK);
  var pitch = TS/HALFTONE_DOT_DENSITY, a = (17 + (i % 4)*9)*Math.PI/180;
  var ca = Math.cos(a), sa = Math.sin(a), span = Math.ceil(TS/pitch);
  x.save();
  x.fillStyle = cssRGB(dot);
  x.translate(TS/2, TS/2);
  x.rotate(a);
  for (gy=-span;gy<=span;gy++){
    for (gx=-span;gx<=span;gx++){
      var wx = gx*pitch, wy = gy*pitch;
      var u = (wx*ca - wy*sa)/TS + 0.5, v = (wx*sa + wy*ca)/TS + 0.5;
      if (u < -0.1 || u > 1.1 || v < -0.1 || v > 1.1) continue;
      var s = fbm(n, u*2.7, v*2.7, 4)*0.95 + (0.55 - v)*0.5;
      var rad = pitch*0.66*(s < 0 ? 0 : s > 1 ? 1 : s);
      if (rad < 0.4) continue;
      x.beginPath(); x.arc(wx, wy, rad, 0, Math.PI*2); x.fill();
    }
  }
  x.restore();
  grain(x, HALFTONE_GRAIN);
}
var PAINTERS = { halftone: paintHalftone };
var ART = (function(){
  var list = [], i;
  for (i=0;i<PLATES.length;i++){
    list.push((function(index){
      return function(x){ PAINTERS.halftone(x, rgbOf(PLATES[index]), index); };
    })(i));
  }
  return list;
})();

function roundRectPath`;

const didoneHeadBlock = `function buildHead(){
  headLayer = mkc(Math.max(1,W), Math.max(1,H));
  var x = headLayer.getContext('2d');
  if (x.letterSpacing !== undefined) x.letterSpacing = (HEAD_TRACK*HEAD_CAP*HEAD_SIZE*K).toFixed(2)+'px';
  headPass(x, 0, 0, null);
}
function headPass(x, dx, dy, tint){
  for (var i=0;i<HEAD.length;i++){
    var h = HEAD[i];
    fitText(x, h.s, SANS, HEAD_WEIGHT, HEAD_CAP*HEAD_SIZE*K, d2sx(1481 + (h.offset || 0)) + dx,
            d2sy(HEAD_MID + (h.top - HEAD_MID)*HEAD_SIZE) + dy, h.w*HEAD_SIZE*K, tint || h.fill);
  }
}

function buildLabels`;

export function GalleryHeadingVisual({ mode = "light" }: { mode?: "light" | "dark" }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const [availableSize, setAvailableSize] = useState({ width: 1280, height: 836 });
  const [reduceMotion, setReduceMotion] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;
    const update = () => {
      const bounds = visual.getBoundingClientRect();
      setAvailableSize({ width: Math.max(320, bounds.width), height: Math.max(1, bounds.height) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(visual);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const source = useMemo(() => {
    const background = mode === "dark" ? "#000000" : "transparent";
    const accent = "#dd0200";
    const wordColor = mode === "light" ? "#111318" : "#edf3ff";
    const headline = mode === "light" ? "#17181a" : "#f1f2f4";
    const platePalette = [
      "#f4f3ef",
      "#d9d8d3",
      "#b9bab8",
      "#eeeeea",
      "#c9cac7",
      "#e5e4df",
      "#aeb0b1",
      "#f8f7f3",
      "#d0cfca",
      "#eae9e4",
      "#c0c1be",
      mode === "dark" ? "#ff7772" : accent,
    ];
    const halftoneSettings =
      "var HALFTONE_DOT_DENSITY = 30; var HALFTONE_DOT_INK = 0.88; var HALFTONE_GRAIN = 0.12;";
    const fluid = (min: number, max: number, minWidth: number, maxWidth: number) => {
      const progress = Math.max(0, Math.min(1, (availableSize.width - minWidth) / (maxWidth - minWidth)));
      return min + (max - min) * progress;
    };
    const compactLayout = availableSize.width <= 700;
    const headlineSize = compactLayout ? 1.35 : fluid(1.55, 2.05, 390, 1920);
    const designScale = Math.min(availableSize.width, availableSize.height * 2962 / 2160) / 2962;
    const headlineWidth = availableSize.width * 0.92 / (designScale * headlineSize);
    const wheelScale = fluid(0.72, 1.05, 390, 1920);
    const firstLineTop = compactLayout ? 350 : 930;
    const secondLineTop = compactLayout ? 560 : 1135;
    const ringCenterY = compactLayout ? 1300 : 1108;
    const headlineSource = `var HEAD = [
      { s:'FIND YOUR', top:${firstLineTop}, w:${headlineWidth}, fill:'${wordColor}', offset:0 },
      { s:'NEXT AGENT', top:${secondLineTop}, w:${headlineWidth}, fill:'${headline}', offset:0 }
];`;
    const withoutDemoLabels = /function buildLabels\(\)\{[\s\S]*?\n\}\n\nfunction resize/;
    return galleryHeadingSource
      .replace("New Grainient Collection Added", "Find Your Next Agent")
      .replace("NEW GRAINIENT", "FIND YOUR")
      .replace("COLLECTION ADDED", "NEXT AGENT")
      .replace("cx: 1484, cy: 1108,", `cx: 1484, cy: ${ringCenterY},`)
      .replace("  a: 712,", `  a: ${712 * wheelScale},`)
      .replace("axis: 25.5,", "axis: 90,")
      .replace("phase: 93", "phase: 0")
      .replace(
        "  tile: 346,            /* tile side in ring units (R = a)               */",
        `  tile: ${346 * wheelScale},                                                               \n  aspect: 0.75,`,
      )
      .replace("roundRectPath(ctx, TS, TS, TS*RING.radius);", "roundRectPath(ctx, TS, TS*RING.aspect, TS*RING.aspect*RING.radius);")
      .replace(
        "var CAP = 142;          /* headline cap height */\nvar SMALL = 22;         /* small-label cap height */",
        `var HEAD_CAP = 142; var HEAD_MID = 1093; var HEAD_SIZE = ${headlineSize}; var HEAD_WEIGHT = '400'; var HEAD_TRACK = 0.02; var HEAD_STYLE = 'halftone'; ${halftoneSettings} var PLATES = ${JSON.stringify(platePalette)}; var FIELD = 'halftone';`
      )
      .replace(
        "var SANS = '\"Helvetica Neue\",Helvetica,\"Inter\",Arial,system-ui,sans-serif';",
        "var SANS = 'Didot,\"Bodoni 72\",\"Times New Roman\",serif';",
      )
      .replace(/var HEAD = \[[\s\S]*?\];/, headlineSource)
      .replace(/function lin\(x,x0,y0,x1,y1,stops\)\{[\s\S]*?\n\];\n\nfunction roundRectPath/, halftoneArtworkBlock)
      .replace(/function buildHead\(\)\{[\s\S]*?\n\}\n\nfunction buildLabels/, didoneHeadBlock)
      .replace("background:#000;", `background:${background};`)
      .replace(
        "  ctx.fillStyle = '#000';\n  ctx.fillRect(0,0,W,H);",
        "  ctx.clearRect(0,0,W,H);",
      )
      .replace("fill:'#d0d0d0'", `fill:'${accent}'`)
      .replace("fill:'#ffffff'", `fill:'${headline}'`)
      .replaceAll("#c0402c", accent)
      .replace(
        /  var drawnText = false;\n  for \(i=0;i<list\.length;i\+\+\)\{\n    if \(!drawnText && list\[i\]\.z > 0\)\{ ctx\.drawImage\(headLayer,0,0\); drawnText = true; \}\n    drawTile\(list\[i\]\.i, list\[i\]\.psi\);\n  \}\n  if \(!drawnText\) ctx\.drawImage\(headLayer,0,0\);/,
        "  var drawnText = false;\n  for (i=0;i<list.length;i++){\n    if (!drawnText && list[i].z > 0){ ctx.drawImage(headLayer,0,0); drawnText = true; }\n    drawTile(list[i].i, list[i].psi);\n  }\n  if (!drawnText) ctx.drawImage(headLayer,0,0);",
      )
      .replace(withoutDemoLabels, "function buildLabels(){}\n\nfunction resize")
      .replace(
        "var img = (facing ? TEX.front : TEX.back)[i % TEX.front.length];",
        "var img = (facing ? TEX.front : TEX.back)[i % TEX.front.length]; if (!img || typeof img.getContext !== 'function') return;",
      )
      .replace("ctx.drawImage(labelLayer,0,0);", "if (labelLayer) ctx.drawImage(labelLayer,0,0);")
      .replace(
        "var t0 = performance.now(), tNow = 0, playing = true;",
        `var t0 = performance.now(), tNow = 0, playing = ${reduceMotion ? "false" : "true"};\nwindow.__galleryHeadingAutoplay = ${reduceMotion ? "false" : "true"};\nwindow.addEventListener('message', function(event){ if (event.data && event.data.type === 'gallery-heading-resume') { resize(); render(tNow); if (!${reduceMotion ? "true" : "false"}) window.__play(); } });`,
      );
  }, [availableSize, mode, reduceMotion]);

  useEffect(() => {
    const resume = () => frameRef.current?.contentWindow?.postMessage({ type: "gallery-heading-resume" }, "*");
    const timer = window.setTimeout(resume, 0);
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [mode, pathname]);

  return (
    <div ref={visualRef} className="gallery-heading-visual" aria-hidden="true">
      <iframe
        key={`${pathname}:${mode}`}
        ref={frameRef}
        title="Find Your Next Agent"
        srcDoc={source}
        sandbox="allow-scripts"
        loading="eager"
        onLoad={() => frameRef.current?.contentWindow?.postMessage({ type: "gallery-heading-resume" }, "*")}
      />
    </div>
  );
}
