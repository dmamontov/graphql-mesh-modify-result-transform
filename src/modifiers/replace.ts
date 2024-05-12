import {
    GraphQLString,
    isEnumType,
    isScalarType,
    type GraphQLFieldConfig,
    type GraphQLSchema,
} from 'graphql';
import { GraphQLNonNull, isNonNullType } from 'graphql/index';
import {
    type ModifyResultModifierOptions,
    type ModifyResultModifierReplaceTransformConfig,
} from '../types';
import { BaseModifier } from './base';

export class ReplaceModifier extends BaseModifier {
    protected asType?: any;

    extendScheme(schema: GraphQLSchema) {
        const options = this.options as ModifyResultModifierReplaceTransformConfig;

        this.asType = options.as ? schema.getType(options.as) : GraphQLString;

        return schema;
    }

    modifySchema(fieldConfig: GraphQLFieldConfig<any, any>) {
        const isNotNull = isNonNullType(fieldConfig.type);
        const originalType = isNotNull
            ? (fieldConfig.type as GraphQLNonNull<any>).ofType
            : fieldConfig.type;

        const newType = this.asType || originalType;
        if (
            (!isScalarType(originalType) && !isEnumType(originalType)) ||
            (!isScalarType(newType) && !isEnumType(newType))
        ) {
            throw new TypeError('Replace modifier only supports scalar and enum types.');
        }

        return {
            ...fieldConfig,
            type: isNotNull ? new GraphQLNonNull(newType) : newType,
        };
    }

    modifyResult(value: any) {
        const options = this.options as ModifyResultModifierReplaceTransformConfig;

        const match = value.match(new RegExp(options.match));
        if (!match) {
            return value;
        }

        return options.result.replaceAll(/\$(\d+)/g, (fullMatch: any, number: number) => {
            return match[number] || fullMatch;
        });
    }
}

export const createReplaceModifier = (config: ModifyResultModifierOptions) => {
    return new ReplaceModifier(config);
};
