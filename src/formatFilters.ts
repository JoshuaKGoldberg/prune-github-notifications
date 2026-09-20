import { FilterOptions } from "./types.js";

export function formatFilters({ commentAuthor, reason, title }: FilterOptions) {
	return [
		commentAuthor && `  commentAuthor: ${[...commentAuthor].join(", ")}`,
		`  reason: ${[...reason].join(", ")}`,
		`  title: ${title.map(String).join(", ")}`,
	]
		.filter(Boolean)
		.join("\n");
}
