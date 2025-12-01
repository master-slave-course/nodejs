const { master, getReplica, replicaBalancer } = require('../prismaClients')

async function fetchFromReplicaOrError() {
  const replica = getReplica()

  if (!replica) {
    // No healthy replicas reported by the load balancer
    throw new Error('cannot read database replica')
  }

  try {
    const items = await replica.item.findMany()
    return items
  } catch (err) {
    // Replica read attempt failed — return a reproducible error
    throw new Error('cannot read database replica')
  }
}

async function createItem(data) {
  return master.item.create({ data })
}

module.exports = { fetchFromReplicaOrError, createItem }
