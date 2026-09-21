import { describe, expect, it } from "vitest";

import { createLabelFilter } from "./createLabelFilter.js";

describe("createLabelFilter", () => {
	it("returns undefined when no matchers are provided", () => {
		expect(createLabelFilter(undefined)).toBeUndefined();
	});

	it("allows a label matching a matcher", () => {
		const filter = createLabelFilter([/^dependencies$/]);

		expect(filter?.({ labels: [{ name: "dependencies" }] })).toBe(true);
	});

	it("allows one of multiple labels matching one of multiple matchers", () => {
		const filter = createLabelFilter([/^bot$/, /dependencies/]);

		expect(
			filter?.({ labels: [{ name: "javascript" }, { name: "dependencies" }] }),
		).toBe(true);
	});

	it("filters out labels not matching any matcher", () => {
		const filter = createLabelFilter([/^bot$/, /dependencies/]);

		expect(
			filter?.({ labels: [{ name: "bug" }, { name: "javascript" }] }),
		).toBe(false);
	});

	it("filters out details with no labels", () => {
		const filter = createLabelFilter([/^dependencies$/]);

		expect(filter?.({ labels: [] })).toBe(false);
	});

	it("filters out details without labels", () => {
		const filter = createLabelFilter([/^dependencies$/]);

		expect(filter?.({ user: { login: "someone" } })).toBe(false);
	});

	it("filters out unknown details", () => {
		const filter = createLabelFilter([/^dependencies$/]);

		expect(filter?.(undefined)).toBe(false);
	});
});
