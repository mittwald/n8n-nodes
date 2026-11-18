/**
 * What the user picked in a paginated List operation's "Return All" / "Limit" fields.
 */
export interface ListPaginationOptions {
	/** Fetch page after page until the API has no more items. */
	returnAll: boolean;
	/** Maximum number of items to return. Ignored when `returnAll` is set. */
	limit: number;
}

/** One page of a list endpoint, plus what its X-Pagination-* headers said. */
export interface ListPage<TItem> {
	items: TItem[];
	/** X-Pagination-TotalCount: how many items the whole list has. */
	totalCount?: number;
	/** X-Pagination-Limit: the page size the API actually applied. */
	appliedLimit?: number;
}

export type FetchListPage<TItem> = (window: {
	skip: number;
	limit: number;
}) => Promise<ListPage<TItem>>;

export interface CollectListPagesOptions extends ListPaginationOptions {
	/** Page size requested from the API. */
	pageSize: number;
	/** Safety net against an endless loop if the API keeps reporting more items. */
	maxPages: number;
}

/**
 * Walks a skip/limit paginated list endpoint and collects its items.
 *
 * The window moves forward by the number of items actually received, not by
 * the page size asked for: some mittwald endpoints cap the page size on the
 * server side, and stepping by the requested size would silently skip entries.
 */
export async function collectListPages<TItem>(
	fetchPage: FetchListPage<TItem>,
	options: CollectListPagesOptions,
): Promise<TItem[]> {
	const { returnAll, limit, pageSize, maxPages } = options;

	if (!returnAll && (!Number.isInteger(limit) || limit < 1)) {
		throw new Error(`Limit must be a whole number of at least 1, got: ${limit}`);
	}

	const target = returnAll ? Number.POSITIVE_INFINITY : limit;
	const items: TItem[] = [];
	let skip = 0;

	for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
		const requested = Math.min(pageSize, target - items.length);
		const page = await fetchPage({ skip, limit: requested });
		const received = page.items.length;

		items.push(...page.items.slice(0, target - items.length));
		skip += received;

		if (items.length >= target || received === 0) {
			return items;
		}

		if (page.totalCount !== undefined) {
			if (skip >= page.totalCount) {
				return items;
			}
		} else if (received < Math.min(page.appliedLimit ?? requested, requested)) {
			// Without a total count, a short page is the only sign of the end.
			return items;
		}
	}

	throw new Error(
		`Stopped after ${maxPages} pages (${items.length} items) because the API kept reporting more ` +
			'results. Disable "Return All" and set a limit instead.',
	);
}
