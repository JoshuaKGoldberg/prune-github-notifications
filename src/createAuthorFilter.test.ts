import { describe, expect, it } from "vitest";

import { createAuthorFilter } from "./createAuthorFilter.js";

describe("createAuthorFilter", () => {
	it("returns undefined when no matchers are provided", () => {
		expect(createAuthorFilter(undefined)).toBeUndefined();
	});

	it("allows an author matching a matcher", () => {
		const filter = createAuthorFilter([/^allowed$/]);

		expect(filter?.("allowed")).toBe(true);
	});

	it("allows an author matching one of multiple matchers", () => {
		const filter = createAuthorFilter([/^allowed$/, /other/]);

		expect(filter?.("other-user")).toBe(true);
	});

	it("allows a bot author when a matcher matches the [bot] suffix", () => {
		const filter = createAuthorFilter([/\[bot\]$/]);

		expect(filter?.("codecov[bot]")).toBe(true);
	});

	it("filters out an author not matching any matcher", () => {
		const filter = createAuthorFilter([/^allowed$/, /\[bot\]$/]);

		expect(filter?.("human")).toBe(false);
	});

	it("filters out an unknown author", () => {
		const filter = createAuthorFilter([/^allowed$/]);

		expect(filter?.(undefined)).toBe(false);
	});
});
