import chalk from "chalk";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { runInWatch } from "./runInWatch.js";

const mockLog = vi.fn();
const mockSetTimeout = vi.fn();

describe("runInWatch", () => {
	beforeEach(() => {
		console.log = mockLog;
		globalThis.setTimeout = mockSetTimeout as unknown as typeof setTimeout;
	});

	it("logs a singular thread count when the action returns one thread", async () => {
		const action = () => Promise.resolve({ threads: [111] });

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1);
		await Promise.resolve();

		expect(mockLog).toHaveBeenCalledWith(
			"Running prune-github-notifications with --watch 1...",
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			"Pruned 1 thread.",
		);
	});

	it("logs a plural thread count when the action returns multiple threads", async () => {
		const action = () => Promise.resolve({ threads: [111, 222] });

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1);
		await Promise.resolve();

		expect(mockLog).toHaveBeenCalledWith(
			"Running prune-github-notifications with --watch 1...",
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			"Pruned 2 threads.",
		);
	});

	it("logs a zero thread count when the action returns no threads", async () => {
		const action = () => Promise.resolve({ threads: [] });

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1);
		await Promise.resolve();

		expect(mockLog).toHaveBeenCalledWith(
			"Running prune-github-notifications with --watch 1...",
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			chalk.gray("No threads found."),
		);
	});

	it("waits the watch period between actions", async () => {
		const { promise, resolve } = withResolvers();
		let runCount = 0;

		mockSetTimeout.mockImplementation((action) => {
			if ((runCount += 1) < 3) {
				action();
			} else {
				resolve();
			}
		});

		const action = vi.fn().mockImplementation(() => {
			switch (runCount) {
				case 0:
					return { threads: [111] };
				case 1:
					return { threads: [222, 333] };
				default:
					return { threads: [] };
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1);
		await promise;

		expect(mockLog).toHaveBeenCalledWith(
			"Running prune-github-notifications with --watch 1...",
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			"Pruned 1 thread.",
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			"Pruned 2 threads.",
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			chalk.gray("No threads found."),
		);
	});
});

function withResolvers() {
	let resolve!: () => void;

	const promise = new Promise<void>((innerResolve) => {
		resolve = innerResolve;
	});

	return { promise, resolve };
}
