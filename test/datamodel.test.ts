import { DataModel } from "../src/datamodel";

const dataModel: DataModel = {
  collections: [
    {
      name: "Book",
      fields: [
        { name: "_id", type: { Named: "ID" } },
        { name: "_ts", type: { Named: "Int" } },
        { name: "title", type: { Named: "String" } },
        { name: "author", type: { Named: "Member" } }
      ]
    },
    {
      name: "Member",
      fields: [
        { name: "_id", type: { Named: "ID" } },
        { name: "_ts", type: { Named: "Int" } },
        { name: "name", type: { Named: "String" } },
        { name: "age", type: { Named: "Int" } },
        { name: "address", type: { Named: "Address" } },
        { name: "favorites", type: { List: { Named: "Book" } } }
      ]
    },
    {
      name: "Address",
      fields: [
        { name: "street", type: { Named: "String" } },
        { name: "city", type: { Named: "String" } },
        { name: "zip", type: { Named: "String" } }
      ],
      directives: [{ name: "embedded" }]
    },
    {
      name: "List & Null Test",
      fields: [
        { name: "Named", type: { Named: "Named" } },
        { name: "Named!", type: { NotNull: { Named: "Named" } } },
        { name: "[Named]", type: { List: { Named: "Named" } } },
        { name: "[Named!]", type: { List: { NotNull: { Named: "Named" } } } },
        { name: "[Named]!", type: { NotNull: { List: { Named: "Named" } } } },
        {
          name: "[Named!]!",
          type: { NotNull: { List: { NotNull: { Named: "Named" } } } }
        }
      ]
    }
  ],
  indexes: [
    {
      name: "allBooks",
      type: { List: { Named: "Book" } }
    }
  ]
};
