import { z } from "zod";

export const outputFormatSchema = z
	.enum(["text", "json"])
	.default("text")
	.describe(
		"Controls whether the tool response should be formatted as human-readable text or JSON",
	);

export type OutputFormat = z.infer<typeof outputFormatSchema>;
