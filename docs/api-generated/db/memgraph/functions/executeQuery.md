[**skynet**](../../../README.md)

***

[skynet](../../../README.md) / [db/memgraph](../README.md) / executeQuery

# Function: executeQuery()

> **executeQuery**\<`T`\>(`cypher`, `params`): `Promise`\<`T`[]\>

Defined in: [db/memgraph.ts:19](https://github.com/patgpt/patgpt-mcp/blob/24221bd2d5cfea455baecbf5a23ebf603f90c59d/src/db/memgraph.ts#L19)

Helper to execute a Cypher query with proper session management

## Type Parameters

### T

`T` = `any`

## Parameters

### cypher

`string`

### params

`Record`\<`string`, `any`\> = `{}`

## Returns

`Promise`\<`T`[]\>
