import listen from "./listen.js";
import ask from "./ask.js";
import explain from "./explain.js";

// Learning progression metadata; interaction state lives in game/engine.js.
export const stages = Object.freeze([listen, ask, explain]);
