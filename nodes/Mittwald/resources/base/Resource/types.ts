import type { OperationProperties, OperationExecutionFunction } from '../Operation';

export interface OperationBuilder<TProps extends OperationProperties> {
	withProperties(properties: TProps): {
		withExecuteFn(fn: OperationExecutionFunction<TProps>): void;
	};
}

export interface ResourceConfig {
	name: string;
}
