import type { CSSProperties } from "react";

const CARD_STORIES = [
  "search",
  "categories",
  "filters",
  "access",
  "setup",
  "source",
  "verification",
  "troubleshooting",
  "uninstall",
] as const;

function ArtifactMark({ story }: { story: (typeof CARD_STORIES)[number] }) {
  if (story === "categories") return null;

  return (
    <svg
      className={`fey-artifact-mark fey-artifact-mark-${story}`}
      viewBox="0 0 220 100"
      aria-hidden="true"
      focusable="false"
    >
      {story === "search" ? (
        <g>
          <rect x="17" y="25" width="132" height="36" rx="2" />
          <path d="M30 38h63M30 47h42" />
          <circle className="fey-artifact-mark-red" cx="177" cy="45" r="16" />
          <path className="fey-artifact-mark-red" d="m188 57 13 13" />
          <path d="M25 70h95" />
        </g>
      ) : null}
      {story === "filters" ? (
        <g>
          <path d="M27 19h166l-62 38v24l-42 11V57z" />
          <path className="fey-artifact-mark-red" d="M53 32h108M68 43h77M84 54h44" />
          <path d="M89 78h37" />
        </g>
      ) : null}
      {story === "access" ? (
        <g>
          <rect x="78" y="13" width="64" height="40" />
          <path d="M91 25h38M91 34h26M110 53v16M110 69H39V80M110 69h71V80" />
          <circle className="fey-artifact-mark-red" cx="39" cy="83" r="6" />
          <circle cx="110" cy="76" r="6" />
          <circle cx="181" cy="83" r="6" />
        </g>
      ) : null}
      {story === "setup" ? (
        <g>
          <path d="M48 20v58M48 27h38M48 50h75M48 73h112" />
          <circle className="fey-artifact-mark-red-fill" cx="48" cy="20" r="5" />
          <circle cx="48" cy="50" r="5" />
          <circle cx="48" cy="78" r="5" />
          <rect x="88" y="17" width="95" height="20" />
          <path d="m96 27 4 4 8-9M97 50h45m-45 8h30" />
          <path className="fey-artifact-mark-red" d="M149 47h29m-7-6 7 6-7 6" />
        </g>
      ) : null}
      {story === "source" ? (
        <g>
          <path d="M42 21v57M42 34h66m0 0v-13m0 13v23m0-23h67" />
          <circle cx="42" cy="21" r="5" />
          <circle className="fey-artifact-mark-red-fill" cx="108" cy="21" r="5" />
          <circle cx="108" cy="57" r="5" />
          <circle cx="175" cy="34" r="5" />
          <path d="M121 57h39m-39 8h28" />
          <path className="fey-artifact-mark-red" d="M126 27h30" />
        </g>
      ) : null}
      {story === "verification" ? (
        <g>
          <path d="M52 14h105l14 14v58H52zM157 14v15h14" />
          <path d="M77 43h69M77 59h69M77 75h47" />
          <path className="fey-artifact-mark-red" d="m62 42 5 5 9-11m-14 27 5 5 9-11" />
          <path d="M62 75h10" />
        </g>
      ) : null}
      {story === "troubleshooting" ? (
        <g>
          <rect x="15" y="33" width="54" height="30" />
          <path d="M69 48h29m0 0v-25h34m-34 25v27h34" />
          <circle cx="98" cy="48" r="4" />
          <rect x="132" y="12" width="68" height="23" />
          <rect className="fey-artifact-mark-red" x="132" y="64" width="68" height="23" />
          <path d="M144 23h42m-42 9h30" />
          <path className="fey-artifact-mark-red" d="M144 75h42m-42 9h30" />
        </g>
      ) : null}
      {story === "uninstall" ? (
        <g>
          <path d="m46 31 31-16 31 16-31 16zM46 31v38l31 16 31-16V31M77 47v38" />
          <path d="M125 48h45m-11-11 11 11-11 11" />
          <path className="fey-artifact-mark-red" d="M137 69h37m-37 8h26" />
          <path d="M23 90h174" />
        </g>
      ) : null}
    </svg>
  );
}

