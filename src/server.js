require('dotenv').config()
const express = require('express')
const { master, replica1, replica2, replicaBalancer } = require('./prismaClients')
const itemsRouter = require('./routes/items')

const app = express()
app.use(express.json())

// API routes
app.use('/api/items', itemsRouter)

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...')
  try { await replicaBalancer.shutdown() } catch (e) {}
  try { await master.$disconnect() } catch (e) {}
  try { await replica1.$disconnect() } catch (e) {}
  try { await replica2.$disconnect() } catch (e) {}
  process.exit(0)
})
