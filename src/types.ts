export interface FilterOptions {
	/**
	 * Thread author username regular expressions to additionally filter to, if any.
	 */
	createdBy?: RegExp[];

	/**
	 * Latest comment author username regular expressions to additionally filter to, if any.
	 */
	lastCommentBy?: RegExp[];

	reason: ReadonlySet<string>;
	title: RegExp[];
}

export interface PruneGitHubNotificationsOptions {
	auth?: string;
	bandwidth?: number;
	filters?: Partial<FilterOptions>;
}

export interface PruneGitHubNotificationsResult {
	threads: number[];
}
