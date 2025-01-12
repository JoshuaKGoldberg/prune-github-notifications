export interface FilterOptions {
	reason: ReadonlySet<string>;
	title: RegExp[];
}

export interface PruneGitHubNotificationsOptions {
	auth?: string;
	bandwidth?: number;
	filters?: Partial<FilterOptions>;

	/**
	 * Controls whether or not to log when no notifications are found. This can
	 * help new users understand the tool and what filters are being applied.
	 */
	logFilterWhenEmpty?: boolean;
}

export interface PruneGitHubNotificationsResult {
	threads: number[];
}
