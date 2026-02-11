import { IDataObject } from 'n8n-workflow';
import type { OperationPropertyConfig, OperationPropertyValue } from '../OperationProperty';
import type { ApiClient } from '../../../api';

export interface OperationConfig {
	name: string;
	action: string;
	description: string;
}

export type OperationProperties = Record<string, OperationPropertyConfig>;

interface OperationExecutionContext<TProps extends OperationProperties = OperationProperties> {
	properties: OperationExecutionProperties<TProps>;
	apiClient: ApiClient;
}

export type OperationExecutionFunction<TProps extends OperationProperties = OperationProperties> = (
	context: OperationExecutionContext<TProps>,
) => Promise<IDataObject | IDataObject[]>;

export type OperationExecutionProperties<TProps extends OperationProperties = OperationProperties> =
	{
		[k in keyof TProps]: OperationPropertyValue<TProps[k]['type']>;
	};
