// Validation/prescriptionDetailValidator.js
const { body } = require('express-validator');

exports.addPrescriptionDetailValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),

    body('PrescriptionID')
        .notEmpty().withMessage('PrescriptionID is required')
        .isInt({ min: 1 }).withMessage('Valid PrescriptionID required'),

    body('MedicineID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('MedicineID must be valid if provided'),

    body('MedicineName')
        .notEmpty().withMessage('MedicineName is required')
        .isLength({ max: 500 }).withMessage('MedicineName too long'),

    body('Form')
        .notEmpty().withMessage('Form is required')
        .isInt({ min: 1 }).withMessage('Valid Form ID required (Text Table #22)'),

    body('Strength')
        .optional()
        .isLength({ max: 50 }),

    body('Dosage')
        .optional()
        .isLength({ max: 100 }),

    body('Frequency')
        .optional()
        .isLength({ max: 500 }),

    body('Duration')
        .optional()
        .isLength({ max: 300 }),

    body('Route')
        .optional({ nullable: true })
        .isInt({ min: 1 }),

    body('FoodTiming')
        .optional({ nullable: true })
        .isInt({ min: 1 }),

    body('Instructions')
        .optional()
        .isLength({ max: 1000 }),

    body('Quantity')
        .notEmpty().withMessage('Quantity is required')
        .isDecimal().withMessage('Quantity must be a number')
        .custom(val => val > 0).withMessage('Quantity must be greater than 0'),

    body('RefillAllowed')
        .optional()
        .isIn([0, 1]).withMessage('RefillAllowed must be 0 or 1'),

    body('RefillCount')
        .optional()
        .isInt({ min: 0 }),

    body('StartDate')
        .optional({ nullable: true })
        .isDate(),

    body('EndDate')
        .optional({ nullable: true })
        .isDate()
];

exports.updatePrescriptionDetailValidatorRules = [
    body('PrescriptionDetailID')
        .notEmpty().withMessage('PrescriptionDetailID is required')
        .isInt({ min: 1 }).withMessage('Valid PrescriptionDetailID required'),

   
    body('Form').optional().isInt({ min: 1 }),
    body('Strength').optional().isLength({ max: 50 }),
    body('Dosage').optional().isLength({ max: 100 }),
    body('Frequency').optional().isLength({ max: 500 }),
    body('Duration').optional().isLength({ max: 300 }),
    body('Route').optional({ nullable: true }).isInt({ min: 1 }),
    body('FoodTiming').optional({ nullable: true }).isInt({ min: 1 }),
    body('Instructions').optional().isLength({ max: 1000 }),
    body('Quantity').optional().isDecimal(),
    body('RefillAllowed').optional().isIn([0, 1, null]),
    body('RefillCount').optional().isInt({ min: 0 }),
    body('StartDate').optional({ nullable: true }).isDate(),
    body('EndDate').optional({ nullable: true }).isDate(),
    body('Status').optional().isInt({ min: 1 })
];

exports.deletePrescriptionDetailValidatorRules = [
    body('PrescriptionDetailID')
        .notEmpty().withMessage('PrescriptionDetailID is required')
        .isInt({ min: 1 }).withMessage('Valid PrescriptionDetailID required')
];

exports.getPrescriptionDetailListValidatorRules = [
    body('Page').optional().default(1).isInt({ min: 1 }),
    body('PageSize').optional().default(50).isInt({ min: 1, max: 200 }),

    body('PrescriptionDetailID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').optional().isInt(),
    body('PrescriptionID').optional().isInt(),
    body('ConsultationID').optional().isInt(),
    body('VisitID').optional().isInt(),
    body('PatientID').optional().isInt(),
    body('PatientName').optional().isLength({ max: 100 }),
    body('DoctorID').optional().isInt(),
    body('DoctorName').optional().isLength({ max: 100 }),
    body('MedicineID').optional().isInt(),
    body('MedicineName').optional().isLength({ max: 500 }),
    body('Form').optional().isInt(),
    body('Route').optional().isInt(),
    body('FoodTiming').optional().isInt(),
    body('RefillAllowed').optional().isIn([0, 1]),
    body('Status').optional().isInt()
];