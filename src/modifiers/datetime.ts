import {
    GraphQLNonNull,
    GraphQLString,
    isNonNullType,
    isObjectType,
    isScalarType,
    type FieldNode,
    type GraphQLFieldConfig,
    type GraphQLSchema,
} from 'graphql';
import { GraphQLDateTime, GraphQLTimestamp } from 'graphql-scalars';
import moment, { type DurationInputArg2 } from 'moment';
import { stringInterpolator } from '@graphql-mesh/string-interpolation';
import { addTypes, parseSelectionSet } from '@graphql-tools/utils';
import {
    DefaultToFormat,
    type ModifyResultModifierDateTimeTransformConfig,
    type ModifyResultModifierOptions,
} from '../types';
import { BaseModifier } from './base';

export class DatetimeModifier extends BaseModifier {
    protected asType?: any;
    protected isGoogleProtobufTimestamp: boolean = false;

    extendScheme(schema: GraphQLSchema) {
        const options = this.options as ModifyResultModifierDateTimeTransformConfig;
        let newSchema = schema;

        if (options.to) {
            switch (options.to) {
                case DefaultToFormat.Timestamp: {
                    this.asType = GraphQLTimestamp;
                    break;
                }
                case DefaultToFormat.Utc: {
                    this.asType = GraphQLDateTime;
                    break;
                }
                default: {
                    this.asType = GraphQLString;
                    break;
                }
            }
        }

        if (this.asType && !newSchema.getType(this.asType.name)) {
            newSchema = addTypes(newSchema, [this.asType]);
        }

        return newSchema;
    }

    modifySchema(fieldConfig: GraphQLFieldConfig<any, any>) {
        const isNotNull = isNonNullType(fieldConfig.type);
        const originalType = isNotNull
            ? (fieldConfig.type as GraphQLNonNull<any>).ofType
            : fieldConfig.type;

        this.isGoogleProtobufTimestamp =
            isObjectType(originalType) &&
            (originalType as any).name.toLowerCase().includes('google') &&
            (originalType as any).name.toLowerCase().includes('protobuf') &&
            (originalType as any).name.toLowerCase().includes('timestamp');

        if (!isScalarType(originalType) && !this.isGoogleProtobufTimestamp) {
            throw new TypeError(
                'Datetime modifier only supports scalar and google.protobuf.timestamp types.',
            );
        }

        const newType = this.asType || originalType;

        return {
            ...fieldConfig,
            type: isNotNull ? new GraphQLNonNull(newType) : newType,
        };
    }

    modifyRequest(fieldNode: FieldNode) {
        if (this.isGoogleProtobufTimestamp) {
            return {
                ...fieldNode,
                selectionSet: parseSelectionSet(`{seconds, nanos}`),
            };
        }

        return fieldNode;
    }

    modifyResult(value: any, _root: any) {
        const options = this.options as ModifyResultModifierDateTimeTransformConfig;

        if (!options.to || !value) {
            return undefined;
        }

        let dateTimeMoment;
        if (typeof value === 'object' && value?.seconds) {
            dateTimeMoment = moment(value.seconds * 1000 + (value.nanos || 0) / 1_000_000);
        } else if (typeof value !== 'object') {
            if (/^-?\d+(\.\d+)?$/.test(value?.toString())) {
                dateTimeMoment = moment.unix(Number(value));
            } else {
                dateTimeMoment = moment(value, options.from);
            }
        }

        if (!dateTimeMoment?.isValid()) {
            return undefined;
        }

        let modify = options.modify;
        if (modify) {
            modify = stringInterpolator.parse(options.modify, { env: process.env });
        }

        if (modify?.includes(' ')) {
            let amount: string | number;
            let unit: string;
            [amount, unit] = modify.split(' ');

            amount = parseInt(amount);

            if (amount < 0) {
                dateTimeMoment = dateTimeMoment.subtract(
                    Math.abs(amount),
                    unit as DurationInputArg2,
                );
            } else {
                dateTimeMoment = dateTimeMoment.add(Math.abs(amount), unit as DurationInputArg2);
            }
        }

        switch (options.to) {
            case DefaultToFormat.Utc: {
                return dateTimeMoment.format('YYYY-MM-DDTHH:mm:ss[Z]');
            }
            case DefaultToFormat.Timestamp: {
                return dateTimeMoment.unix();
            }
            default: {
                return dateTimeMoment.format(options.to);
            }
        }
    }
}

export const createDatetimeModifier = (config: ModifyResultModifierOptions) => {
    return new DatetimeModifier(config);
};
