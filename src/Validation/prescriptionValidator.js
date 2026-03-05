// Validation/prescriptionValidator.js
const { body } = require('express-validator');

exports.addPrescriptionValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be a positive integer'),

    body('ConsultationID')
        .notEmpty().withMessage('ConsultationID is required')
        .isInt({ min: 1 }).withMessage('Valid ConsultationID required'),

    body('VisitID')
        .notEmpty().withMessage('VisitID is required')
        .isInt({ min: 1 }).withMessage('Valid VisitID required'),

    body('PatientID')
        .notEmpty().withMessage('PatientID is required')
        .isInt({ min: 1 }).withMessage('Valid PatientID required'),

    body('DoctorID')
        .notEmpty().withMessage('DoctorID is required')
        .isInt({ min: 1 }).withMessage('Valid DoctorID required'),

    body('DateIssued')
        .notEmpty().withMessage('DateIssued is required')
        .isDate().withMessage('DateIssued must be a valid date (YYYY-MM-DD)'),

    body('ValidUntil')
        .optional({ nullable: true })
        .isDate().withMessage('ValidUntil must be a valid date'),

    body('Diagnosis')
        .optional()
        .isLength({ max: 500 }).withMessage('Diagnosis cannot exceed 500 characters'),

    body('Notes')
        .optional(),

    body('IsRepeat')
        .optional()
        .isIn([0, 1]).withMessage('IsRepeat must be 0 or 1'),

    body('RepeatCount')
        .optional()
        .isInt({ min: 0 }).withMessage('RepeatCount must be a non-negative integer'),

    body('CreatedBy')
        .notEmpty().withMessage('CreatedBy (employee) is required')
        .isInt({ min: 1 }).withMessage('Valid CreatedBy employee ID required')
];

exports.updatePrescriptionValidatorRules = [
    body('PrescriptionID')
        .notEmpty().withMessage('PrescriptionID is required')
        .isInt({ min: 1 }).withMessage('PrescriptionID must be a positive integer'),

    body('DateIssued')
        .optional()
        .isDate().withMessage('DateIssued must be valid date'),

    body('ValidUntil')
        .optional({ nullable: true })
        .isDate().withMessage('ValidUntil must be valid date'),

    body('Diagnosis')
        .optional()
        .isLength({ max: 500 }),

    body('Notes')
        .optional(),

    body('IsRepeat')
        .optional()
        .isIn([0, 1, null]),

    body('RepeatCount')
        .optional()
        .isInt({ min: 0 }),

    body('Status')
        .optional()
        .isInt({ min: 1 }).withMessage('Status must be valid')
];

exports.deletePrescriptionValidatorRules = [
    body('PrescriptionID')
        .notEmpty().withMessage('PrescriptionID is required')
        .isInt({ min: 1 }).withMessage('PrescriptionID must be positive integer')
];

exports.getPrescriptionListValidatorRules = [
    body('Page')
        .optional().default(1)
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50)
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be between 1 and 200'),

    body('PrescriptionID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('ConsultationID').optional().isInt(),
    body('VisitID').optional().isInt(),
    body('PatientID').optional().isInt(),
    body('PatientName').optional().isLength({ max: 100 }),
    body('DoctorID').optional().isInt(),
    body('DoctorName').optional().isLength({ max: 100 }),
    body('CreatedBy').optional().isInt(),
    body('FromDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('IsRepeat').optional().isIn([-1,0, 1]),
    body('Status').optional().isInt()
];