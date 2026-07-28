import type { INodeProperties, INodePropertyOptions, NodeParameterValue } from 'n8n-workflow';
import { Mittwald } from '../../nodes/Mittwald/Mittwald.node';

export interface PropertyModel {
	name: string;
	displayName: string;
	type: string;
	description?: string;
	required: boolean;
	hasDefault: boolean;
}

export interface OperationModel {
	resource: string;
	name: string;
	action?: string;
	description?: string;
	properties: PropertyModel[];
}

export interface ResourceModel {
	name: string;
	operations: OperationModel[];
}

const isPropertyOption = (entry: unknown): entry is INodePropertyOptions =>
	typeof entry === 'object' &&
	entry !== null &&
	'name' in entry &&
	'value' in entry &&
	'type' in entry === false;

const stringValues = (values: Array<NodeParameterValue | undefined> | undefined): string[] =>
	(values ?? []).filter((value): value is string => typeof value === 'string');

const shownResources = (property: INodeProperties): string[] =>
	stringValues(property.displayOptions?.show?.resource);

const shownOperations = (property: INodeProperties): string[] =>
	stringValues(property.displayOptions?.show?.operation);

/**
 * Reconstructs the resource/operation/property tree from the generated n8n node
 * description. Going through the public description (instead of the private
 * `Resource` registry internals) keeps this reporting-only and guarantees we
 * inspect exactly what n8n renders for the user.
 */
export const buildNodeModel = (): ResourceModel[] => {
	const properties = new Mittwald().description.properties;

	const resourceSelector = properties.find((property) => property.name === 'resource');
	const resourceNames = (resourceSelector?.options ?? [])
		.filter(isPropertyOption)
		.map((option) => String(option.value));

	return resourceNames.map((resourceName) => {
		const operationSelector = properties.find(
			(property) =>
				property.name === 'operation' && shownResources(property).includes(resourceName),
		);

		const operations = (operationSelector?.options ?? [])
			.filter(isPropertyOption)
			.map((option): OperationModel => {
				const operationName = String(option.value);

				const operationProperties = properties
					.filter(
						(property) =>
							property.name !== 'resource' &&
							property.name !== 'operation' &&
							shownResources(property).includes(resourceName) &&
							shownOperations(property).includes(operationName),
					)
					.map(
						(property): PropertyModel => ({
							name: property.name,
							displayName: property.displayName,
							type: property.type,
							description: property.description,
							required: property.required === true,
							hasDefault: property.default !== undefined,
						}),
					);

				return {
					resource: resourceName,
					name: operationName,
					action: option.action,
					description: option.description,
					properties: operationProperties,
				};
			});

		return { name: resourceName, operations };
	});
};

export const flattenOperations = (resources: ResourceModel[]): OperationModel[] =>
	resources.flatMap((resource) => resource.operations);

export const operationId = (operation: OperationModel): string =>
	`${operation.resource}:${operation.name}`;
