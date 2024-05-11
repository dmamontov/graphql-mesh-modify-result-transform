import {
    GraphQLString,
    isObjectType,
    isScalarType,
    type FieldNode,
    type GraphQLFieldConfig,
    type GraphQLSchema,
} from 'graphql';
import { GraphQLDateTime, GraphQLTimestamp } from 'graphql-scalars';
import moment, { type DurationInputArg2 } from 'moment';
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

        if (options.dateTime?.to) {
            switch (options.dateTime.to) {
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
        this.isGoogleProtobufTimestamp =
            isObjectType(fieldConfig.type) &&
            (fieldConfig.type as any).name.toLowerCase().includes('google') &&
            (fieldConfig.type as any).name.toLowerCase().includes('protobuf') &&
            (fieldConfig.type as any).name.toLowerCase().includes('timestamp');

        if (!isScalarType(fieldConfig.type) && !this.isGoogleProtobufTimestamp) {
            throw new TypeError(
                'Datetime modifier only supports scalar and google.protobuf.timestamp types.',
            );
        }

        return {
            ...fieldConfig,
            type: this.asType || fieldConfig.type,
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

    modifyResult(value: any) {
        const options = this.options as ModifyResultModifierDateTimeTransformConfig;

        if (!options.dateTime?.to) {
            return value;
        }

        let dateTimeMoment;
        if (this.isGoogleProtobufTimestamp && typeof value === 'object' && value?.seconds) {
            dateTimeMoment = moment(value.seconds * 1000 + (value.nanos || 0) / 1_000_000);
        } else if (isNaN(Number(value))) {
            dateTimeMoment = moment(value, options.dateTime?.from);
        } else {
            dateTimeMoment = moment.unix(Number(value));
        }

        if (!dateTimeMoment.isValid()) {
            return value;
        }

        if (options.dateTime?.modify?.includes(' ')) {
            let amount: string | number;
            let unit: string;
            [amount, unit] = options.dateTime.modify.split(' ');

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

        switch (options.dateTime.to) {
            case DefaultToFormat.Utc: {
                return dateTimeMoment.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            }
            case DefaultToFormat.Timestamp: {
                return dateTimeMoment.unix();
            }
            default: {
                return dateTimeMoment.format(options.dateTime.to);
            }
        }
    }
}

export const createDatetimeModifier = (config: ModifyResultModifierOptions) => {
    return new DatetimeModifier(config);
};
