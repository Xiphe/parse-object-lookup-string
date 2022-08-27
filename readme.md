# parse-object-lookup-string

Don't use this, use a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) when possible.

## Install

```bash
npm i parse-object-lookup-string
# yarn add parse-object-lookup-string
```

## Use

```ts
import parse from 'parse-object-lookup-string';

expect(parse('?.["123"].one?.[`\\``]')).toEqual([
  { key: '123', optional: true },
  { key: 'one', optional: false },
  { key: '`', optional: true },
]);
```
