import { describe, expect, test } from "bun:test";

describe("sanity", () => {
	test("bun test is wired", () => {
		expect(true).toBe(true);
	});
});
