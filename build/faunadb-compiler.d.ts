declare type $FixMe = any
import { Expr } from 'faunadb'
declare type compiler = (selections: $FixMe) => Expr
interface FaunaDBCompilerOptions {
  typeDefs: $FixMe
}
export declare class FaunaDBCompiler {
  typeDefs: $FixMe
  constructor({ typeDefs }: FaunaDBCompilerOptions)
  getTypeSchema(typeName: string): any
  getFieldFromTypeSchema(typeSchema: $FixMe, fieldName: string): any
  getDefaultObjectCompiler(typeName: string, path: $FixMe): compiler
  getDefaultObjectListCompiler(typeName: string, path: $FixMe): compiler
  getCollectionCompiler(refQuery: Expr, typeName: string): compiler
  getDefaultCollectionCompiler(typeName: string, path: $FixMe): compiler
  getCollectionListCompiler(refsQuery: Expr, typeName: string): compiler
  getDefaultCollectionListCompiler(typeName: string, path: $FixMe): compiler
  getCompiler(typeName: string, fieldName: string, path: $FixMe): compiler
  expandSelection(typeName: string, selections: $FixMe, path?: $FixMe): Expr
}
export {}
