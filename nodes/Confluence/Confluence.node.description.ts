import type { INodeProperties } from 'n8n-workflow';

export const spaceOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['space'],
            },
        },
        options: [
            {
                name: 'Get Spaces',
                value: 'getSpaces',
                action: 'Get spaces for user',
            },
            {
                name: 'Get Space Content',
                value: 'getSpaceContent',
                action: 'Get space content',
            },
        ],
        default: 'getSpaces',
    },
];

export const spaceFields: INodeProperties[] = [
    /* -------------------------------------------------------------------------- */
    /*                              space: getSpaceContent                        */
    /* -------------------------------------------------------------------------- */
    {
        displayName: 'Space ID',
        name: 'spaceId',
        type: 'string',
        description: 'Get content (incl. images in text) from the given space. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
        default: '',
        required: true,
        displayOptions: {
            show: {
                operation: ['getSpaceContent'],
                resource: ['space'],
            },
        },
    },
];
