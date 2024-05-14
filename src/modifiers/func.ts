import {
    GraphQLNonNull,
    isNonNullType,
    type FieldNode,
    type GraphQLFieldConfig,
    type GraphQLSchema,
} from 'graphql';
import { parseSelectionSet } from '@graphql-tools/utils';
import {
    type ModifyResultModifierFuncTransformConfig,
    type ModifyResultModifierOptions,
} from '../types';
import { BaseModifier } from './base';

export class FuncModifier extends BaseModifier {
    protected asType?: any;

    extendScheme(schema: GraphQLSchema) {
        const options = this.options as ModifyResultModifierFuncTransformConfig;

        this.asType = options.as ? schema.getType(options.as) : undefined;

        return schema;
    }

    modifySchema(fieldConfig: GraphQLFieldConfig<any, any>) {
        const isNotNull = isNonNullType(fieldConfig.type);
        const originalType = isNotNull
            ? (fieldConfig.type as GraphQLNonNull<any>).ofType
            : fieldConfig.type;

        const newType = this.asType || originalType;

        return {
            ...fieldConfig,
            type: isNotNull ? new GraphQLNonNull(newType) : newType,
        };
    }

    modifyRequest(fieldNode: FieldNode) {
        const options = this.options as ModifyResultModifierFuncTransformConfig;
        if (!options.selections) {
            return fieldNode;
        }

        const selections: FieldNode[] = parseSelectionSet(options.selections)
            ?.selections as FieldNode[];
        if (selections && selections.length > 0) {
            return [fieldNode].concat(selections);
        }

        return fieldNode;
    }

    modifyResult(value: any, root: any) {
        const func = new Function(
            'value',
            'root',
            'env',
            'return ' + (this.options as ModifyResultModifierFuncTransformConfig).func,
        );

        return func(value, root, process.env);
    }
}

export const createFuncModifier = (config: ModifyResultModifierOptions) => {
    return new FuncModifier(config);
};
