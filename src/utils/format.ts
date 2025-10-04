import type { OutputFormat } from "./schemas.js";

export function formatTextOrJson<T>(
	format: OutputFormat,
	payload: T,
	toText: (payload: T) => string,
): string {
	if (format === "json") {
		return JSON.stringify(payload, null, 2);
	}

	return toText(payload);
}
