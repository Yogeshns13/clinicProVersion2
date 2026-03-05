// Validation/slotConfigValidator.js
const { body } = require('express-validator');

exports.addSlotConfigValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be valid'),

    body('DoctorID')
        .notEmpty().withMessage('DoctorID is required')
        .isInt({ min: 1 }).withMessage('DoctorID must be valid'),

    body('ShiftID')
        .notEmpty().withMessage('ShiftID is required')
        .isInt({ min: 1 }).withMessage('ShiftID must be valid'),

    body('Duration')
        .notEmpty().withMessage('Duration is required')
        .isIn([1, 2, 3]).withMessage('Duration must be 1=Daily, 2=Weekend, 3=Specific Date'),

    body('SlotDate')
        .if(body('Duration').equals('3'))
        .notEmpty().withMessage('SlotDate is required when Duration = 3 (Specific Date)')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('Invalid SlotDate format'),

    body('SlotInterval')
        .notEmpty().withMessage('SlotInterval is required')
        .isInt({ min: 5, max: 120 }).withMessage('SlotInterval must be 5–120 minutes'),

    body('CreateSlotDays')
        .notEmpty().withMessage('CreateSlotDays is required')
        .isInt({ min: 1, max: 365 }).withMessage('CreateSlotDays must be 1–365')

    
];

exports.deleteSlotConfigValidatorRules = [
    body('SlotConfigID')
        .notEmpty().withMessage('SlotConfigID is required')
        .isInt({ min: 1 }).withMessage('SlotConfigID must be valid')
];

exports.getSlotConfigListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1, max: 200 }),

    body('SlotConfigID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt(),
    body('BranchID').optional().isInt(),
    body('DoctorID').optional().isInt(),
    body('DoctorName').optional().isLength({ max: 100 }),
    body('ShiftID').optional().isInt(),
    body('Duration').optional().isIn([0,1, 2, 3]),
    body('Status').optional().isInt()
];