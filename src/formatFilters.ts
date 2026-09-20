import { FilterOptions } from "./types.js";

export function formatFilters({ reason, title }: FilterOptions) {
	return [
		`  reason: ${[...reason].join(", ")}`,
		`  title: ${title.map(String).join(", ")}`,
	].join("\n");
}
