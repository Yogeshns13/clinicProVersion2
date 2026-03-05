// Validation/slotValidator.js
const { body } = require('express-validator');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:00$/;

exports.addSlotValidatorRules = [
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').notEmpty().withMessage('BranchID is required').isInt({ min: 1 }),
    body('DoctorID').notEmpty().withMessage('DoctorID is required').isInt({ min: 1 }),
    body('SlotDate').notEmpty().withMessage('SlotDate is required').isDate({ format: 'YYYY-MM-DD' }),
    body('SlotTime').notEmpty().withMessage('SlotTime is required').matches(timeRegex).withMessage('SlotTime must be HH:MM:00')
    
];

exports.updateSlotValidatorRules = [
    body('SlotID').notEmpty().withMessage("SlotId is Required").isInt({ min: 1 }),
    body('AppointmentID').optional().isInt({ min: 1 }),
    body('IsBooked').notEmpty().isIn([0, 1]).withMessage("IsBooked is Required")
];

exports.deleteSlotValidatorRules = [
    body('SlotID').notEmpty().withMessage("Slot Id is required").isInt({ min: 1 })
];
 
exports.getSlotListValidatorRules = [
    body('Page').notEmpty().withMessage("page is required").isInt({ min: 1 }),
    body('PageSize').notEmpty().withMessage("pagesize is required").isInt({ min: 1, max: 200 }),
    body('SlotID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt(),
    body('BranchID').optional().isInt(),
    body('DoctorID').optional().isInt(),
    body('DoctorName').optional().isLength({ max: 100 }),
    body('SlotDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('FromSlotDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToSlotDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('IsBooked').optional().isIn([-1,0, 1, null]),
    body('Status').optional().isInt()
];

exports.generateSlotsValidatorRules = [
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').notEmpty().withMessage('BranchID is required').isInt({ min: 1 }),
    body('DaysAhead').notEmpty().withMessage('Days Ahead is required').isInt({ min: 0, max: 90 }),
    body('FromDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
];

exports.getAvailableSlotsValidatorRules = [
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').notEmpty().withMessage('BranchID is required').isInt({ min: 1 }),
    body('DoctorID').notEmpty().withMessage('DoctorID is required').isInt({ min: 1 }),
    body('SlotDate').notEmpty().withMessage('SlotDate is required').isDate({ format: 'YYYY-MM-DD' })
];