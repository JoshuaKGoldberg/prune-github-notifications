import { describe, expect, it } from "vitest";

import { createLastCommentByFilter } from "./createLastCommentByFilter.js";

const filters = {
	reason: new Set(["subscribed"]),
	title: [/chore/],
};

describe("createLastCommentByFilter", () => {
	it("returns undefined when no comment author filters are provided", () => {
		expect(createLastCommentByFilter(filters)).toBeUndefined();
	});

	it("allows an author matching a lastCommentBy matcher", () => {
		const filter = createLastCommentByFilter({
			...filters,
			lastCommentBy: [/^allowed$/],
		});

		expect(filter?.("allowed")).toBe(true);
	});

	it("allows an author matching one of multiple lastCommentBy matchers", () => {
		const filter = createLastCommentByFilter({
			...filters,
			lastCommentBy: [/^allowed$/, /other/],
		});

		expect(filter?.("other-user")).toBe(true);
	});

	it("allows a bot author when lastCommentBy matches the [bot] suffix", () => {
		const filter = createLastCommentByFilter({
			...filters,
			lastCommentBy: [/\[bot\]$/],
		});

		expect(filter?.("codecov[bot]")).toBe(true);
	});

	it("filters out an author not matching any lastCommentBy matcher", () => {
		const filter = createLastCommentByFilter({
			...filters,
			lastCommentBy: [/^allowed$/, /\[bot\]$/],
		});

		expect(filter?.("human")).toBe(false);
	});

	it("filters out an unknown author", () => {
		const filter = createLastCommentByFilter({
			...filters,
			lastCommentBy: [/^allowed$/],
		});

		expect(filter?.(undefined)).toBe(false);
	});
});
