import listen from "./listen.js";
import ask from "./ask.js";
import explain from "./explain.js";

// Stage modules currently expose metadata only. Add game behavior when implemented.
export const stages = Object.freeze([listen, ask, explain]);
