import pkg from "../package.json" with { type: "json" };

type SemanticVersion = `${number}.${number}.${number}`;

const metadataVersion = typeof pkg.version === "string" ? pkg.version : "0.0.0";

/**
 * @name appVersion
 * @description Derived Skynet server version sourced from an optional environment override or the package.json metadata.
 * @see https://nodejs.org/api/process.html#processenv
 */
const resolvedVersion = process.env.MCP_VERSION?.trim() || metadataVersion;
const normalizedVersion =
	/^(\d+\.\d+\.\d+)/.exec(resolvedVersion)?.[0] ?? "0.0.0";

export const appVersion = normalizedVersion as SemanticVersion;
