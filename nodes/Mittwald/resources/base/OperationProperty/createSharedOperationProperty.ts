import { type OperationPropertyConfig } from '../../base';

export const sharedOperationProperties: OperationPropertyConfig[] = [];

export const createSharedOperationProperty = (config: OperationPropertyConfig) => {
	sharedOperationProperties.push(config);
	return config;
};

export const getResourceMappingFunctions = () => {};
export const getResourceLocatorFunctions = () => {
	Object.fromEntries(
		Object.entries(sharedOperationProperties)
			.map(([key, value]) =>
				value.type === 'resourceLocator' ? [key, value.searchListMethod] : [key, undefined],
			)
			.filter(([, fn]) => fn !== undefined),
	);
};
