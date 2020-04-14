# awaitable-pool [![](https://github.com/thlorenz/awaitable-pool/workflows/Node%20CI/badge.svg?branch=master)](https://github.com/thlorenz/awaitable-pool/actions)

Object pool with an async checkout function.

## Example

```js
const { AwaitablePool } = require('awaitable-pool')

let count = 0
const poolSize = 2
const createObject = () => ({
  id: (++count).toString(),
})

const pool = new AwaitablePool(createObject, poolSize)

;(async () => {
  const item1 = await pool.checkout()
  console.log('checked out %s', item1.id)
  const item2 = await pool.checkout()
  console.log('checked out %s', item2.id)

  console.log('checking out another item')
  pool.checkout().then((item) => console.log('checked out %s', item.id))

  console.log('checking in 1')
  pool.checkin(item1)
})()
```

```
checked out 1
checked out 2
checking out another item
checking in 1
checked out 1
```

## Installation

    npm install awaitable-pool

## LICENSE

MIT
