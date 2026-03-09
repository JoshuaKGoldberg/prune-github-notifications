import { describe, expect, it } from "vitest";

import { defaultOptions } from "./options.js";

describe("defaultOptions", () => {
	describe("filters", () => {
		describe("title", () => {
			it.each([
				"build(deps): bump abc to 1.2.3",
				"build(deps): lock file maintenance",
				"build(deps): update abc to 1.2.3",
				"chore(deps): bump abc to 1.2.3",
				"chore(deps): lock file maintenance",
				"chore(deps): update abc to 1.2.3",
			])("matches %s", (title) => {
				expect(
					defaultOptions.filters.title.some((filter) => filter.test(title)),
				).toEqual(true);
			});

			it.each([
				"bump abc to 1.2.3",
				"lock file maintenance",
				"fix(deps): bump abc to 1.2.3",
				"fix(deps): lock file maintenance",
				"fix(deps): update abc to 1.2.3",
				"feat(deps): bump abc to 1.2.3",
				"feat(deps): lock file maintenance",
				"feat(deps): update abc to 1.2.3",
			])("does not match %s", (title) => {
				expect(
					defaultOptions.filters.title.some((filter) => filter.test(title)),
				).toEqual(false);
			});
		});
	});
});
