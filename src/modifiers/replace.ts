import { GraphQLString, isEnumType, isScalarType, type GraphQLFieldConfig } from 'graphql';
import { GraphQLNonNull, isNonNullType } from 'graphql/index';
import {
    type ModifyResultModifierOptions,
    type ModifyResultModifierReplaceTransformConfig,
} from '../types';
import { BaseModifier } from './base';

export class ReplaceModifier extends BaseModifier {
    protected asType: any = GraphQLString;

    modifySchema(fieldConfig: GraphQLFieldConfig<any, any>) {
        const isNotNull = isNonNullType(fieldConfig.type);
        const originalType = isNotNull
            ? (fieldConfig.type as GraphQLNonNull<any>).ofType
            : fieldConfig.type;

        if (!isScalarType(originalType) && !isEnumType(originalType)) {
            throw new TypeError('Replace modifier only supports scalar and enum types.');
        }

        return {
            ...fieldConfig,
            type: isNotNull ? new GraphQLNonNull(this.asType) : this.asType,
        };
    }

    modifyResult(value: any, _root: any) {
        const options = this.options as ModifyResultModifierReplaceTransformConfig;

        const match = value?.toString().match(new RegExp(options.match));
        if (!match) {
            return value?.toString();
        }

        return options.result.replaceAll(/\$(\d+)/g, (fullMatch: any, number: number) => {
            return match[number] || fullMatch;
        });
    }
}

export const createReplaceModifier = (config: ModifyResultModifierOptions) => {
    return new ReplaceModifier(config);
};
