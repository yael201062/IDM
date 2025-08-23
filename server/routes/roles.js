const express = require('express');
const Role = require('../models/Role');

const router = express.Router();

// GET /api/roles
router.get('/', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const q = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const roles = await Role.find(q).sort({ createdAt: -1 }).lean();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching roles', error: err.message });
  }
});

// POST /api/roles
router.post('/', async (req, res) => {
  try {
    const { name, usersCount = 0, department } = req.body;
    if (!name || !department) {
      return res.status(400).json({ message: 'name and department are required' });
    }
    const role = await Role.create({ name, usersCount, department });
    res.status(201).json(role);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Role name already exists' });
    }
    res.status(500).json({ message: 'Error creating role', error: err.message });
  }
});

// PUT /api/roles/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Role.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Role not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating role', error: err.message });
  }
});

// DELETE /api/roles/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Role.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Role not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting role', error: err.message });
  }
});

module.exports = router;
