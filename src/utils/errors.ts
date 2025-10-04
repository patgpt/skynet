export function toError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}

	return new Error(typeof error === "string" ? error : JSON.stringify(error));
}

export function formatErrorMessage(action: string, error: unknown): string {
	const normalized = toError(error);
	return `${action} failed: ${normalized.message}`;
}
