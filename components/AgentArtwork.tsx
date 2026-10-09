import { getAgentArtworkVariant } from "@/lib/agent-artwork";

function getSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

export function AgentArtwork({
  seed,
  categorySlug,
}: {
  seed: string;
  categorySlug?: string;
}) {
  const hash = getSeed(categorySlug || seed);
  const variant = getAgentArtworkVariant(categorySlug, seed);
  const offsetX = (hash >>> 5) % 15 - 7;
  const offsetY = (hash >>> 12) % 9 - 4;

  return (
    <div className={`agent-card-artwork agent-card-artwork-${variant}`} aria-hidden="true">
      <svg viewBox="0 0 360 112" focusable="false">
        <rect className="agent-artwork-paper" x="0.5" y="0.5" width="359" height="111" />
        <path className="agent-artwork-frame" d="M10 10h340v92H10z" />
        <path className="agent-artwork-rule" d="M22 22h62M22 28h36M278 84h58M300 90h36" />
        <g transform={`translate(${offsetX} ${offsetY})`}>
          {variant === 0 ? (
            <g className="agent-artwork-lines">
              <circle cx="211" cy="56" r="14" />
              <circle cx="211" cy="56" r="28" />
              <circle cx="211" cy="56" r="42" />
              <path className="agent-artwork-accent" d="M172 69c13-24 40-37 69-34" />
              <circle className="agent-artwork-dot" cx="241" cy="35" r="3" />
            </g>
          ) : null}
          {variant === 1 ? (
            <g className="agent-artwork-lines">
              <path d="M112 76 153 38l38 24 43-32 42 35" />
              <path d="M112 84h164" />
              <circle cx="153" cy="38" r="5" />
              <circle cx="191" cy="62" r="5" />
              <circle className="agent-artwork-dot" cx="234" cy="30" r="5" />
              <circle cx="276" cy="65" r="5" />
            </g>
          ) : null}
          {variant === 2 ? (
            <g className="agent-artwork-lines">
              <path d="M111 70c22-37 53-37 76 0s53 37 76 0 43-35 66 0" />
              <path d="M111 78c22-28 53-28 76 0s53 28 76 0 43-26 66 0" />
              <path d="M130 85h176" />
              <path className="agent-artwork-accent" d="M214 40c14 1 27 10 38 24" />
              <circle className="agent-artwork-dot" cx="252" cy="64" r="3" />
            </g>
          ) : null}
          {variant === 3 ? (
            <g className="agent-artwork-lines">
              <path d="m147 30 74-8 34 25-74 8z" />
              <path d="m147 30 1 39 34 25-1-39" />
              <path d="m181 55 74-8v39l-74 8" />
              <path className="agent-artwork-accent" d="m202 69 23-3" />
              <path d="m202 76 36-4" />
              <circle className="agent-artwork-dot" cx="255" cy="47" r="3" />
            </g>
          ) : null}
        </g>
        <path className="agent-artwork-registration" d="M16 16v8m0-8h8M344 96v-8m0 8h-8" />
      </svg>
    </div>
  );
}
