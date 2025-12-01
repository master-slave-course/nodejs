require('dotenv').config()
const { replica1, replica2, replicaBalancer } = require('./prismaClients')
const itemService = require('./services/itemService')

async function main() {
  console.log('Creating a new item (this goes to the master at 127.0.0.1:3307)')
  const item = await itemService.createItem({
    name: `Item-${Date.now()}`,
    price: 20000,
    stock: 5
  })

  console.log('Inserted item id:', item.id)

  console.log('Fetching items (reads may be routed to replicas 127.0.0.1:3308 or 127.0.0.1:3309)')
  // Reads are routed to replicas via itemService.fetchFromReplicaOrError()
  try {
    const items = await itemService.fetchFromReplicaOrError()
    console.log('Items:', items)
  } catch (err) {
    console.error('Failed to fetch from replica:', err.message)
  }
  console.log('Items:', items)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    // disconnect all clients
    try { await replicaBalancer.shutdown() } catch (e) {}
    try { await master.$disconnect() } catch (e) {}
    try { await replica1.$disconnect() } catch (e) {}
    try { await replica2.$disconnect() } catch (e) {}
  })
