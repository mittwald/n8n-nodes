import type { OperationExecutionFunction } from '../Operation';
import type { OperationProperties } from '../Operation/types';

export interface OperationBuilder {
	withProperties<TProps extends OperationProperties>(
		properties: TProps,
	): {
		withExecuteFn(fn: OperationExecutionFunction<TProps>): void;
	};
}

export interface ResourceConfig {
	name: string;
}
