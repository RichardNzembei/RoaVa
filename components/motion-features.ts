// Lean DOM animation feature set, isolated so LazyMotion can code-split it into
// its own async chunk — the Motion engine is kept OUT of the initial bundle and
// loaded after hydration (performance budget, §6). `domAnimation` covers spring
// + transform/opacity transitions but excludes layout/drag, which we don't use.
import { domAnimation } from "motion/react";

export default domAnimation;
