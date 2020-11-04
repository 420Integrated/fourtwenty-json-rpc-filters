const test = require('tape')
const fourtwentyUtil = require('fourtwentyjs-util')
const {
  createTestSetup,
  asyncTest,
  deployLogEchoContract,
} = require('./util')

test('LogFilter - basic', asyncTest(async (t) => {

  const tools = createTestSetup()
  const fourtwenty = tools.query

  // deploy log-echo contract
  const coinbase = await fourtwenty.coinbase()
  const { contractAddress } = await deployLogEchoContract({ tools, from: coinbase })
  t.ok(contractAddress, 'got deployed contract address')

  // create filter
  const blockNumber = (await fourtwenty.blockNumber()).toNumber()
  const targetTopic = '0xaabbcce106361d4f6cd9098051596d565c1dbf7bc20b4c3acb3aaa4204aabbcc'
  const filterParams = { address: contractAddress, topics: [targetTopic], fromBlock: blockNumber, toBlock: 'latest' }
  const filterId = fourtwentyUtil.intToHex((await fourtwenty.newFilter(filterParams)).toNumber())
  t.ok(filterId, `got filter id: ${filterId} (${typeof filterId})`)

  // trigger filter
  const triggeringTxHash = await fourtwenty.sendTransaction({ from: coinbase, to: contractAddress, data: targetTopic })
  await tools.trackNextBlock()
  // check filter
  const filterChanges = await fourtwenty.getFilterChanges(filterId)
  t.equal(filterChanges.length, 1, 'only one matched filter')
  const matchingFilter = filterChanges[0]
  t.equal(matchingFilter.transactionHash, triggeringTxHash, 'tx hash should match')
  t.equal(matchingFilter.topics.length, 1, 'emitted a single log topic')
  const matchedTopic = matchingFilter.topics[0]
  t.equal(matchedTopic, targetTopic, 'topic matches expected')

  await fourtwenty.uninstallFilter(filterId)
}))

test('LogFilter - multiple blocks', asyncTest(async (t) => {

  const tools = createTestSetup()
  const fourtwenty = tools.query

  // deploy log-echo contract
  const coinbase = await fourtwenty.coinbase()
  const { contractAddress } = await deployLogEchoContract({ tools, from: coinbase })
  t.ok(contractAddress, 'got deployed contract address')

  // create filter
  const blockNumber = (await fourtwenty.blockNumber()).toNumber()
  const targetTopic = '0x112233e106361d4f6cd9098051596d565c1dbf7bc20b4c3acb3aaa4204112233'
  const filterParams = { address: contractAddress, topics: [targetTopic], fromBlock: blockNumber, toBlock: 'latest' }
  const filterId = fourtwentyUtil.intToHex((await fourtwenty.newFilter(filterParams)).toNumber())
  t.ok(filterId, `got filter id: ${filterId} (${typeof filterId})`)

  // await multiple blocks
  await tools.forceNextBlock()
  await tools.trackNextBlock()
  await tools.forceNextBlock()
  await tools.trackNextBlock()
  await tools.forceNextBlock()
  await tools.trackNextBlock()

  // trigger filter
  const triggeringTxHash = await fourtwenty.sendTransaction({ from: coinbase, to: contractAddress, data: targetTopic })
  await tools.trackNextBlock()

  // await multiple blocks
  await tools.forceNextBlock()
  await tools.trackNextBlock()
  await tools.forceNextBlock()
  await tools.trackNextBlock()

  // check filter
  const filterChanges = await fourtwenty.getFilterChanges(filterId)
  t.equal(filterChanges.length, 1, 'only one matched filter')
  const matchingFilter = filterChanges[0]
  t.equal(matchingFilter.transactionHash, triggeringTxHash, 'tx hash should match')
  t.equal(matchingFilter.topics.length, 1, 'emitted a single log topic')
  const matchedTopic = matchingFilter.topics[0]
  t.equal(matchedTopic, targetTopic, 'topic matches expected')

  await fourtwenty.uninstallFilter(filterId)
}))

test('BlockFilter - basic', asyncTest(async (t) => {

  const tools = createTestSetup()
  const fourtwenty = tools.query

  // await first block
  await tools.trackNextBlock()

  // create filter
  const filterId = fourtwentyUtil.intToHex((await fourtwenty.newBlockFilter()).toNumber())
  t.ok(filterId, `got filter id: ${filterId} (${typeof filterId})`)

  // check filter
  const filterChanges1 = await fourtwenty.getFilterChanges(filterId)
  t.equal(filterChanges1.length, 0, 'no matched filters yet')

  // await one block
  await tools.forceNextBlock()
  await tools.trackNextBlock()

  // check filter
  const filterChanges2 = await fourtwenty.getFilterChanges(filterId)
  t.equal(filterChanges2.length, 1, 'only one matched filter')
  const matchingFilter1 = filterChanges2[0]
  t.equal(matchingFilter1.length, 2 + 32 * 2, 'result is correct length for block hash')
  // check filter
  const filterChanges3 = await fourtwenty.getFilterChanges(filterId)
  t.equal(filterChanges3.length, 0, 'matched filters reset')

  // await two blocks
  await tools.forceNextBlock()
  await tools.trackNextBlock()
  await tools.forceNextBlock()
  await tools.trackNextBlock()

  // check filter
  const filterChanges4 = await fourtwenty.getFilterChanges(filterId)
  t.equal(filterChanges4.length, 2, 'two matched filter')
  const matchingFilter2 = filterChanges4[0]
  const matchingFilter3 = filterChanges4[1]
  t.equal(matchingFilter2.length, 2 + 32 * 2, 'result is correct length for block hash')
  t.equal(matchingFilter3.length, 2 + 32 * 2, 'result is correct length for block hash')
  t.notEqual(matchingFilter2, matchingFilter3, 'hashes are different')

  await fourtwenty.uninstallFilter(filterId)
}))
