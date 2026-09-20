export interface FilterOptions {
	/**
	 * Whether to additionally filter to threads whose latest comment is from a
	 * `[bot]` account.
	 */
	botComments?: boolean;

	/**
	 * Usernames of latest comment authors to additionally filter to, if any.
	 */
	commentAuthor?: ReadonlySet<string>;
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
