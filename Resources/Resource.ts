import { ExecutionFunction, OperationBuilder, OperationConfig, OperationProperties } from './types';
import { INodeProperties } from 'n8n-workflow';
import { Operation } from './Operation';
import { OperationProperty } from './OperationProperty';

interface ResourceConfig {
	name: string;
}

export class Resource {
	private readonly config: ResourceConfig;
	private readonly operations: Operation[] = [];
	public static resources: Resource[] = [];

	public constructor(config: ResourceConfig) {
		this.config = config;
		Resource.resources.push(this);
	}

	public get name() {
		return this.config.name;
	}

	public get value() {
		return this.name;
	}

	public findOperationByValue(value: string): Operation | undefined {
		return this.operations.find((operation) => operation.id === value);
	}
	public createOperation<TProps extends OperationProperties>(
		config: OperationConfig,
	): OperationBuilder<TProps> {
		const thisResource = this;
		return {
			withProperties(properties) {
				return {
					withExecuteFn(executionFn): void {
						thisResource.operations.push(
							new Operation(
								thisResource,
								config,
								executionFn as ExecutionFunction,
								Object.values(properties).map(
									(property) =>
										new OperationProperty(`${thisResource.name}-${config.name}`, property),
								),
							),
						);
					},
				};
			},
		};
	}

	public getN8NProperties(): Array<INodeProperties> {
		const options = this.operations.flatMap((operation) => operation.getN8NOption());

		const properties: INodeProperties[] = [
			{
				name: 'operation',
				default: null,
				displayName: 'Operation',
				type: 'options',
				options,
				displayOptions: {
					show: {
						resource: [this.config.name],
					},
				},
			},
		];

		return properties.concat(this.operations.flatMap((operation) => operation.getN8NProperties()));
	}
}
