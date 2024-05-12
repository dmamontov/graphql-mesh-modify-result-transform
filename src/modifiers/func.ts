import {
    GraphQLNonNull,
    isNonNullType,
    type GraphQLFieldConfig,
    type GraphQLSchema,
} from 'graphql';
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

    modifyResult(value: any) {
        const func = new Function(
            'value',
            'return ' + (this.options as ModifyResultModifierFuncTransformConfig).func,
        );

        return func(value);
    }
}

export const createFuncModifier = (config: ModifyResultModifierOptions) => {
    return new FuncModifier(config);
};
