import { describe, expect, it } from "vitest";

import { createCommentAuthorFilter } from "./createCommentAuthorFilter.js";

const filters = {
	reason: new Set(["subscribed"]),
	title: [/chore/],
};

describe("createCommentAuthorFilter", () => {
	it("returns undefined when no comment author filters are provided", () => {
		expect(createCommentAuthorFilter(filters)).toBeUndefined();
	});

	it("allows an author in commentAuthor", () => {
		const filter = createCommentAuthorFilter({
			...filters,
			commentAuthor: new Set(["allowed"]),
		});

		expect(filter?.("allowed")).toBe(true);
	});

	it("filters out an author not in commentAuthor", () => {
		const filter = createCommentAuthorFilter({
			...filters,
			commentAuthor: new Set(["allowed"]),
		});

		expect(filter?.("other")).toBe(false);
	});

	it("filters out an unknown author", () => {
		const filter = createCommentAuthorFilter({
			...filters,
			commentAuthor: new Set(["allowed"]),
		});

		expect(filter?.(undefined)).toBe(false);
	});
});
