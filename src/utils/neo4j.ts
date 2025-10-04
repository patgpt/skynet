function isNeo4jIntegerLike(
	value: unknown,
): value is { toNumber: () => number } {
	return (
		typeof value === "object" &&
		value !== null &&
		"toNumber" in (value as Record<string, unknown>) &&
		typeof (value as { toNumber?: unknown }).toNumber === "function"
	);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

export function normalizeNeo4jValue(value: unknown): unknown {
	if (value === null || value === undefined) {
		return value;
	}

	if (isNeo4jIntegerLike(value)) {
		return value.toNumber();
	}

	if (Array.isArray(value)) {
		return value.map((item) => normalizeNeo4jValue(item));
	}

	if (
		typeof value === "object" &&
		value !== null &&
		"properties" in (value as Record<string, unknown>) &&
		isPlainObject((value as Record<string, unknown>).properties)
	) {
		return normalizeNeo4jValue((value as Record<string, unknown>).properties);
	}

	if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, val]) => [
				key,
				normalizeNeo4jValue(val),
			]),
		);
	}

	return value;
}

export function normalizeNeo4jRecord(record: Record<string, unknown>) {
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [
			key,
			normalizeNeo4jValue(value),
		]),
	);
}
