declare type $FixMe = any
export declare const namedType: (
  name: string
) => {
  kind: string
  name: string
}
export declare const listType: (
  type: $FixMe
) => {
  kind: string
  type: any
}
export declare const embeddedType: (
  name: string,
  fields: $FixMe
) => {
  kind: string
  name: string
  fields: any
}
export declare const collectionType: (
  name: string,
  fields: $FixMe
) => {
  kind: string
  name: string
  fields: any
}
export declare const StringField: {
  kind: string
  name: string
}
export declare const NumberField: {
  kind: string
  name: string
}
export {}
