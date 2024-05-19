import { createAsModifier } from './modifiers/as';
import { createBaseModifier, type BaseModifier } from './modifiers/base';
import { createCaseModifier } from './modifiers/case';
import { createDatetimeModifier } from './modifiers/datetime';
import { createFuncModifier } from './modifiers/func';
import { createMaskModifier } from './modifiers/mask';
import { createReplaceModifier } from './modifiers/replace';
import {
    type ModifyResultModifierAsTransformConfig,
    type ModifyResultModifierCaseTransformConfig,
    type ModifyResultModifierDateTimeTransformConfig,
    type ModifyResultModifierFuncTransformConfig,
    type ModifyResultModifierMaskTransformConfig,
    type ModifyResultModifierOptions,
    type ModifyResultModifierReplaceTransformConfig,
    type ModifyResultModifiersTransformConfig,
} from './types';

export const createModifier = (
    modifier: ModifyResultModifiersTransformConfig,
    config: ModifyResultModifierOptions,
): BaseModifier => {
    if ((modifier as ModifyResultModifierAsTransformConfig).as) {
        return createAsModifier(config);
    }

    if ((modifier as ModifyResultModifierFuncTransformConfig).func) {
        return createFuncModifier(config);
    }

    if ((modifier as ModifyResultModifierMaskTransformConfig).mask) {
        return createMaskModifier(config);
    }

    if ((modifier as ModifyResultModifierCaseTransformConfig).case) {
        return createCaseModifier(config);
    }

    if (
        (modifier as ModifyResultModifierReplaceTransformConfig).match &&
        (modifier as ModifyResultModifierReplaceTransformConfig).result
    ) {
        return createReplaceModifier(config);
    }

    if ((modifier as ModifyResultModifierDateTimeTransformConfig).to) {
        return createDatetimeModifier(config);
    }

    return createBaseModifier(config);
};
