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
});
