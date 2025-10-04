import { randomUUID } from "node:crypto";

export function generateId(prefix: string): string {
	const id = randomUUID().replace(/-/g, "");
	return `${prefix}_${id}`;
}
