import type { INodeProperties } from 'n8n-workflow';

export const documentOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['document'],
            },
        },
        options: [
            {
                name: 'Create',
                value: 'create',
                action: 'Create a document',
            },
            {
                name: 'Get',
                value: 'get',
                action: 'Get a document',
            },
            {
                name: 'Update',
                value: 'update',
                action: 'Update a document',
            },
        ],
        default: 'create',
    },
];

export const documentFields: INodeProperties[] = [
    /* -------------------------------------------------------------------------- */
    /*                                 document: create                           */
    /* -------------------------------------------------------------------------- */
    {
        displayName: 'Drive Name or ID',
        name: 'driveId',
        type: 'options',
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: {
            loadOptionsMethod: 'getDrives',
        },
        default: 'myDrive',
        required: true,
        displayOptions: {
            show: {
                operation: ['create'],
                resource: ['document'],
            },
        },
    },
]