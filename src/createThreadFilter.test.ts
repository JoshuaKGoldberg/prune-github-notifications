import { describe, expect, it, test } from "vitest";

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

	test("common defaults", () => {
		const filter = createThreadFilter({
			reason: new Set(["subscribed"]),
			title: [/^chore\(deps\): update .+ to/, /^build\(deps-dev\): bump .+ to/],
		});

		const threads = [
			{
				reason: "subscribed",
				subject: {
					title: "chore(deps): update pnpm to v9.15.1",
					type: "PullRequest",
				},
			},
			{
				reason: "subscribed",
				subject: {
					title: "build(deps-dev): bump esbuild from 0.24.1 to 0.24.2",
					type: "PullRequest",
				},
			},
		];

		const actual = threads.filter(filter);

		expect(actual).toEqual(threads);
	});
});
