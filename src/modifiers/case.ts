import * as changeCase from 'change-case';
import {
    GraphQLNonNull,
    GraphQLString,
    isEnumType,
    isNonNullType,
    isScalarType,
    type GraphQLFieldConfig,
} from 'graphql';
import {
    Case,
    type ModifyResultModifierCaseTransformConfig,
    type ModifyResultModifierOptions,
} from '../types';
import { BaseModifier } from './base';

export class CaseModifier extends BaseModifier {
    protected asType = GraphQLString;

    modifySchema(fieldConfig: GraphQLFieldConfig<any, any>) {
        const isNotNull = isNonNullType(fieldConfig.type);
        const originalType = isNotNull
            ? (fieldConfig.type as GraphQLNonNull<any>).ofType
            : fieldConfig.type;

        if (!isScalarType(originalType) && !isEnumType(originalType)) {
            throw new TypeError('Case modifier only supports scalar and enum types.');
        }

        const newType = this.asType || originalType;

        return {
            ...fieldConfig,
            type: isNotNull ? new GraphQLNonNull(newType) : newType,
        };
    }

    modifyResult(value: any) {
        const options = this.options as ModifyResultModifierCaseTransformConfig;

        value = value.toString();

        switch (options.case) {
            case Case.UpperCase: {
                return this.wrap(value, options.prefix, options.suffix).toUpperCase();
            }
            case Case.LowerCase: {
                return this.wrap(value, options.prefix, options.suffix).toLowerCase();
            }
            default: {
                const caseKey = options.case + 'Case';
                if (Object.keys(changeCase).includes(caseKey)) {
                    // @ts-expect-error
                    return changeCase[caseKey](
                        this.wrap(value, options.prefix, options.suffix).toLowerCase(),
                    );
                }

                return this.wrap(value, options.prefix, options.suffix);
            }
        }
    }

    private wrap(value: string, prefix?: string, suffix?: string): string {
        return (prefix || '') + value + (suffix || '');
    }
}

export const createCaseModifier = (config: ModifyResultModifierOptions) => {
    return new CaseModifier(config);
};
