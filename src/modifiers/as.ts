import deepClean from 'clean-deep';
import {
    GraphQLBoolean,
    GraphQLFloat,
    GraphQLID,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLString,
    isNonNullType,
    isObjectType,
    type FieldNode,
    type GraphQLFieldConfig,
    type GraphQLScalarType,
    type GraphQLSchema,
    type SelectionSetNode,
} from 'graphql';
import {
    GraphQLAccountNumber,
    GraphQLBigInt,
    GraphQLByte,
    GraphQLCountryCode,
    GraphQLCuid,
    GraphQLCurrency,
    GraphQLDate,
    GraphQLDateTime,
    GraphQLDateTimeISO,
    GraphQLDeweyDecimal,
    GraphQLDID,
    GraphQLDuration,
    GraphQLEmailAddress,
    GraphQLGUID,
    GraphQLHexadecimal,
    GraphQLHexColorCode,
    GraphQLHSL,
    GraphQLHSLA,
    GraphQLIBAN,
    GraphQLIP,
    GraphQLIPCPatent,
    GraphQLIPv4,
    GraphQLIPv6,
    GraphQLISBN,
    GraphQLISO8601Duration,
    GraphQLJSON,
    GraphQLJSONObject,
    GraphQLJWT,
    GraphQLLatitude,
    GraphQLLCCSubclass,
    GraphQLLocalDate,
    GraphQLLocalDateTime,
    GraphQLLocale,
    GraphQLLocalEndTime,
    GraphQLLocalTime,
    GraphQLLong,
    GraphQLLongitude,
    GraphQLMAC,
    GraphQLNegativeFloat,
    GraphQLNegativeInt,
    GraphQLNonEmptyString,
    GraphQLNonNegativeFloat,
    GraphQLNonNegativeInt,
    GraphQLNonPositiveFloat,
    GraphQLNonPositiveInt,
    GraphQLObjectID,
    GraphQLPhoneNumber,
    GraphQLPort,
    GraphQLPositiveFloat,
    GraphQLPositiveInt,
    GraphQLPostalCode,
    GraphQLRGB,
    GraphQLRGBA,
    GraphQLRoutingNumber,
    GraphQLSafeInt,
    GraphQLSemVer,
    GraphQLSESSN,
    GraphQLTime,
    GraphQLTimestamp,
    GraphQLTimeZone,
    GraphQLUnsignedFloat,
    GraphQLUnsignedInt,
    GraphQLURL,
    GraphQLUSCurrency,
    GraphQLUtcOffset,
    GraphQLUUID,
    GraphQLVoid,
} from 'graphql-scalars';
import { addTypes } from '@graphql-tools/utils';
import {
    type ModifyResultAsTransformAlias,
    type ModifyResultModifierAsTransformConfig,
    type ModifyResultModifierOptions,
} from '../types';
import { createModifier } from '../utils';
import { BaseModifier } from './base';

export class AsModifier extends BaseModifier {
    protected scalars: GraphQLScalarType[] = [
        GraphQLInt,
        GraphQLFloat,
        GraphQLString,
        GraphQLBoolean,
        GraphQLID,
        GraphQLDate,
        GraphQLTime,
        GraphQLDateTime,
        GraphQLDateTimeISO,
        GraphQLTimestamp,
        GraphQLTimeZone,
        GraphQLUtcOffset,
        GraphQLDuration,
        GraphQLISO8601Duration,
        GraphQLLocalDate,
        GraphQLLocalTime,
        GraphQLLocalDateTime,
        GraphQLLocalEndTime,
        GraphQLEmailAddress,
        GraphQLNegativeFloat,
        GraphQLNegativeInt,
        GraphQLNonEmptyString,
        GraphQLNonNegativeFloat,
        GraphQLNonNegativeInt,
        GraphQLNonPositiveFloat,
        GraphQLNonPositiveInt,
        GraphQLPhoneNumber,
        GraphQLPositiveFloat,
        GraphQLPositiveInt,
        GraphQLPostalCode,
        GraphQLUnsignedFloat,
        GraphQLUnsignedInt,
        GraphQLURL,
        GraphQLBigInt,
        GraphQLByte,
        GraphQLLong,
        GraphQLSafeInt,
        GraphQLUUID,
        GraphQLGUID,
        GraphQLHexadecimal,
        GraphQLHexColorCode,
        GraphQLHSL,
        GraphQLHSLA,
        GraphQLIP,
        GraphQLIPv4,
        GraphQLIPv6,
        GraphQLISBN,
        GraphQLJWT,
        GraphQLLatitude,
        GraphQLLongitude,
        GraphQLMAC,
        GraphQLPort,
        GraphQLRGB,
        GraphQLRGBA,
        GraphQLUSCurrency,
        GraphQLCurrency,
        GraphQLJSON,
        GraphQLJSONObject,
        GraphQLIBAN,
        GraphQLObjectID,
        GraphQLVoid,
        GraphQLDID,
        GraphQLCountryCode,
        GraphQLLocale,
        GraphQLRoutingNumber,
        GraphQLAccountNumber,
        GraphQLCuid,
        GraphQLSemVer,
        GraphQLSESSN,
        GraphQLDeweyDecimal,
        GraphQLLCCSubclass,
        GraphQLIPCPatent,
    ];

