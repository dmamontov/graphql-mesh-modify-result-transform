# Modify Result Transform for GraphQL Mesh

Modify Result Transform - is a transform for GraphQL Mesh that allows you to modify the responses of GraphQL queries. This transform provides various modifiers to alter data in responses, which can be useful for data masking, text replacement, date and time transformation, or executing custom JavaScript functions for dynamic data handling.

## Installation

Before you can use the Modify Result Transform, you need to install it along with GraphQL Mesh if you haven't already done so. You can install these using npm or yarn.

```bash
npm install @dmamontov/graphql-mesh-modify-result-transform
```

or

```bash
yarn add @dmamontov/graphql-mesh-modify-result-transform
```

## Configuration

### Modifying tsconfig.json

To make TypeScript recognize the Modify Result Transform, you need to add an alias in your tsconfig.json.

Add the following paths configuration under the compilerOptions in your tsconfig.json file:

```json
{
  "compilerOptions": {
    "paths": {
       "modify-result": ["./node_modules/@dmamontov/graphql-mesh-modify-result-transform"]
    }
  }
}
```

### Adding the Transform to GraphQL Mesh

You need to include the Modify Result Transform in your GraphQL Mesh configuration file (usually .meshrc.yaml). Below is an example configuration that demonstrates how to use this transform:

```yaml
transforms:
  - modifyResult:
      - typeName: Order
        fields: [ status_code ]
        modifiers:
          - match: "^(DELIVERED|CANCELED|COMPLETED)$"
            result: "STATUS_CODE_$1"
            as: status_code_enum
      - typeName: Order
        fields: [ created_at ]
        modifiers:
          - dateTime:
              to: timestamp
              modify: '-3 hours'
      - typeName: Order
        fields: [ comment ]
        modifiers:
          - func: "value.trim()"
      - typeName: Order
        fields: [ card ]
        modifiers:
          - mask: "0000 **** **** 0000"
```

## Conclusion

Remember, always test your configurations in a development environment before applying them in production to ensure that everything works as expected.