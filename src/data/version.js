import packageInfo from "../../package.json" with { type: "json" };
const { version } = packageInfo;
export const displayVersion = `V${version.split(".").slice(0, 2).join(".")}`;
