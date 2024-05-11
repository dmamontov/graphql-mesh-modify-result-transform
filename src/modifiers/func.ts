import {
    type ModifyResultModifierFuncTransformConfig,
    type ModifyResultModifierOptions,
} from '../types';
import { BaseModifier } from './base';

export class FuncModifier extends BaseModifier {
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
