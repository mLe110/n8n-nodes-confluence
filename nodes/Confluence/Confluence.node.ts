import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { spaceFields, spaceOperations } from './Confluence.node.description';
import { spacePageSchema, spaceContentEnvelopeSchema } from './models';

export class Confluence implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Confluence',
		name: 'confluence',
		icon: 'file:Confluence.svg',
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
		const items = this.getInputData();
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
			if (operation === 'getSpaceContent') {
				for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
					try {
						const spaceKey = this.getNodeParameter('spaceKey', itemIndex, '') as string;
						const spaceName = this.getNodeParameter('spaceName', itemIndex, '') as string;
						const item = items[itemIndex];
						(this as any).logger?.info?.('Confluence: getSpaceContent', {
							node: this.getNode().name,
						});
						(this as any).logger?.debug?.(`Confluence: getSpaceContent for space ${spaceKey}`);

						const limit = 100;
						let start = 0;
						const pages: Array<{
							spaceKey: string;
							spaceName: string;
							id: string;
							title: string;
							body: string;
							webuiLink: string;
						}> = [];

						while (true) {
							const options: IHttpRequestOptions = {
								headers: { Accept: 'application/json' },
								method: 'GET',
								url: `${baseUrl}/rest/api/space/${encodeURIComponent(spaceKey)}/content`,
								json: true,
								qs: { expand: 'body.storage', limit, start },
							};

							const raw = await this.helpers.requestWithAuthentication.call(
								this,
								'confluenceCredentialsApi',
								options,
							);

							const parsed = spaceContentEnvelopeSchema.safeParse(raw);
							if (!parsed.success) {
								const formatted = parsed.error.errors
									.map((e) => `${e.path.join('.') || '(root)'}: ${e.message}`)
									.join('\n');
								throw new NodeOperationError(
									this.getNode(),
									`Invalid response from Confluence API while fetching space content.\n${formatted}`,
									{ itemIndex },
								);
							}

							const batch = parsed.data.page.results;
							for (const p of batch) {
								pages.push({
									spaceKey: spaceKey,
									spaceName: spaceName,
									id: p.id,
									title: p.title,
									body: p.body.storage.value,
									webuiLink: p._links.webui,
								});
							}

							const count = batch.length;
							if (count < limit) break;
							start += count;
						}

						item.json.content = pages;
					} catch (error) {
						if (this.continueOnFail()) {
							items.push({
								json: this.getInputData(itemIndex)[0].json,
								error,
								pairedItem: itemIndex,
							});
						} else {
							if ((error as any).context) {
								(error as any).context.itemIndex = itemIndex;
								throw error;
							}
							throw new NodeOperationError(this.getNode(), error as Error, {
								itemIndex,
							});
						}
					}
				}
				return [items];
			}
		}

		return [returnData];
	}
}
