export interface PruneGitHubNotificationsOptions {
	bandwidth?: number;
	filters?: Partial<FilterOptions>;
}

export interface FilterOptions {
	reason: ReadonlySet<string>;
	title: RegExp[];
}

export interface PruneGitHubNotificationsResult {
	threads: number[];
}
