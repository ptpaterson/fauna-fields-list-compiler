# Compiler Details

Here are details of how the types get translated into queries

### Scalar Fields

Some basic objects are available to define scalar fields

```js
const MemberTypeDef = collectionType('Member', [
  { name: 'name', type: StringField },
  { name: 'age', type: NumberField }
  /*...*/
]);
```

The default compiler for scalars is a `q.Select` query, resulting in something like:

```js
q.Let(
  {
    ref: q.Ref(q.Collection('Member'), '1234'),
    instance: q.Get(q.Var('ref'))
  },
  {
    name: q.Select(['data','name'], q.Get(q.Var('instance')), null),
    age: q.Select(['data','age'], q.Get(q.Var('instance'), null),
  }
)
```

### Lists

Lists can be defined by wrapping a type with `listType`

```js
const MemberTypeDef = collectionType('Member', [
  /*...*/
  { name: 'tags', type: listType(StringField) }
  /*...*/
]);
```

### Embedded Objects

Embedded Objects are defined at the type level and used as a `NamedType` in a field definition

```js
const AddressTypeDef = embeddedType('Address', [
  { name: 'street', type: StringField },
  { name: 'city', type: StringField },
  { name: 'zip', type: StringField }
]);

const MemberTypeDef = collectionType('Member', [
  /*...*/
  { name: 'address', type: namedType('Address') }
  /*...*/
]);
```

The default compiler for embedded type fields use an efficient `q.Select` query, resulting in something like:

```js
q.Let(
  {
    ref: q.Ref(q.Collection('Member'), '1234'),
    instance: q.Get(q.Var('ref'))
  },
  {
    name: q.Select(['data', 'name'], q.Get(q.Var('instance')), null),
    /*...*/
    address: q.Let(
      {
        address: q.Select(['data', 'address'], q.Var('instance'))
      },
      q.If(q.Equals([q.Var('embedded'), null]), null, {
        street: q.Select(['data', 'address', 'street'], q.Var('instance')),
        city: q.Select(['data', 'address', 'city'], q.Var('instance')),
        zip: q.Select(['data', 'address', 'zip'], q.Var('instance'))
      })
    )
  }
);
q.Select(['data', 'name'], q.Get(q.Ref(q.Collection('Member'), '1234')));
```

### Collection References

The default compiler for a collection type expands an embedded field of `Ref`s. So, given the type definitions

```js
const BookTypeDef = collectionType('Book', [
  { name: 'title', type: StringField },
  { name: 'author', type: namedType('Member') }
]);
```

we'll end up with a query like

```js
q.Let(
  {
    ref: q.Ref(q.Collection('Book'), '5555'),
    instance: q.Get(q.Var('ref'))
  },
  {
    title: q.Select(['data','title'], q.Get(q.Var('instance')), null),
    author: q.Let(
      {
        ref: q.Select(['data','author'], q.Get(q.Var('instance'), null)),
        instance: q.Get(q.Var('ref'))
      },
      {
        name: q.Select(['data','name'], q.Get(q.Var('instance')), null),
        age: q.Select(['data','age'], q.Get(q.Var('instance'), null),
      }
    )
  }
)
```
