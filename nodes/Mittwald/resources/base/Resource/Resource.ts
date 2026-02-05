import { INodeProperties, type INodePropertyOptions } from 'n8n-workflow';
import type { OperationBuilder, ResourceConfig } from './types';
import { Operation, OperationConfig, type OperationExecutionFunction } from '../Operation';

export class Resource {
	private readonly config: ResourceConfig;
	private readonly operations: Operation[] = [];
	public static readonly resources = new Set<Resource>();

	public constructor(config: ResourceConfig) {
		this.config = config;
		Resource.resources.add(this);
	}

	public get name() {
		return this.config.name;
	}

	public get value() {
		return this.name;
	}

	public addOperation(config: OperationConfig): OperationBuilder {
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

	private static get resourcesArray() {
		return Array.from(Resource.resources.values());
	}

	private static get flattenedOperations() {
		return Resource.resourcesArray.flatMap((resource) => resource.operations);
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
			...Resource.resourcesArray.flatMap((resource) => resource.getN8NProperties()),
		];
	}

	public static getN8NListSearchFunctions() {
		return Object.fromEntries(
			this.flattenedOperations
				.flatMap((o) => o.properties)
				.map((o) => o.config)
				.filter((c) => c.type === 'resourceLocator')
				.map((c) => [c.searchListMethodName, c.searchListMethod]),
		);
	}

	public static getN8NResourceMappingFunctions() {
		return Object.fromEntries(
			this.flattenedOperations
				.flatMap((o) => o.properties)
				.map((o) => o.config)
				.filter((c) => c.type === 'resourceMapper')
				.map((c) => [c.resourceMapperMethodName, c.resourceMapperMethod]),
		) as Record<string, unknown>;
	}

	private static getN8NOptions(): Array<INodePropertyOptions> {
		return Resource.resourcesArray.flatMap((resource) => resource.getN8NOption());
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
