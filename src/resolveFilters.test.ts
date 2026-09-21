import { describe, expect, it } from "vitest";

import { defaultOptions } from "./options.js";
import { resolveFilters } from "./resolveFilters.js";

describe("resolveFilters", () => {
	it("uses default filters when none are provided", () => {
		expect(resolveFilters()).toEqual(defaultOptions.filters);
	});

	it("fills in missing filters with defaults when some are provided", () => {
		const reason = new Set(["any"]);

		expect(resolveFilters({ reason })).toEqual({
			reason,
			title: defaultOptions.filters.title,
		});
	});

	it("passes through optional filters when they are provided", () => {
		const createdBy = [/^renovate/];
		const label = [/^dependencies$/];
		const lastCommentBy = [/\[bot\]$/];

		expect(resolveFilters({ createdBy, label, lastCommentBy })).toEqual({
			createdBy,
			label,
			lastCommentBy,
			reason: defaultOptions.filters.reason,
			title: defaultOptions.filters.title,
		});
	});
});
