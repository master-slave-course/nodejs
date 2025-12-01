const { PrismaClient } = require('@prisma/client')
const { ReplicaLoadBalancer } = require('./replicaLoadBalancer')

// Create three Prisma clients each connecting to a different DB URL (master + two replicas)
const master = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
const replica1 = new PrismaClient({ datasources: { db: { url: process.env.REPLICA_1 } } })
const replica2 = new PrismaClient({ datasources: { db: { url: process.env.REPLICA_2 } } })

const replicas = [ { client: replica1, name: 'replica-1' }, { client: replica2, name: 'replica-2' }]

// create a replica load balancer with health checks
const replicaBalancer = new ReplicaLoadBalancer(replicas)

function getReplica() {
  const client = replicaBalancer.getReplica()
  return client
}

module.exports = { master, replica1, replica2, getReplica, replicaBalancer }
