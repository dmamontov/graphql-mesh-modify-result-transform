import { type ImportFn } from '@graphql-mesh/types';
import { type BaseModifier } from './modifiers/base';

export interface ModifyResultTransformConfig {
    typeName: string;
    fields: string[];
    modifiers: ModifyResultModifiersTransformConfig[] | BaseModifier[];
}

export type ModifyResultModifiersTransformConfig =
    | ModifyResultModifierAsTransformConfig
    | ModifyResultModifierMaskTransformConfig
    | ModifyResultModifierReplaceTransformConfig
    | ModifyResultModifierDateTimeTransformConfig
    | ModifyResultModifierFuncTransformConfig
    | ModifyResultModifierCaseTransformConfig;

export interface ModifyResultModifierAsTransformConfig {
    as: string;
}

export interface ModifyResultModifierMaskTransformConfig {
    mask: string;
}

export interface ModifyResultModifierReplaceTransformConfig {
    match: string;
    result: string;
}

export interface ModifyResultModifierDateTimeTransformConfig {
    to: string | DefaultToFormat;
    from?: string;
    modify?: string;
}

export interface ModifyResultModifierFuncTransformConfig {
    func: string;
    selections?: string;
}

export interface ModifyResultModifierCaseTransformConfig {
    case: Case;
    prefix?: string;
    suffix?: string;
}

export enum Case {
    UpperCase = 'upper',
    LowerCase = 'lower',
    CamelCase = 'camel',
    CapitalCase = 'capital',
    ConstantCase = 'constant',
    DotCase = 'dot',
    KebabCase = 'kebab',
    NoCase = 'no',
    PascalCase = 'pascal',
    PascalSnakeCase = 'pascalSnake',
    PathCase = 'path',
    SentenceCase = 'sentence',
    SnakeCase = 'snake',
    TrainCase = 'train',
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

export interface ModifyResultAsTransformAlias {
    parentName: string;
    name: string;
    alias: string;
}

export interface ModifyResultModifierOptions {
    options: ModifyResultModifierMaskTransformConfig;
    baseDir: string;
    importFn: ImportFn;
}
