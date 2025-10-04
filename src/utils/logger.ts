import pino from "pino";

const DEFAULT_LEVEL: pino.LevelWithSilent = "info";
const allowedLevels: pino.LevelWithSilent[] = [
	"fatal",
	"error",
	"warn",
	"info",
	"debug",
	"trace",
	"silent",
];

const envLevel = process.env.MCP_LOG_LEVEL?.toLowerCase();
const level = allowedLevels.includes(envLevel as pino.LevelWithSilent)
	? (envLevel as pino.LevelWithSilent)
	: DEFAULT_LEVEL;

/**
 * @name logger
 * @description Shared pino logger instance used across the Skynet MCP server.
 * @see https://getpino.io/#/docs/api?id=logger
 */
export const logger = pino({
	name: "skynet-mcp",
	level,
});

/**
 * @name getLogger
 * @description Create a child logger scoped with additional bindings.
 * @param bindings - Key/value pairs to attach to every log line.
 */
export const getLogger = (bindings: Record<string, unknown>) =>
	logger.child(bindings);
