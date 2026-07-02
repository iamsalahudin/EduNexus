const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const controller = require('../controllers/hostelController');
const {
  listHostelsSchema,
  createHostelSchema,
  updateHostelSchema,
  listRoomsSchema,
  createRoomSchema,
  updateRoomSchema,
  listResidentsSchema,
  createResidentSchema,
  updateResidentSchema,
  listFeesSchema,
  createFeeSchema,
  payFeeSchema
} = require('../validators/hostel');

router.use(requireAuth);

router.get('/hostels', validate(listHostelsSchema), controller.listHostels);
router.post('/hostels', requireRole('Admin', 'Principal'), validate(createHostelSchema), controller.createHostel);
router.patch('/hostels/:id', requireRole('Admin', 'Principal'), validate(updateHostelSchema), controller.updateHostel);
router.delete('/hostels/:id', requireRole('Admin', 'Principal'), controller.deleteHostel);

router.get('/rooms', validate(listRoomsSchema), controller.listRooms);
router.post('/rooms', requireRole('Admin', 'Principal'), validate(createRoomSchema), controller.createRoom);
router.patch('/rooms/:id', requireRole('Admin', 'Principal'), validate(updateRoomSchema), controller.updateRoom);
router.delete('/rooms/:id', requireRole('Admin', 'Principal'), controller.deleteRoom);

router.get('/residents', validate(listResidentsSchema), controller.listResidents);
router.get('/residents/:id', controller.getResident);
router.post('/residents', requireRole('Admin', 'Principal'), validate(createResidentSchema), controller.createResident);
router.patch('/residents/:id', requireRole('Admin', 'Principal'), validate(updateResidentSchema), controller.updateResident);
router.delete('/residents/:id', requireRole('Admin', 'Principal'), controller.deleteResident);

router.get('/fees', validate(listFeesSchema), controller.listFees);
router.post('/fees', requireRole('Admin', 'Principal'), validate(createFeeSchema), controller.createFee);
router.patch('/fees/:id/pay', requireRole('Admin', 'Principal'), validate(payFeeSchema), controller.payFee);

module.exports = router;
