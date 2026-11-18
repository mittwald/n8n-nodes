import type { OperationPropertyConfig, OperationPropertyValue } from '../OperationProperty';
import type { ApiClient, ListPaginationOptions } from '../../../api';
import type { IAllExecuteFunctions } from 'n8n-workflow';

export interface OperationConfig {
	name: string;
	action: string;
	description: string;
	/**
	 * Adds the "Return All" and "Limit" fields to the operation and passes their
	 * values to the execute function as `pagination`, ready for
	 * `apiClient.requestList()`.
	 */
	paginated?: boolean;
}

export type OperationProperties = Record<string, OperationPropertyConfig>;

interface BaseOperationExecutionContext<TProps extends OperationProperties> {
	properties: OperationExecutionProperties<TProps>;
	apiClient: ApiClient;
	node: IAllExecuteFunctions;
}

type PaginationExecutionContext<TPaginated extends boolean> = TPaginated extends true
	? { pagination: ListPaginationOptions }
	: Record<never, never>;

export type OperationExecutionContext<
	TProps extends OperationProperties = OperationProperties,
	TPaginated extends boolean = boolean,
> = BaseOperationExecutionContext<TProps> & PaginationExecutionContext<TPaginated>;

export type OperationExecutionFunction<
	TProps extends OperationProperties = OperationProperties,
	TPaginated extends boolean = boolean,
> = (context: OperationExecutionContext<TProps, TPaginated>) => Promise<unknown>;

export type OperationExecutionProperties<TProps extends OperationProperties = OperationProperties> =
	{
		[k in keyof TProps]: OperationPropertyValue<TProps[k]['type']>;
	};
