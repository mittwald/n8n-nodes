import { IDataObject } from 'n8n-workflow';
import type { OperationPropertyConfig } from '../OperationProperty';
import type { ApiClient } from '../../../api';

export interface OperationConfig {
	name: string;
	action: string;
}

export type OperationProperties = Record<string, OperationPropertyConfig>;

type OperationExecutionPropertyValue<T> = T extends OperationPropertyConfig
	? T extends { type: 'boolean' }
		? boolean | T['default']
		: T extends { type: 'number' }
			? number | T['default']
			: T extends { type: 'string' }
				? string | T['default']
				: T extends { type: 'resourceLocator' }
					? string | T['default']
					: never
	: never;

interface OperationExecutionContext<TProps extends OperationProperties = OperationProperties> {
	properties: OperationExecutionProperties<TProps>;
	apiClient: ApiClient;
}

export type OperationExecutionFunction<TProps extends OperationProperties = OperationProperties> = (
	context: OperationExecutionContext<TProps>,
) => Promise<IDataObject>;

export type OperationExecutionProperties<TProps extends OperationProperties = OperationProperties> =
	{
		[k in keyof TProps]: OperationExecutionPropertyValue<TProps[k]>;
	};
