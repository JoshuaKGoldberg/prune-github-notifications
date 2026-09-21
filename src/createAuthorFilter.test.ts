import { describe, expect, it } from "vitest";

import { createAuthorFilter } from "./createAuthorFilter.js";

describe("createAuthorFilter", () => {
	it("returns undefined when no matchers are provided", () => {
		expect(createAuthorFilter(undefined)).toBeUndefined();
	});

	it("allows an author matching a matcher", () => {
		const filter = createAuthorFilter([/^allowed$/]);

		expect(filter?.({ user: { login: "allowed" } })).toBe(true);
	});

	it("allows an author matching one of multiple matchers", () => {
		const filter = createAuthorFilter([/^allowed$/, /other/]);

		expect(filter?.({ user: { login: "other-user" } })).toBe(true);
	});

	it("allows a bot author when a matcher matches the [bot] suffix", () => {
		const filter = createAuthorFilter([/\[bot\]$/]);

		expect(filter?.({ user: { login: "codecov[bot]" } })).toBe(true);
	});

	it("filters out an author not matching any matcher", () => {
		const filter = createAuthorFilter([/^allowed$/, /\[bot\]$/]);

		expect(filter?.({ user: { login: "human" } })).toBe(false);
	});

	it("filters out details without a user", () => {
		const filter = createAuthorFilter([/^allowed$/]);

		expect(filter?.({ user: null })).toBe(false);
	});

	it("filters out unknown details", () => {
		const filter = createAuthorFilter([/^allowed$/]);

		expect(filter?.(undefined)).toBe(false);
	});
});
