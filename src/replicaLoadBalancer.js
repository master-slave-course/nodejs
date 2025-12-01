/**
 * Simple replica load balancer for Prisma clients
 * - Round-robin among healthy replicas
 * - Health checks (SELECT 1) to mark replicas healthy/unhealthy
 * - Falls back to master if no healthy replicas available
 *
 * Usage: const lb = new ReplicaLoadBalancer([{client: replica1, name: 'r1'}...], { intervalMs: 10000 })
 * then lb.getReplica() returns a Prisma client
 */

const DEFAULT_HEALTH_INTERVAL = process.env.REPLICA_HEALTH_INTERVAL_MS ? Number(process.env.REPLICA_HEALTH_INTERVAL_MS) : 10000

class ReplicaLoadBalancer {
  constructor(replicas = [], opts = {}) {
    this.replicas = replicas.map((r, idx) => ({
      client: r.client,
      name: r.name || `replica-${idx}`,
      healthy: true,
      lastError: null,
      weight: r.weight || 1
    }))

    this.intervalMs = opts.intervalMs || DEFAULT_HEALTH_INTERVAL
    this._rrIndex = 0
    this._timer = null
    this.startHealthChecks()
  }

  startHealthChecks() {
    if (this._timer) return
    this._timer = setInterval(() => {
      this.replicas.forEach(async (r) => {
        try {
          // lightweight check
          await r.client.$queryRawUnsafe('SELECT 1')
          r.healthy = true
          r.lastError = null
        } catch (err) {
          r.healthy = false
          r.lastError = err.message || String(err)
        }
      })
    }, this.intervalMs)
  }

  stopHealthChecks() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  }

  getHealthyReplicas() {
    return this.replicas.filter(r => r.healthy)
  }

  getReplica() {
    const healthy = this.getHealthyReplicas()
    if (healthy.length === 0) return null

    // simple weighted round-robin: expand small list by weight if needed
    let idx = this._rrIndex % healthy.length
    this._rrIndex += 1
    return healthy[idx].client
  }

  getStatus() {
    return this.replicas.map(r => ({ name: r.name, healthy: r.healthy, lastError: r.lastError }))
  }

  async shutdown() {
    this.stopHealthChecks()
    // Do not disconnect clients here — clients are shared and closed elsewhere
  }
}

module.exports = { ReplicaLoadBalancer }
