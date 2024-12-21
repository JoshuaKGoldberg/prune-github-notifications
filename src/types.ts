export interface FilterOptions {
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