function PreviewArtwork({ story }: { story: (typeof CARD_STORIES)[number] }) {
  if (story === "search") {
    return (
      <div className="fey-artifact fey-artifact-search">
        <h2 className="fey-artifact-title">Search the directory</h2>
        <ArtifactMark story={story} />
        <div className="fey-intent-note">
          <p>Search agents by<br />name, description, or tag</p>
          <i />
        </div>
      </div>
    );
  }

  if (story === "categories") {
    return (
      <div className="fey-artifact fey-artifact-categories">
        <h2 className="fey-artifact-title">Browse categories</h2>
        <div className="fey-category-map">
          <div className="fey-category-zone fey-category-page"><span>Category page</span></div>
          <i className="fey-category-route" />
          <div className="fey-category-zone fey-category-listings"><span>Agent listings</span></div>
        </div>
      </div>
    );
  }

  if (story === "filters") {
    return (
      <div className="fey-artifact fey-artifact-filters">
        <h2 className="fey-artifact-title">Filter the directory</h2>
        <ArtifactMark story={story} />
        <div className="fey-fit-stack">
          <div><span>Category</span></div>
          <div><span>Operating system</span></div>
          <div><span>5 checks recorded</span></div>
          <div><span>API key</span></div>
          <div><span>Updated in the past 180 days</span></div>
        </div>
      </div>
    );
  }

  if (story === "access") {
    return (
      <div className="fey-artifact fey-artifact-access">
        <h2 className="fey-artifact-title fey-artifact-title-access">
          Check access<br />and requirements
        </h2>
        <ArtifactMark story={story} />
        <div className="fey-access-record">
          <span>Network</span>
          <span>Files</span>
          <span>Ports</span>
          <span>Storage</span>
          <span>API key</span>
        </div>
      </div>
    );
  }

  if (story === "setup") {
    return (
      <div className="fey-artifact fey-artifact-setup">
        <h2 className="fey-artifact-title">Follow the setup guide</h2>
        <ArtifactMark story={story} />
        <div className="fey-setup-path">
          <span>Setup steps</span>
          <i />
          <span>Commands by platform</span>
          <i />
          <span>Environment</span>
        </div>
      </div>
    );
  }

  if (story === "source") {
    return (
      <div className="fey-artifact fey-artifact-source">
        <h2 className="fey-artifact-title">Check source and version</h2>
        <ArtifactMark story={story} />
        <div className="fey-source-slip">
          <span>Source repository</span>
          <i />
          <span>Version</span>
          <i />
          <span>Release date</span>
        </div>
      </div>
    );
  }

  if (story === "verification") {
    return (
      <div className="fey-artifact fey-artifact-verification">
        <h2 className="fey-artifact-title">See what was checked</h2>
        <ArtifactMark story={story} />
        <div className="fey-proof-list">
          <span>Pinned source checkout</span>
          <span>Dependency installation</span>
          <span>Provider setup</span>
          <span>First prompt</span>
          <span>Successful run on a typical machine</span>
        </div>
      </div>
    );
  }

  if (story === "troubleshooting") {
    return (
      <div className="fey-artifact fey-artifact-troubleshooting">
        <h2 className="fey-artifact-title">Troubleshooting notes</h2>
        <ArtifactMark story={story} />
        <div className="fey-troubleshooting-record">
          <span>Common problems</span>
          <span>Hardware</span>
          <span>Known verification limits</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fey-artifact fey-artifact-uninstall">
      <h2 className="fey-artifact-title">Uninstall instructions</h2>
      <ArtifactMark story={story} />
      <div className="fey-uninstall-note">
        <span>Project removal</span>
        <i />
        <span>Command or source</span>
      </div>
    </div>
  );
}

export function FeyCards() {
  const centerIndex = Math.floor(CARD_STORIES.length / 2);

  return (
    <div className="fey-hero">
      <p className="eyebrow fey-hero-kicker">OPEN-SOURCE AI AGENT DIRECTORY</p>
      <h1 className="fey-hero-title">
        <span>Find Your</span>
        {" "}
        <span>Next Agent</span>
      </h1>
      <div
        className="fey-deck-scroll"
        role="region"
        aria-label="Illustrated previews of directory search, category browsing, search filters, access details, setup, source metadata, verification evidence, troubleshooting, and uninstall information. Scroll horizontally to view the cards on smaller screens."
        tabIndex={0}
      >
        <div className="fey-deck">
          {CARD_STORIES.map((story, index) => (
            <div
              key={story}
              className="fey-card"
              style={{
                "--card-position": index - centerIndex,
                "--card-layer": CARD_STORIES.length - Math.abs(index - centerIndex),
              } as CSSProperties & Record<"--card-position" | "--card-layer", number>}
              aria-hidden="true"
            >
              <div className="fey-preview">
                <PreviewArtwork story={story} />
                <div className="fey-meteor-shower" aria-hidden="true">
                  <i /><i /><i /><i />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
