import type { ApiClient } from '../../../../api';
import Z from 'zod';

export async function resolveStackId(apiClient: ApiClient, projectId: string): Promise<string> {
	const stacks = await apiClient.request({
		path: `/projects/${projectId}/stacks`,
		method: 'GET',
		responseSchema: Z.array(
			Z.object({
				id: Z.string(),
			}),
		),
	});
	const stack = stacks[0];
	if (!stack) {
		throw new Error(`No container stack found for project ${projectId}`);
	}

	return stack.id;
}
