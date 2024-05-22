import { type FieldNode } from 'graphql';
import { parseSelectionSet } from '@graphql-tools/utils';
import {
    type ModifyResultModifierFuncTransformConfig,
    type ModifyResultModifierOptions,
} from '../types';
import { BaseModifier } from './base';

export class FuncModifier extends BaseModifier {
    modifyRequest(fieldNode: FieldNode) {
        const options = this.options as ModifyResultModifierFuncTransformConfig;
        if (!options.selections) {
            return fieldNode;
        }

        const selections: FieldNode[] = parseSelectionSet(options.selections, { noLocation: true })
            ?.selections as FieldNode[];
        if (selections && selections.length > 0) {
            return [fieldNode, ...selections];
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
