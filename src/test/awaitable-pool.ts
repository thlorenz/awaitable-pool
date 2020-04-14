import test from 'tape'
import { AwaitablePool, ItemWithID } from '../awaitable-pool'

test('pool of size 2 requesting 3 items', async (t) => {
  let createdItems = 0
  function createItem(): ItemWithID {
    return { id: (++createdItems).toString() }
  }
  const pool = new AwaitablePool(createItem, 2)

  t.comment('--- trying to check in item that was never checked out ---')
  t.throws(
    () => pool.checkin({ id: 'fuck trump' }),
    /cannot check in item .+ never created nor checked out/i,
    'throws with error message explaining problem'
  )

  const item1 = await pool.checkout()
  const item2 = await pool.checkout()

  t.comment('--- checking out two items ---')
  t.equal(item1.id, '1', 'checks out item one')
  t.equal(item2.id, '2', 'checks out item two')

  t.equal(pool.itemsAvailable, 0, 'no items available when pool exhausted')
  t.equal(pool.itemsCreated, 2, 'created items are stored')
  t.equal(pool.checkoutsPending, 0, 'no checkouts pending')

  t.comment('--- checking out third item ---')
  let item3: ItemWithID | undefined
  let checkedInItem = false
  pool.checkout().then((item) => {
    item3 = item
    t.ok(checkedInItem, 'checkout completes when item is checked in')
    t.equal(item3, item1, 'checkout completes with checked in item')
    t.equal(
      pool.itemsAvailable,
      0,
      'no items available since pool exhausts immediately'
    )
    t.equal(pool.checkoutsPending, 0, 'no checkouts pending after checkout')

    t.comment('--- checking in second item ---')
    pool.checkin(item2)
    t.equal(
      pool.itemsAvailable,
      1,
      'one item becomes available after checkin with empty waitinglist'
    )

    t.comment('--- trying to check in second item again ---')
    t.throws(
      () => pool.checkin(item2),
      /cannot check in .+ not .+ checked out/i,
      'throws with error message explaining problem'
    )

    t.end()
  })

  t.equal(
    pool.checkoutsPending,
    1,
    'one checkout pending on checkout with exhausted pool'
  )
  setTimeout(() => {
    t.equal(item3, undefined, 'when pool exhausted checkout waits')
    t.comment('--- checking in first item ---')
    pool.checkin(item1)
    checkedInItem = true
  }, 40)
})
