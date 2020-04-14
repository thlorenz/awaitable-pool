const { AwaitablePool } = require('./')

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
