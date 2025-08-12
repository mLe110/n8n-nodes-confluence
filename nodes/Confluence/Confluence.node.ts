import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { spaceFields, spaceOperations } from './Confluence.node.description';
import { spacePageSchema } from './models';

export class Confluence implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Confluence',
		name: 'confluence',
		// icon: 'file:googleDocs.svg',
		group: ['input'],
		version: 1,
		description: 'Confluence datacenter node',
		defaults: {
			name: 'Confluence',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'confluenceCredentialsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Base URL',
				name: 'baseUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'The base URL of your Confluence instance',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Space',
						value: 'space',
					},
				],
				default: 'space',
			},
			...spaceOperations,
			...spaceFields,
		],
	};
	helpers: any;

	// Zod schemas moved to `nodes/Confluence/models.ts`

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		//const items = this.getInputData();
		const baseUrl = this.getNodeParameter('baseUrl', 0);
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		const returnData: INodeExecutionData[] = [];

		if (resource === 'space') {
			if (operation === 'getSpaces') {
				const limit = 50;
				let start = 0;
				while (true) {
					const options: IHttpRequestOptions = {
						headers: { Accept: 'application/json' },
						method: 'GET',
						url: `${baseUrl}/rest/api/space`,
						json: true,
						qs: { limit, start },
					};
					const pageRaw = await this.helpers.requestWithAuthentication.call(
						this,
						'confluenceCredentialsApi',
						options,
					);

					const parsed = spacePageSchema.safeParse(pageRaw);
					if (!parsed.success) {
						const formatted = parsed.error.errors
							.map((e) => `${e.path.join('.') || '(root)'}: ${e.message}`)
							.join('\n');
						throw new NodeOperationError(
							this.getNode(),
							`Invalid response from Confluence API while fetching spaces.\n${formatted}`,
						);
					}

					const spaces = parsed.data.results;
					for (const s of spaces) {
						returnData.push({
							json: {
								id: s.id,
								key: s.key,
								name: s.name,
								type: s.type,
								_links: {
									webui: s._links?.webui,
									self: s._links?.self,
								},
							},
						});
					}

					// advance or stop
					const pageCount = spaces.length;
					if (pageCount < limit) break;
					start += pageCount;
				}
			}
		}

		return [returnData];
	}
}
