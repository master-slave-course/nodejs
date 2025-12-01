const express = require('express')
const { getAllItems } = require('../controllers/itemsController')

const router = express.Router()

router.get('/', getAllItems)

module.exports = router
