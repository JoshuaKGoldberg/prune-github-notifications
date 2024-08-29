import { describe, expect, it } from "vitest";

import { createThreadFilter } from "./createThreadFilter.js";

describe("createThreadFilter", () => {
	it("filters out a thread when its reason does not match any reason", () => {
		const filter = createThreadFilter({
			reason: new Set(["allowed", "other"]),
			title: [/chore/],
		});
		const thread = { reason: "blocked", subject: { title: "chore" } };

		const actual = filter(thread);

		expect(actual).toBe(false);
	});

	it("filters out a thread when its title does not match any matcher", () => {
		const filter = createThreadFilter({
			reason: new Set(["allowed"]),
			title: [/chore/, /other/],
		});
		const thread = { reason: "allowed", subject: { title: "feat" } };

		const actual = filter(thread);

		expect(actual).toBe(false);
	});

	it("allows a thread when its reason and title match from one each", () => {
		const filter = createThreadFilter({
			reason: new Set(["allowed"]),
			title: [/chore/],
		});
		const thread = { reason: "allowed", subject: { title: "chore" } };

		const actual = filter(thread);

		expect(actual).toBe(true);
	});

	it("allows a thread when its reason and title match from within multiple of each", () => {
		const filter = createThreadFilter({
			reason: new Set(["allowed", "other"]),
			title: [/chore/, /other/],
		});
		const thread = { reason: "allowed", subject: { title: "chore" } };

		const actual = filter(thread);

		expect(actual).toBe(true);
	});
});
