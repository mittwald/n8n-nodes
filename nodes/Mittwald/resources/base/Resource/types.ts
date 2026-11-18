import type { OperationExecutionFunction } from '../Operation';
import type { OperationProperties } from '../Operation/types';

export interface OperationBuilder<TPaginated extends boolean = false> {
	withProperties<TProps extends OperationProperties>(
		properties: TProps,
	): {
		withExecuteFn(fn: OperationExecutionFunction<TProps, TPaginated>): void;
	};
}

export interface ResourceConfig {
	name: string;
}
