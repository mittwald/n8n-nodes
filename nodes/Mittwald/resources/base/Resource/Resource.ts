import { INodeProperties, type INodePropertyOptions } from 'n8n-workflow';
import {
	Operation,
	OperationConfig,
	OperationExecutionFunction,
	OperationProperties,
} from '../Operation';
import type { OperationBuilder, ResourceConfig } from './types';

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

	public addOperation<TProps extends OperationProperties>(
		config: OperationConfig,
	): OperationBuilder<TProps> {
		return {
			withProperties: (properties) => {
				return {
					withExecuteFn: (executionFn): void => {
						this.operations.push(
							new Operation(this, config, executionFn as OperationExecutionFunction, properties),
						);
					},
				};
			},
		};
	}

	private static get flattenedOperations() {
		return Resource.resources.flatMap((resource) => resource.operations);
	}

	public static getOperation(resourceName: string, operationName: string): Operation {
		const operation = Resource.flattenedOperations.find(
			(operation) => operation.name === operationName && operation.resource.name === resourceName,
		);
		if (operation === undefined) {
			throw new Error(`Operation "${resourceName}:${operationName}" not found`);
		}
		return operation;
	}

	public static getN8NProperties(): Array<INodeProperties> {
		return [
			{
				displayName: 'Resource',
				name: 'resource',
				default: '',
				type: 'options',
				noDataExpression: true,
				options: Resource.getN8NOptions(),
			},
			...Resource.resources.flatMap((resource) => resource.getN8NProperties()),
		];
	}

	private static getN8NOptions(): Array<INodePropertyOptions> {
		return Resource.resources.flatMap((resource) => resource.getN8NOption());
	}

	private getN8NProperties(): Array<INodeProperties> {
		const options = this.operations.flatMap((operation) => operation.getN8NOption());

		const properties: INodeProperties[] = [
			{
				displayName: 'Operation',
				name: 'operation',
				default: null,
				type: 'options',
				noDataExpression: true,
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

	private getN8NOption(): INodePropertyOptions {
		return { name: this.name, value: this.value };
	}
}
