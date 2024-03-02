import { describe, expect, it } from "vitest";

import { createThreadFilter } from "./createThreadFilter.js";

describe("createThreadFilter", () => {
	it("filters out a thread when its reason does not match", () => {
		const filter = createThreadFilter({
			reason: new Set(["allowed"]),
			title: /chore/,
		});
		const thread = { reason: "blocked", subject: { title: "chore" } };

		const actual = filter(thread);

		expect(actual).toBe(false);
	});

	it("filters out a thread when its title does not match", () => {
		const filter = createThreadFilter({
			reason: new Set(["allowed"]),
			title: /chore/,
		});
		const thread = { reason: "allowed", subject: { title: "feat" } };

		const actual = filter(thread);

		expect(actual).toBe(false);
	});

	it("allows a thread when its reason and title match", () => {
		const filter = createThreadFilter({
			reason: new Set(["allowed"]),
			title: /chore/,
		});
		const thread = { reason: "allowed", subject: { title: "chore" } };

		const actual = filter(thread);

		expect(actual).toBe(true);
	});
});
