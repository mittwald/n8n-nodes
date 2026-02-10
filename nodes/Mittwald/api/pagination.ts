import { config } from '../shared';
import type { RequestConfig, RequestConfigWithPagination, Response } from './types';

export const setupPagination = <TRequestBody, TResponseBody>(
	requestConfig: RequestConfig<TRequestBody, TResponseBody> & Partial<RequestConfigWithPagination>,
) => {
	let requestConfigWithPagination = requestConfig;
	const paginationConfig = requestConfig.pagination;

	if (paginationConfig) {
		const { token = '1', pageSize = config.apiPaginationPageSize } = paginationConfig;

		const page = parseInt(token, 10);
		if (isNaN(page)) {
			throw new Error(
				`Invalid pagination token: ${token}. Expected a string representing a number.`,
			);
		}

		const paginationHeader = { page, limit: pageSize };
		requestConfigWithPagination = {
			...requestConfig,
			qs: {
				...requestConfig.qs,
				...paginationHeader,
			},
			pagination: undefined,
		};
	}

	return {
		enabled: !!paginationConfig,
		requestConfig: requestConfigWithPagination,
		withPaginationToken: (fullResponse: Response<TResponseBody>) => {
			const { headers } = fullResponse;

			const parsePaginationHeader = (subject: string) => {
				const headerName = `x-pagination-${subject}`;
				return headerName in headers && typeof headers[headerName] === 'string'
					? parseInt(headers[headerName], 10)
					: undefined;
			};

			const page = parsePaginationHeader('page');
			const limit = parsePaginationHeader('limit');
			const totalcount = parsePaginationHeader('totalcount');

			if (page === undefined || limit === undefined || totalcount === undefined) {
				return fullResponse;
			}

			const hasMorePages = page * limit < totalcount;
			const nextPage = hasMorePages ? page + 1 : undefined;

			return {
				...fullResponse,
				nextPaginationToken: nextPage?.toString(),
			} satisfies Response<TResponseBody>;
		},
	};
};
