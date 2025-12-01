const itemService = require('../services/itemService')

async function getAllItems(req, res) {
  try {
    const items = await itemService.fetchFromReplicaOrError()
    return res.json({ data: items, source: 'replica' })
  } catch (err) {
    // error message from service will describe the situation
    return res.status(500).json({ error: err.message || 'cannot read database replica' })
  }
}

module.exports = { getAllItems }
