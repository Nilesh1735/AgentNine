const REVEAL_DURATION_MS = 520;

type Point = { x: number; y: number };

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

let transitionGeneration = 0;

export function isInvalidStateError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "name" in error
    && error.name === "InvalidStateError";
}

export function shouldUseViewTransition(
  visibility: DocumentVisibilityState,
  reducedMotion: boolean,
  supported: boolean,
): boolean {
  return visibility === "visible" && !reducedMotion && supported;
}

export function clampInkOrigin(origin: Point, width: number, height: number): Point {
  return {
    x: Math.max(0, Math.min(origin.x, width)),
    y: Math.max(0, Math.min(origin.y, height)),
  };
}

function clearInkProperties(root: HTMLElement) {
  root.style.removeProperty("--theme-ink-x");
  root.style.removeProperty("--theme-ink-y");
}

export function transitionTheme(origin: Point, update: () => void) {
  const root = document.documentElement;
  const generation = ++transitionGeneration;
  const startViewTransition = (document as ViewTransitionDocument).startViewTransition;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (
    !startViewTransition
    || !shouldUseViewTransition(document.visibilityState, reducedMotion, true)
  ) {
    clearInkProperties(root);
    update();
    return;
  }

  const boundedOrigin = clampInkOrigin(origin, root.clientWidth, root.clientHeight);
  root.style.setProperty("--theme-ink-x", `${boundedOrigin.x.toFixed(2)}px`);
  root.style.setProperty("--theme-ink-y", `${boundedOrigin.y.toFixed(2)}px`);

  let updateApplied = false;
  const applyUpdate = () => {
    if (updateApplied) return;
    updateApplied = true;
    if (generation !== transitionGeneration) return;
    update();
  };

  try {
    const transition = startViewTransition.call(document, applyUpdate);
    void transition.finished.then(
      () => {
        if (generation === transitionGeneration) clearInkProperties(root);
      },
      (error: unknown) => {
        if (!updateApplied) applyUpdate();
        if (!isInvalidStateError(error)) {
          console.error("Theme ink transition did not finish", error);
        }
        if (generation === transitionGeneration) clearInkProperties(root);
      },
    );
  } catch (error) {
    if (!isInvalidStateError(error)) {
      console.error("Theme ink transition could not start", error);
    }
    if (generation === transitionGeneration) clearInkProperties(root);
    applyUpdate();
  }
}

export const themeTransitionDurations = {
  ink: REVEAL_DURATION_MS,
};
