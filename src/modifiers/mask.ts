import { GraphQLString, isScalarType, type GraphQLFieldConfig } from 'graphql';
import {
    type ModifyResultModifierMaskTransformConfig,
    type ModifyResultModifierOptions,
} from '../types';
import { BaseModifier } from './base';
import Maskara from './libs/maskara';

export class MaskModifier extends BaseModifier {
    modifySchema(fieldConfig: GraphQLFieldConfig<any, any>) {
        if (!isScalarType(fieldConfig.type)) {
            throw new TypeError('Mask modifier only supports scalar types.');
        }

        return {
            ...fieldConfig,
            type: GraphQLString,
        };
    }

    modifyResult(value: any) {
        return Maskara.apply(
            value.toString(),
            (this.options as ModifyResultModifierMaskTransformConfig).mask,
        );
    }
}

export const createMaskModifier = (config: ModifyResultModifierOptions) => {
    return new MaskModifier(config);
};
