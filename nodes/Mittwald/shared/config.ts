import pkg from '../../../package.json';

export const config = {
	apiBaseUrl: 'https://api.mittwald.de/v2',
	apiPaginationPageSize: 25,
	userAgent: `${pkg.name}/${pkg.version}`,
} as const;
