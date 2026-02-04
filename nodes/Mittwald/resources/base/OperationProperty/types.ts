import type { NodeParameterValueType } from 'n8n-workflow';

interface BaseConfig {
	name: string;
	displayName: string;
	default: NodeParameterValueType;
	required?: boolean;
	description?: string;
}

export type OperationPropertyConfig =
	| (BaseConfig & {
			type: 'resourceLocator';
			searchListMethod: string;
	  })
	| (BaseConfig & {
			type: 'string' | 'number' | 'boolean';
	  });

export type OperationPropertyValue<T extends OperationPropertyConfig['type']> = T extends 'string'
	? string
	: T extends 'number'
		? number
		: T extends 'boolean'
			? boolean
			: T extends 'resourceLocator'
				? string
				: never;
