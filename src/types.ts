import { type ImportFn } from '@graphql-mesh/types';
import { type BaseModifier } from './modifiers/base';

export interface ModifyResultTransformConfig {
    typeName: string;
    fields: string[];
    modifiers: ModifyResultModifiersTransformConfig[] | BaseModifier[];
}

export type ModifyResultModifiersTransformConfig =
    | ModifyResultModifierMaskTransformConfig
    | ModifyResultModifierReplaceTransformConfig
    | ModifyResultModifierDateTimeTransformConfig
    | ModifyResultModifierFuncTransformConfig;

export interface ModifyResultModifierMaskTransformConfig {
    mask: string;
}

export interface ModifyResultModifierReplaceTransformConfig {
    match: string;
    result: string;
    as?: string;
}

export interface ModifyResultModifierDateTimeTransformConfig {
    dateTime: ModifyResultModifierDateTimeDateTransformConfig;
}

export interface ModifyResultModifierFuncTransformConfig {
    func: string;
}

export interface ModifyResultModifierDateTimeDateTransformConfig {
    to: string | DefaultToFormat;
    from?: string;
    modify?: string;
}

export enum DefaultToFormat {
    Utc = 'utc',
    Timestamp = 'timestamp',
}

export interface ModifyResultTransformAlias {
    type: string;
    name: string;
    alias: string;
}

export interface ModifyResultModifierOptions {
    options: ModifyResultModifierMaskTransformConfig;
    baseDir: string;
    importFn: ImportFn;
}
