import "./PgTablesPlugin";

import type {
  PgConditionPlan,
  PgSelectPlan,
  PgSelectSinglePlan,
  PgSourceColumn,
  PgSourceColumns,
  PgTypeCodec,
} from "@dataplan/pg";
import type { ConnectionPlan, InputPlan } from "graphile-crystal";
import { getEnumValueConfig } from "graphile-crystal";
import { EXPORTABLE } from "graphile-exporter";
import type { Plugin } from "graphile-plugin";
import type { GraphQLEnumType, GraphQLInputType } from "graphql";
import { inspect } from "util";

import { getBehavior } from "../behavior";
import { version } from "../index";

export const PgConnectionArgOrderByDefaultValuePlugin: Plugin = {
  name: "PgConnectionArgOrderByDefaultValuePlugin",
  description: "Sets the default 'orderBy' for a table",
  version: version,

  schema: {
    hooks: {
      GraphQLObjectType_fields_field_args(args, build, context) {
        const { extend, getTypeByName, inflection } = build;
        const {
          scope: { fieldName, isPgFieldConnection, pgSource },
          Self,
        } = context;

        if (!args.orderBy) {
          return args;
        }

        if (!isPgFieldConnection || !pgSource || !pgSource.codec.columns) {
          console.log("FAIL 1");
          return args;
        }

        const tableTypeName = inflection.tableType(pgSource.codec);
        const TableOrderByType = getTypeByName(
          inflection.orderByType(tableTypeName),
        ) as GraphQLEnumType;
        if (!TableOrderByType) {
          console.log("FAIL 2");
          return args;
        }

        const primaryKeyAsc = inflection.builtin("PRIMARY_KEY_ASC");
        const defaultValueEnum =
          TableOrderByType.getValues().find((v) => v.name === primaryKeyAsc) ||
          TableOrderByType.getValues()[0];
        if (!defaultValueEnum) {
          console.log("FAIL 3");
          return args;
        }

        return extend(
          args,
          {
            orderBy: extend(
              args.orderBy,
              {
                defaultValue: defaultValueEnum && [defaultValueEnum.value],
              },
              `Adding defaultValue to orderBy for field '${fieldName}' of '${Self.name}'`,
            ),
          },
          `Adding defaultValue to '${Self.name}.${fieldName}.orderBy'`,
        );
      },
    },
  },
};