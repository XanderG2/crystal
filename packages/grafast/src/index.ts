import debugFactory from "debug";

import { crystalPrint } from "./crystalPrint.js";
import { exportAsMany } from "./exportAs.js";
import {
  CrystalPlans,
  EnumPlans,
  FieldPlans,
  InputObjectPlans,
  InterfaceOrUnionPlans,
  makeCrystalSchema,
  ObjectPlans,
  ScalarPlans,
} from "./makeCrystalSchema.js";
import { PrintPlanGraphOptions } from "./mermaid.js";

// TODO: doing this here feels "naughty".
debugFactory.formatters.c = crystalPrint;

import { defer, Deferred } from "./deferred.js";
// Handy for debugging
import { isDev, noop } from "./dev.js";
import { OperationPlan } from "./engine/OperationPlan.js";
import { CrystalError, isCrystalError } from "./error.js";
import { execute, GrafastExecuteOptions } from "./execute.js";
import { grafastGraphql, grafastGraphqlSync } from "./grafastGraphql.js";
import { InputStep } from "./input.js";
import {
  $$bypassGraphQL,
  $$data,
  $$eventEmitter,
  $$extensions,
  $$idempotent,
  $$verbatim,
  ArgumentApplyPlanResolver,
  ArgumentInputPlanResolver,
  BaseEventMap,
  BaseGraphQLArguments,
  BaseGraphQLContext,
  BaseGraphQLRootValue,
  BaseGraphQLVariables,
  CrystalResultsList,
  CrystalResultStreamList,
  CrystalSubscriber,
  CrystalValuesList,
  EnumValueApplyPlanResolver,
  EventCallback,
  EventMapKey,
  ExecutionEventEmitter,
  ExecutionEventMap,
  ExecutionExtra,
  FieldArgs,
  FieldInfo,
  FieldPlanResolver,
  GrafastArgumentExtensions,
  GrafastEnumValueExtensions,
  GrafastFieldExtensions,
  GrafastInputFieldExtensions,
  GrafastObjectTypeExtensions,
  GraphileArgumentConfig,
  GraphileFieldConfig,
  GraphileFieldConfigArgumentMap,
  GraphileInputFieldConfig,
  InputObjectFieldApplyPlanResolver,
  InputObjectFieldInputPlanResolver,
  InputObjectTypeInputPlanResolver,
  NodeIdCodec,
  NodeIdHandler,
  OutputPlanForType,
  PolymorphicData,
  PromiseOrDirect,
  ScalarPlanResolver,
  StepOptimizeOptions,
  StepStreamOptions,
  TypedEventEmitter,
} from "./interfaces.js";
import { polymorphicWrap, resolveType } from "./polymorphic.js";
import {
  assertListCapableStep,
  BaseStep,
  ExecutableStep,
  isExecutableStep,
  isListCapableStep,
  isModifierStep,
  isObjectLikeStep,
  isStreamableStep,
  ListCapableStep,
  ModifierStep,
  ObjectLikeStep,
  PolymorphicStep,
  StreamableStep,
} from "./step.js";
import {
  __InputListStep,
  __InputObjectStep,
  __InputStaticLeafStep,
  __ItemStep,
  __ListTransformStep,
  __TrackedObjectStep,
  __ValueStep,
  access,
  AccessStep,
  ActualKeyByDesiredKey,
  connection,
  ConnectionCapableStep,
  ConnectionStep,
  constant,
  ConstantStep,
  context,
  debugPlans,
  each,
  EdgeCapableStep,
  EdgeStep,
  error,
  ErrorStep,
  filter,
  FilterPlanMemo,
  first,
  FirstStep,
  GraphQLItemHandler,
  graphqlItemHandler,
  GraphQLPolymorphicUnwrap,
  graphqlPolymorphicUnwrap,
  graphqlResolver,
  GraphQLResolverStep,
  groupBy,
  GroupByPlanMemo,
  lambda,
  LambdaStep,
  last,
  LastStep,
  list,
  listen,
  ListenStep,
  ListStep,
  listTransform,
  ListTransformItemPlanCallback,
  ListTransformOptions,
  ListTransformReduce,
  makeMapper,
  makeResolveInfo,
  map,
  MapStep,
  node,
  NodeStep,
  object,
  ObjectPlanMeta,
  ObjectStep,
  operationPlan,
  PageInfoCapableStep,
  partitionByIndex,
  reverse,
  reverseArray,
  ReverseStep,
  setter,
  SetterCapableStep,
  SetterStep,
  specFromNodeId,
} from "./steps/index.js";
import { stringifyPayload } from "./stringifyPayload.js";
import { stripAnsi } from "./stripAnsi.js";
import { subscribe } from "./subscribe.js";
import {
  arrayOfLength,
  arraysMatch,
  getEnumValueConfig,
  GraphileInputFieldConfigMap,
  GraphileInputObjectType,
  GraphileObjectType,
  inputObjectFieldSpec,
  InputObjectTypeSpec,
  isPromiseLike,
  newGraphileFieldConfigBuilder,
  newInputObjectTypeBuilder,
  newObjectTypeBuilder,
  objectFieldSpec,
  objectSpec,
  ObjectTypeFields,
  ObjectTypeSpec,
  stepADependsOnStepB,
  stepAMayDependOnStepB,
  stepsAreInSamePhase,
} from "./utils.js";

