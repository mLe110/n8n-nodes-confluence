import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { spaceFields, spaceOperations } from './Confluence.node.description';

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
        //credentials: [
        //    {
        //        name: 'googleApi',
        //        required: true,
        //        displayOptions: {
        //            show: {
        //                authentication: ['serviceAccount'],
        //            },
        //        },
        //    },
        //    {
        //        name: 'googleDocsOAuth2Api',
        //        required: true,
        //        displayOptions: {
        //            show: {
        //                authentication: ['oAuth2'],
        //            },
        //        },
        //    },
        //],
        properties: [
            // Node properties which the user gets displayed and
            // can change on the node.
            {
                displayName: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: '',
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

    // The function below is responsible for actually doing whatever this node
    // is supposed to do. In this case, we're just appending the `myString` property
    // with whatever the user has entered.
    // You can make async calls and use `await`.
    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();

        let item: INodeExecutionData;
        let myString: string;

        // Iterates over all input items and add the key "myString" with the
        // value the parameter "myString" resolves to.
        // (This could be a different value for each item in case it contains an expression)
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                myString = this.getNodeParameter('baseUrl', itemIndex, '') as string;
                item = items[itemIndex];

                item.json.baseUrl = myString;
            } catch (error) {
                // This node should never fail but we want to showcase how
                // to handle errors.
                if (this.continueOnFail()) {
                    items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
                } else {
                    // Adding `itemIndex` allows other workflows to handle this error
                    if (error.context) {
                        // If the error thrown already contains the context property,
                        // only append the itemIndex
                        error.context.itemIndex = itemIndex;
                        throw error;
                    }
                    throw new NodeOperationError(this.getNode(), error, {
                        itemIndex,
                    });
                }
            }
        }

        return [items];
    }
}
