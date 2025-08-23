const express = require('express')
const router = express.Router()
const Permission = require('../models/Permission')
const Role = require('../models/Role')

function cleanList(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
}

router.get('/', async (req, res) => {
  try {
    const { roleId } = req.query
    if (roleId) {
      const doc = await Permission.findOne({ roleId })
        .select('roleId roleName adGroups updatedAt createdAt')
        .lean()
      if (!doc) {
        return res.json({ roleId, roleName: '', adGroups: [] })
      }
      return res.json(doc)
    }
    const list = await Permission.find()
      .select('roleId roleName adGroups updatedAt createdAt')
      .lean()
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/:roleId', async (req, res) => {
  try {
    const doc = await Permission.findOne({ roleId: req.params.roleId })
      .select('roleId roleName adGroups updatedAt createdAt')
      .lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json(doc)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params
    const role = await Role.findById(roleId).lean()
    if (!role) return res.status(404).json({ error: 'Role not found' })

    const adGroups = cleanList(req.body.adGroups)

    const updated = await Permission.findOneAndUpdate(
      { roleId },
      {
        roleId,
        roleName: role.name,
        adGroups,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    )
      .select('roleId roleName adGroups updatedAt createdAt')
      .lean()

    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
