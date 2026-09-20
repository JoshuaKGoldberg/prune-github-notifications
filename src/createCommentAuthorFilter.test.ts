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

	it("allows a bot author when botComments is true", () => {
		const filter = createCommentAuthorFilter({
			...filters,
			botComments: true,
		});

		expect(filter?.("renovate[bot]")).toBe(true);
	});

	it("filters out a non-bot author when botComments is true", () => {
		const filter = createCommentAuthorFilter({
			...filters,
			botComments: true,
		});

		expect(filter?.("human")).toBe(false);
	});

	it("allows an author in commentAuthor when botComments is also true", () => {
		const filter = createCommentAuthorFilter({
			...filters,
			botComments: true,
			commentAuthor: new Set(["human"]),
		});

		expect(filter?.("human")).toBe(true);
	});

	it("filters out a bot author when botComments is false and commentAuthor does not include it", () => {
		const filter = createCommentAuthorFilter({
			...filters,
			botComments: false,
			commentAuthor: new Set(["human"]),
		});

		expect(filter?.("renovate[bot]")).toBe(false);
	});
});
