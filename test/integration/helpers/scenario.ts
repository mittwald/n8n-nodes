import type { IntegrationEnv } from './env';
import type { N8nExecutionItem } from './n8nClient';
import { type MittwaldNodeInput, createMittwaldWorkflow, nodeIdReference } from './runWorkflow';

type RunWorkflowFn = (input: { workflow: ReturnType<typeof createMittwaldWorkflow> }) => Promise<{
	workflowId: string;
	executionId: string;
	execution: Record<string, unknown>;
	getNodeItems: (nodeName: string, options?: { allowEmpty?: boolean }) => N8nExecutionItem[];
	getFirstItem: (
		nodeName: string,
		options?: { allowEmpty?: boolean },
	) => N8nExecutionItem | undefined;
}>;

type JsonObject = Record<string, unknown>;

export type ScenarioStepInput = MittwaldNodeInput;

export interface ScenarioBuilder {
	step(step: ScenarioStepInput): ScenarioBuilder;
	steps(steps: ScenarioStepInput[]): ScenarioBuilder;
	run(): Promise<ScenarioResult>;
}

export interface ScenarioResult {
	workflowId: string;
	executionId: string;
	execution: Record<string, unknown>;
	step: (name: string) => ScenarioStepResult;
}

export interface ScenarioStepResult {
	items: (options?: { allowEmpty?: boolean }) => N8nExecutionItem[];
	first: (options?: { allowEmpty?: boolean }) => N8nExecutionItem | undefined;
	requireString: (field: string) => string;
	optionalString: (field: string) => string | undefined;
	stringValues: (field: string) => string[];
}

const readRequiredString = (source: JsonObject, key: string): string => {
	const value = source[key];
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}

	throw new Error(`Expected property "${key}" to be a non-empty string`);
};

const readOptionalString = (source: JsonObject, key: string): string | undefined => {
	const value = source[key];
	return typeof value === 'string' ? value : undefined;
};

export const createScenario = ({
	env,
	runWorkflow,
	name,
}: {
	env: IntegrationEnv;
	runWorkflow: RunWorkflowFn;
	name?: string;
}): ScenarioBuilder => {
	const steps: ScenarioStepInput[] = [];

	const builder: ScenarioBuilder = {
		step(step) {
			steps.push(step);
			return builder;
		},
		steps(newSteps) {
			steps.push(...newSteps);
			return builder;
		},
		async run() {
			const result = await runWorkflow({
				workflow: createMittwaldWorkflow(env, steps, name),
			});

			return {
				workflowId: result.workflowId,
				executionId: result.executionId,
				execution: result.execution,
				step(stepName) {
					return {
						items: (options) => result.getNodeItems(stepName, options),
						first: (options) => result.getFirstItem(stepName, options),
						requireString: (field) =>
							readRequiredString(
								result.getFirstItem(stepName, { allowEmpty: false })?.json ?? {},
								field,
							),
						optionalString: (field) =>
							readOptionalString(
								result.getFirstItem(stepName, { allowEmpty: false })?.json ?? {},
								field,
							),
						stringValues: (field) =>
							result
								.getNodeItems(stepName)
								.map((item) => readOptionalString(item.json, field))
								.filter((value): value is string => Boolean(value)),
					};
				},
			};
		},
	};

	return builder;
};

export const fromStep = (stepName: string, field = 'id') => nodeIdReference(stepName, field);
