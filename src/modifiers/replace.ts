import {
    GraphQLString,
    isEnumType,
    isScalarType,
    type GraphQLFieldConfig,
    type GraphQLSchema,
} from 'graphql';
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
        const type = this.asType || fieldConfig.type;
        if (
            (!isScalarType(fieldConfig.type) && !isEnumType(fieldConfig.type)) ||
            (!isScalarType(type) && !isEnumType(type))
        ) {
            throw new TypeError('Replace modifier only supports scalar and enum types.');
        }

        return {
            ...fieldConfig,
            type,
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
