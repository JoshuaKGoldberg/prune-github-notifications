import { styleText } from "node:util";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { runInWatch } from "./runInWatch.js";

const mockLog = vi.fn();
const mockSetTimeout = vi.fn();

const filters = {
	reason: new Set(["subscribed"]),
	title: [/chore/],
};

describe("runInWatch", () => {
	beforeEach(() => {
		console.log = mockLog;
		globalThis.setTimeout = mockSetTimeout as unknown as typeof setTimeout;
	});

	it("logs a singular thread count when the action returns one thread", async () => {
		const action = () => Promise.resolve({ threads: [111] });

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1, filters);
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
		runInWatch(action, 1, filters);
		await Promise.resolve();

		expect(mockLog).toHaveBeenCalledWith(
			"Running prune-github-notifications with --watch 1...",
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			"Pruned 2 threads.",
		);
	});

	it("logs a zero thread count and the filters when the action returns no threads", async () => {
		const action = () => Promise.resolve({ threads: [] });

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1, filters);
		await Promise.resolve();

		expect(mockLog).toHaveBeenCalledWith(
			"Running prune-github-notifications with --watch 1...",
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			styleText("gray", "No threads found."),
		);
		expect(mockLog).toHaveBeenCalledWith(
			styleText("gray", "  reason: subscribed\n  title: /chore/"),
		);
	});

	it("does not log the filters when the action returns threads", async () => {
		const action = () => Promise.resolve({ threads: [111] });

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1, filters);
		await Promise.resolve();

		expect(mockLog).not.toHaveBeenCalledWith(
			styleText("gray", "  reason: subscribed\n  title: /chore/"),
		);
	});

	it("waits the watch period between actions", async () => {
		const { promise, resolve } = withResolvers();
		let runCount = 0;

		mockSetTimeout.mockImplementation((action: () => void) => {
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
		runInWatch(action, 1, filters);
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
			styleText("gray", "No threads found."),
		);
		expect(
			mockLog.mock.calls.filter(
				([message]) =>
					message ===
					styleText("gray", "  reason: subscribed\n  title: /chore/"),
			),
		).toHaveLength(1);
	});

	it("logs the error and keeps running when the action fails once", async () => {
		const { promise, resolve } = withResolvers();
		let runCount = 0;

		mockSetTimeout.mockImplementation((action: () => void) => {
			if ((runCount += 1) < 2) {
				action();
			} else {
				resolve();
			}
		});

		const action = vi
			.fn()
			.mockRejectedValueOnce(new Error("Oh no!"))
			.mockResolvedValueOnce({ threads: [111] });

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1, filters);
		await promise;

		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			styleText("red", "Failed to prune notifications (attempt 1/3):"),
			"Oh no!",
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			"Pruned 1 thread.",
		);
		expect(action).toHaveBeenCalledTimes(2);
	});

	it("resets the failure count when the action succeeds between failures", async () => {
		const { promise, resolve } = withResolvers();
		let runCount = 0;

		mockSetTimeout.mockImplementation((action: () => void) => {
			if ((runCount += 1) < 5) {
				action();
			} else {
				resolve();
			}
		});

		const action = vi
			.fn()
			.mockRejectedValueOnce(new Error("First"))
			.mockRejectedValueOnce(new Error("Second"))
			.mockResolvedValueOnce({ threads: [111] })
			.mockRejectedValueOnce(new Error("Third"))
			.mockRejectedValueOnce(new Error("Fourth"));

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1, filters);
		await promise;

		expect(action).toHaveBeenCalledTimes(5);
		expect(
			mockLog.mock.calls.filter(
				([, message]) =>
					message ===
					styleText("red", "Failed to prune notifications (attempt 1/3):"),
			),
		).toHaveLength(2);
		expect(
			mockLog.mock.calls.filter(
				([, message]) =>
					message ===
					styleText("red", "Failed to prune notifications (attempt 2/3):"),
			),
		).toHaveLength(2);
	});

	it("rethrows the error when the action fails three times in a row", async () => {
		mockSetTimeout.mockImplementation((action: () => void) => {
			action();
		});

		const action = vi
			.fn()
			.mockRejectedValueOnce(new Error("First"))
			.mockRejectedValueOnce(new Error("Second"))
			.mockRejectedValueOnce(new Error("Third"));

		await expect(runInWatch(action, 1, filters)).rejects.toThrow("Third");

		expect(action).toHaveBeenCalledTimes(3);
		expect(mockSetTimeout).toHaveBeenCalledTimes(2);
		expect(mockLog).not.toHaveBeenCalledWith(
			expect.any(String),
			styleText("red", "Failed to prune notifications (attempt 3/3):"),
			expect.anything(),
		);
	});

	it("logs a non-Error rejection value as-is", async () => {
		const { promise, resolve } = withResolvers();

		mockSetTimeout.mockImplementation(() => {
			resolve();
		});

		const action = vi.fn().mockRejectedValueOnce("just a string");

		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		runInWatch(action, 1, filters);
		await promise;

		expect(mockLog).toHaveBeenCalledWith(
			expect.any(String),
			styleText("red", "Failed to prune notifications (attempt 1/3):"),
			"just a string",
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
