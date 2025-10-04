import Docker from "dockerode";
import { config } from "../config.js";

const { connection } = config.docker;

function resolveDockerOptions():
	| { socketPath: string }
	| { host: string; port?: number; protocol?: "http" | "https" | "ssh" } {
	if (connection.socketPath) {
		return { socketPath: connection.socketPath };
	}

	if (connection.host) {
		if (connection.host.includes("://")) {
			const url = new URL(connection.host);
			const options: {
				host: string;
				port?: number;
				protocol?: "http" | "https" | "ssh";
			} = {
				host: url.hostname,
			};

			if (url.port) {
				options.port = Number(url.port);
			}

			const rawProtocol = url.protocol.replace(/:$/, "");
			if (
				rawProtocol === "http" ||
				rawProtocol === "https" ||
				rawProtocol === "ssh"
			) {
				options.protocol = rawProtocol;
			} else if (rawProtocol === "tcp") {
				options.protocol = "http";
			}

			return options;
		}

		return { host: connection.host };
	}

	return process.platform === "win32"
		? { host: "npipe:////./pipe/docker_engine" }
		: { socketPath: "/var/run/docker.sock" };
}

/**
 * Docker client instance for container management.
 * Prefers explicitly configured host/socket overrides, then falls back to OS defaults.
 */
export const docker = new Docker(resolveDockerOptions());
