import { describe, expect, it } from "vitest";

import { formatFilters } from "./formatFilters.js";

describe("formatFilters", () => {
	it("lists reasons and title patterns on indented lines", () => {
		const actual = formatFilters({
			reason: new Set(["review_requested", "subscribed"]),
			title: [/^chore\(deps\)/, /lock file maintenance/],
		});

		expect(actual).toMatchInlineSnapshot(`
			"  reason: review_requested, subscribed
			  title: /^chore\\(deps\\)/, /lock file maintenance/"
		`);
	});

	it("includes comment authors when provided", () => {
		const actual = formatFilters({
			lastCommentBy: [/^codecov/, /\[bot\]$/],
			reason: new Set(["author"]),
			title: [/.*/],
		});

		expect(actual).toMatchInlineSnapshot(`
			"  lastCommentBy: /^codecov/, /\\[bot\\]$/
			  reason: author
			  title: /.*/"
		`);
	});
});
