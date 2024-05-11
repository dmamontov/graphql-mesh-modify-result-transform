import { Kind, type FieldNode, type GraphQLFieldConfig, type GraphQLSchema } from 'graphql';
import { type ImportFn } from '@graphql-mesh/types';
import {
    applyRequestTransforms,
    applyResultTransforms,
    applySchemaTransforms,
} from '@graphql-mesh/utils';
import {
    type DelegationContext,
    type SubschemaConfig,
    type Transform,
} from '@graphql-tools/delegate';
import { type ExecutionRequest, type ExecutionResult } from '@graphql-tools/utils';
import { TransformCompositeFields } from '@graphql-tools/wrap';
import { BaseModifier, createBaseModifier } from './modifiers/base';
import { createDatetimeModifier } from './modifiers/datetime';
import { createFuncModifier } from './modifiers/func';
import { createMaskModifier } from './modifiers/mask';
import { createReplaceModifier } from './modifiers/replace';
import {
    type ModifyResultModifierDateTimeTransformConfig,
    type ModifyResultModifierFuncTransformConfig,
    type ModifyResultModifierMaskTransformConfig,
    type ModifyResultModifierOptions,
    type ModifyResultModifierReplaceTransformConfig,
    type ModifyResultTransformAlias,
    type ModifyResultTransformConfig,
} from './types';

export default class ModifyResultTransform implements Transform {
    public noWrap: boolean = false;
    private readonly configs: ModifyResultTransformConfig[];
    private readonly aliases: ModifyResultTransformAlias[] = [];
    private readonly transformers: TransformCompositeFields[];

    constructor({
        baseDir,
        config,
        importFn,
    }: {
        baseDir: string;
        config: ModifyResultTransformConfig[];
        importFn: ImportFn;
    }) {
        this.configs = config.map((config: ModifyResultTransformConfig) => {
            return {
                ...config,
                modifiers: config.modifiers.map(modifier => {
                    const modifierConfig = {
                        baseDir,
                        options: modifier,
                        importFn,
                    } as ModifyResultModifierOptions;

                    if ((modifier as ModifyResultModifierFuncTransformConfig).func) {
                        return createFuncModifier(modifierConfig);
                    }

                    if ((modifier as ModifyResultModifierMaskTransformConfig).mask) {
                        return createMaskModifier(modifierConfig);
                    }

                    if (
                        (modifier as ModifyResultModifierReplaceTransformConfig).match &&
                        (modifier as ModifyResultModifierReplaceTransformConfig).result
                    ) {
                        return createReplaceModifier(modifierConfig);
                    }

                    if ((modifier as ModifyResultModifierDateTimeTransformConfig).dateTime) {
                        return createDatetimeModifier(modifierConfig);
                    }

                    return createBaseModifier(modifierConfig);
                }),
            };
        });

        this.transformers = [
            new TransformCompositeFields(
                (
                    typeName: string,
                    fieldName: string,
                    fieldConfig: GraphQLFieldConfig<any, any>,
                ): GraphQLFieldConfig<any, any> =>
                    this.modifySchema(typeName, fieldName, fieldConfig) as GraphQLFieldConfig<
                        any,
                        any
                    >,
                (typeName: string, fieldName: string, fieldNode: FieldNode): FieldNode =>
                    this.modifyRequest(typeName, fieldName, fieldNode),
                (value: any): any => this.modifyResult(value),
            ),
        ];
    }

    transformSchema(
        originalWrappingSchema: GraphQLSchema,
        subschemaConfig: SubschemaConfig,
        transformedSchema?: GraphQLSchema,
    ) {
        let newSchema = originalWrappingSchema;
        for (const config of this.configs) {
            for (const modifier of config.modifiers) {
                if (!(modifier instanceof BaseModifier)) {
                    continue;
                }

                newSchema = modifier.extendScheme(newSchema);
            }
        }

        return applySchemaTransforms(
            newSchema,
            // @ts-expect-error
            subschemaConfig,
            transformedSchema,
            this.transformers,
        );
    }

    public transformRequest(
        originalRequest: ExecutionRequest,
        delegationContext: DelegationContext,
        transformationContext: any,
    ): ExecutionRequest {
        return applyRequestTransforms(
            originalRequest,
            // @ts-expect-error
            delegationContext,
            transformationContext,
            this.transformers,
        );
    }

    transformResult(
        originalResult: ExecutionResult,
        delegationContext: DelegationContext,
        transformationContext: any,
    ) {
        return applyResultTransforms(
            originalResult,
            // @ts-expect-error
            delegationContext,
            transformationContext,
            this.transformers,
        );
    }

    private modifySchema(
        typeName: string,
        fieldName: string,
        fieldConfig: GraphQLFieldConfig<any, any>,
    ): any {
        const config = this.getConfig(typeName, fieldName);
        if (!config) {
            return fieldConfig;
        }

        let newFieldConfig = fieldConfig;
        for (const modifier of config.modifiers) {
            if (!(modifier instanceof BaseModifier)) {
                continue;
            }

            newFieldConfig = modifier.modifySchema(newFieldConfig);
        }

        return newFieldConfig;
    }

    private modifyRequest(typeName: string, fieldName: string, fieldNode: FieldNode): any {
        const config = this.getConfig(typeName, fieldName);
        if (!config) {
            return fieldNode;
        }

        if (
            fieldNode.kind === Kind.FIELD &&
            !this.aliases.find(alias => alias.type === typeName && alias.name === fieldName)
        ) {
            this.aliases.push({
                type: typeName,
                name: fieldName,
                alias: fieldNode?.alias ? fieldNode.alias.value : fieldName,
            });
        }

        let newFieldNode = fieldNode;
        for (const modifier of config.modifiers) {
            if (!(modifier instanceof BaseModifier)) {
                continue;
            }

            newFieldNode = modifier.modifyRequest(newFieldNode);
        }

        return newFieldNode;
    }

    private modifyResult(value: any): any {
        if (!(typeof value === 'object') || !value?.__typename) {
            return value;
        }

        const types = this.configs.filter(config => config.typeName === value.__typename);

        if (types.length === 0) {
            return value;
        }

        for (const type of types) {
            for (const fieldName of type.fields) {
                let fieldNameOrAlias = fieldName;
                const alias = this.aliases.find(
                    aliasConfig =>
                        aliasConfig.type === value.__typename && aliasConfig.name === fieldName,
                );

                if (alias) {
                    fieldNameOrAlias = alias.alias;
                }

                if (value[fieldNameOrAlias]) {
                    for (const modifier of type.modifiers) {
                        if (!(modifier instanceof BaseModifier)) {
                            continue;
                        }

                        value[fieldNameOrAlias] = modifier.modifyResult(value[fieldNameOrAlias]);
                    }
                }
            }
        }

        return value;
    }

    private getConfig(
        typeName: string,
        fieldName: string,
    ): ModifyResultTransformConfig | undefined {
        return this.configs.find(
            config => config.typeName === typeName && config.fields.includes(fieldName),
        );
    }
}
