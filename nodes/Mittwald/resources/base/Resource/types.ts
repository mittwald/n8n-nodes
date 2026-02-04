import type { OperationProperties, OperationExecutionFunction } from '../Operation';

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
