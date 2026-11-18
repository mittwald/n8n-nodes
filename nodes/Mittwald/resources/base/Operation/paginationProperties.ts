import type { OperationPropertyConfig } from '../OperationProperty';

// Added to every operation registered with `paginated: true`. The names and
// texts follow n8n's conventions for list operations.

export const returnAllPropertyName = 'returnAll';
export const limitPropertyName = 'limit';

export const returnAllProperty: OperationPropertyConfig = {
	displayName: 'Return All',
	description: 'Whether to return all results or only up to a given limit',
	type: 'boolean',
	// Deliberately true, unlike n8n's usual false: List operations returned
	// everything the API sent before pagination existed, and n8n applies this
	// default to saved workflows that do not have the field yet. A false
	// default would silently cut their results down to the limit.
	default: true,
};

export const limitProperty: OperationPropertyConfig = {
	displayName: 'Limit',
	description: 'Max number of results to return',
	type: 'number',
	default: 50,
	typeOptions: {
		minValue: 1,
	},
	displayOptions: {
		show: {
			[returnAllPropertyName]: [false],
		},
	},
};