    protected asType?: any;
    protected isList: boolean = false;

    protected rootAlias: ModifyResultAsTransformAlias;
    protected aliases: ModifyResultAsTransformAlias[] = [];

    extendScheme(schema: GraphQLSchema) {
        let type = (this.options as ModifyResultModifierAsTransformConfig).as;
        this.isList = type.startsWith('[') && type.endsWith(']');
        type = type.replace('[', '').replace(']', '');

        let newSchema = schema;

        this.asType = newSchema.getType(type);

        if (!this.asType) {
            this.asType = this.scalars.find(scalar => scalar.name === type);

            if (this.asType) {
                newSchema = addTypes(newSchema, [this.asType]);
            }
        }

        if (!this.asType) {
            throw new TypeError(`Type ${type} not found in schema.`);
        }

        return newSchema;
    }

    modifySchema(fieldConfig: GraphQLFieldConfig<any, any>) {
        const isNotNull = isNonNullType(fieldConfig.type);

        let type = this.asType;
        if (this.isList) {
            type = new GraphQLList(type);
        }

        return {
            ...fieldConfig,
            type: isNotNull ? new GraphQLNonNull(type) : type,
        };
    }

    modifyRequest(fieldNode: FieldNode) {
        this.rootAlias = {
            parentName: 'root',
            name: fieldNode.name.value,
            alias: fieldNode.alias?.value,
        };

        if (isObjectType(this.asType) && fieldNode.selectionSet) {
            this.generateAliases(fieldNode.selectionSet, fieldNode.name.value);
            delete (fieldNode as any).selectionSet;
        }

        return fieldNode;
    }

    modifyResult(value: any, _root: any): any {
        const subs = (this.options as ModifyResultModifierAsTransformConfig).sub || [];
        const modifiers: Record<string, BaseModifier[]> = {};

        for (const sub of subs) {
            if (sub.path && sub.modifiers) {
                const buildModifiers = sub.modifiers
                    .filter(modifier => !(modifier as ModifyResultModifierAsTransformConfig).as)
                    .map(modifier => {
                        return createModifier(modifier, {
                            baseDir: this.baseDir,
                            options: modifier,
                            importFn: this.importFn,
                        } as ModifyResultModifierOptions);
                    });

                if (typeof sub.path === 'string') {
                    sub.path = [sub.path];
                }

                for (const path of sub.path) {
                    modifiers[path] = buildModifiers;
                }
            }
        }

        const result = this.transformKeys(value, this.rootAlias, modifiers);

        if ((value !== null && typeof value === 'object') || Array.isArray(result)) {
            return deepClean(result);
        }
        return result;
    }

    private transformKeys(
        value: any,
        parent: ModifyResultAsTransformAlias,
        modifiers: Record<string, BaseModifier[]>,
        currentPath?: string,
    ): any {
        if (Array.isArray(value)) {
            return value.map(item => this.transformKeys(item, parent, modifiers, currentPath));
        }

        if (value !== null && typeof value === 'object') {
            const newObj: any = {};
            for (const key in value) {
                const aliasInfo = this.aliases.find(
                    alias => alias.name === key && alias.parentName === parent.name,
                );
                const newKey = aliasInfo ? aliasInfo.alias : key;
                newObj[newKey] = this.transformKeys(
                    value[key],
                    aliasInfo,
                    modifiers,
                    currentPath ? `${currentPath}.${key}` : key,
                );
            }

            return newObj;
        }

        let result = value;

        if (currentPath && Object.keys(modifiers).includes(currentPath)) {
            for (const modifier of modifiers[currentPath]) {
                result = modifier.modifyResult(result, {});
            }
        }

        return result;
    }

    private generateAliases(selectionSet: SelectionSetNode, parentName: string): void {
        for (const fieldNode of selectionSet.selections) {
            if ((fieldNode as FieldNode).alias?.value) {
                this.aliases.push({
                    parentName,
                    name: (fieldNode as FieldNode).name.value,
                    alias: (fieldNode as FieldNode).alias?.value,
                });
            }

            if ((fieldNode as FieldNode).selectionSet) {
                this.generateAliases(
                    (fieldNode as FieldNode).selectionSet,
                    (fieldNode as FieldNode).name.value,
                );
            }
        }
    }
}

export const createAsModifier = (config: ModifyResultModifierOptions) => {
    return new AsModifier(config);
};