export { isAsyncIterable } from "iterall";
export {
  __InputListStep,
  __InputObjectStep,
  __InputStaticLeafStep,
  __ItemStep,
  __ListTransformStep,
  __TrackedObjectStep,
  __ValueStep,
  $$bypassGraphQL,
  $$data,
  $$eventEmitter,
  $$extensions,
  $$idempotent,
  $$verbatim,
  access,
  AccessStep,
  ActualKeyByDesiredKey,
  ArgumentApplyPlanResolver,
  ArgumentInputPlanResolver,
  arrayOfLength,
  arraysMatch,
  assertListCapableStep,
  BaseEventMap,
  BaseGraphQLArguments,
  BaseGraphQLContext,
  BaseGraphQLRootValue,
  BaseGraphQLVariables,
  BaseStep,
  connection,
  ConnectionCapableStep,
  ConnectionStep,
  constant,
  ConstantStep,
  context,
  CrystalError,
  CrystalPlans,
  crystalPrint,
  CrystalResultsList,
  CrystalResultStreamList,
  CrystalSubscriber,
  CrystalValuesList,
  debugPlans,
  defer,
  Deferred,
  each,
  EdgeCapableStep,
  EdgeStep,
  EnumPlans,
  EnumValueApplyPlanResolver,
  error,
  ErrorStep,
  EventCallback,
  EventMapKey,
  ExecutableStep,
  execute,
  ExecutionEventEmitter,
  ExecutionEventMap,
  ExecutionExtra,
  FieldArgs,
  FieldInfo,
  FieldPlanResolver,
  FieldPlans,
  filter,
  FilterPlanMemo,
  first,
  FirstStep,
  getEnumValueConfig,
  GrafastArgumentExtensions,
  GrafastEnumValueExtensions,
  GrafastExecuteOptions,
  GrafastFieldExtensions,
  grafastGraphql,
  grafastGraphqlSync,
  GrafastInputFieldExtensions,
  GrafastObjectTypeExtensions,
  GraphileArgumentConfig,
  GraphileFieldConfig,
  GraphileFieldConfigArgumentMap,
  GraphileInputFieldConfig,
  GraphileInputFieldConfigMap,
  GraphileInputObjectType,
  GraphileObjectType,
  GraphQLItemHandler,
  graphqlItemHandler,
  GraphQLPolymorphicUnwrap,
  graphqlPolymorphicUnwrap,
  graphqlResolver,
  GraphQLResolverStep,
  groupBy,
  GroupByPlanMemo,
  InputObjectFieldApplyPlanResolver,
  InputObjectFieldInputPlanResolver,
  inputObjectFieldSpec,
  InputObjectPlans,
  InputObjectTypeInputPlanResolver,
  InputObjectTypeSpec,
  InputStep,
  InterfaceOrUnionPlans,
  isCrystalError,
  isDev,
  isExecutableStep,
  isListCapableStep,
  isModifierStep,
  isObjectLikeStep,
  isPromiseLike,
  isStreamableStep,
  lambda,
  LambdaStep,
  last,
  LastStep,
  list,
  ListCapableStep,
  listen,
  ListenStep,
  ListStep,
  listTransform,
  ListTransformItemPlanCallback,
  ListTransformOptions,
  ListTransformReduce,
  makeCrystalSchema,
  makeMapper,
  makeResolveInfo,
  map,
  MapStep,
  ModifierStep,
  newGraphileFieldConfigBuilder,
  newInputObjectTypeBuilder,
  newObjectTypeBuilder,
  node,
  NodeIdCodec,
  NodeIdHandler,
  NodeStep,
  noop,
  object,
  objectFieldSpec,
  ObjectLikeStep,
  ObjectPlanMeta,
  ObjectPlans,
  objectSpec,
  ObjectStep,
  ObjectTypeFields,
  ObjectTypeSpec,
  OperationPlan,
  operationPlan,
  OutputPlanForType,
  PageInfoCapableStep,
  partitionByIndex,
  PolymorphicData,
  PolymorphicStep,
  polymorphicWrap,
  PrintPlanGraphOptions,
  PromiseOrDirect,
  resolveType,
  reverse,
  reverseArray,
  ReverseStep,
  ScalarPlanResolver,
  ScalarPlans,
  setter,
  SetterCapableStep,
  SetterStep,
  specFromNodeId,
  stepADependsOnStepB,
  stepAMayDependOnStepB,
  StepOptimizeOptions,
  stepsAreInSamePhase,
  StepStreamOptions,
  StreamableStep,
  stringifyPayload,
  stripAnsi,
  subscribe,
  TypedEventEmitter,
};

