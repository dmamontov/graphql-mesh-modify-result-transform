import { type FieldNode, type GraphQLFieldConfig, type GraphQLSchema } from 'graphql';
import { type ImportFn } from '@graphql-mesh/types';
import {
    type ModifyResultModifierOptions,
    type ModifyResultModifiersTransformConfig,
} from '../types';

export class BaseModifier {
    protected baseDir: string;
    protected importFn: ImportFn;
    protected options: ModifyResultModifiersTransformConfig;

    constructor({ options, baseDir, importFn }: ModifyResultModifierOptions) {
        this.baseDir = baseDir;
        this.importFn = importFn;
        this.options = options;
    }

    extendScheme(schema: GraphQLSchema) {
        return schema;
    }

    modifySchema(fieldConfig: GraphQLFieldConfig<any, any>) {
        return fieldConfig;
    }

    modifyRequest(fieldNode: FieldNode) {
        return fieldNode;
    }

    modifyResult(value: any) {
        return value;
    }
}

export const createBaseModifier = (config: ModifyResultModifierOptions) => {
    return new BaseModifier(config);
};
