import type {
	ILoadOptionsFunctions,
	INodeListSearchResult,
	NodeParameterValueType,
	ResourceMapperFields,
} from 'n8n-workflow';
import { Json } from '../../../shared';
import type { OperationProperty } from './OperationProperty';

interface BaseConfig {
	displayName: string;
	default: NodeParameterValueType;
	required?: boolean;
	description?: string;
}

type ListSearchMethod = (
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
) => Promise<INodeListSearchResult>;

type ResourceMapperMethod = (this: ILoadOptionsFunctions) => Promise<ResourceMapperFields>;

export type OperationPropertyConfig =
	| (BaseConfig & {
			type: 'resourceLocator';
			searchListMethod: ListSearchMethod;
			searchListMethodName: string;
	  })
	| (BaseConfig & {
			type: 'string' | 'number' | 'boolean';
	  })
	| (BaseConfig & {
			type: 'resourceMapper';
			resourceMapperMethod: ResourceMapperMethod;
			resourceMapperMethodName: string;
			dependsOn: string[];
	  });

export type OperationPropertyValue<
	T extends OperationPropertyConfig['type'] | OperationProperty['type'],
> = T extends 'string'
	? string
	: T extends 'number'
		? number
		: T extends 'boolean'
			? boolean
			: T extends 'resourceLocator'
				? string
				: T extends 'resourceMapper'
					? Json
					: never;