exportAsMany({
  crystalPrint,
  makeCrystalSchema,
  OperationPlan,
  defer,
  execute,
  grafastGraphql,
  grafastGraphqlSync,
  subscribe,
  __InputListStep,
  stringifyPayload,
  __InputObjectStep,
  __InputStaticLeafStep,
  assertListCapableStep,
  isExecutableStep,
  isListCapableStep,
  isModifierStep,
  isObjectLikeStep,
  isStreamableStep,
  __ItemStep,
  __ListTransformStep,
  __TrackedObjectStep,
  __ValueStep,
  access,
  AccessStep,
  operationPlan,
  connection,
  ConnectionStep,
  constant,
  ConstantStep,
  context,
  isCrystalError,
  debugPlans,
  each,
  error,
  ErrorStep,
  groupBy,
  filter,
  partitionByIndex,
  listTransform,
  first,
  node,
  specFromNodeId,
  graphqlResolver,
  GraphQLResolverStep,
  GraphQLItemHandler,
  graphqlItemHandler,
  graphqlPolymorphicUnwrap,
  makeResolveInfo,
  GraphQLPolymorphicUnwrap,
  NodeStep,
  FirstStep,
  last,
  LastStep,
  lambda,
  LambdaStep,
  list,
  ListStep,
  makeMapper,
  map,
  MapStep,
  object,
  ObjectStep,
  reverse,
  reverseArray,
  ReverseStep,
  setter,
  SetterStep,
  listen,
  ListenStep,
  polymorphicWrap,
  resolveType,
  stripAnsi,
  arraysMatch,
  inputObjectFieldSpec,
  newGraphileFieldConfigBuilder,
  newInputObjectTypeBuilder,
  newObjectTypeBuilder,
  objectFieldSpec,
  objectSpec,
  arrayOfLength,
  stepADependsOnStepB,
  stepAMayDependOnStepB,
  stepsAreInSamePhase,
  isPromiseLike,
  isDev,
  noop,
  getEnumValueConfig,
});
