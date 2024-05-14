import {
    GraphQLNonNull,
    GraphQLString,
    isNonNullType,
    isScalarType,
    type GraphQLFieldConfig,
} from 'graphql';
import {
    type ModifyResultModifierMaskTransformConfig,
    type ModifyResultModifierOptions,
} from '../types';
import { BaseModifier } from './base';
import Maskara from './libs/maskara';

export class MaskModifier extends BaseModifier {
    modifySchema(fieldConfig: GraphQLFieldConfig<any, any>) {
        const isNotNull = isNonNullType(fieldConfig.type);
        const originalType = isNotNull
            ? (fieldConfig.type as GraphQLNonNull<any>).ofType
            : fieldConfig.type;

        if (!isScalarType(originalType)) {
            throw new TypeError('Mask modifier only supports scalar types.');
        }

        return {
            ...fieldConfig,
            type: isNotNull ? new GraphQLNonNull(GraphQLString) : GraphQLString,
        };
    }

    modifyResult(value: any, _root: any) {
        return Maskara.apply(
            value.toString(),
            (this.options as ModifyResultModifierMaskTransformConfig).mask,
        );
    }
}

export const createMaskModifier = (config: ModifyResultModifierOptions) => {
    return new MaskModifier(config);
};
