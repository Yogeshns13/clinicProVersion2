// Validation/labTestOrderValidator.js
const { body } = require('express-validator');

exports.addLabTestOrderValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be valid'),

    body('PatientID')
        .notEmpty().withMessage('PatientID is required')
        .isInt({ min: 1 }).withMessage('PatientID must be valid'),

    body('ConsultationID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('ConsultationID must be valid'),

    body('VisitID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('VisitID must be valid'),

    body('DoctorID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('DoctorID must be valid'),

    body('Priority')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Priority must be valid ID'),

    body('Notes')
        .optional()
        .isLength({ max: 2000 }).withMessage('Notes too long')
];

exports.updateLabTestOrderValidatorRules = [
    body('OrderID')
        .notEmpty().withMessage('OrderID is required')
        .isInt({ min: 1 }).withMessage('OrderID must be valid'),

    body('Priority')
        .optional()
        .isInt({ min: 1 }),

    body('Notes')
        .optional()
        .isLength({ max: 2000 }),

    body('FileID')
        .optional()
        .isInt({ min: 0 }),

    body('Status')
        .optional()
        .isInt({ min: 1 }),

    body('TestApprovedBy')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('TestApprovedBy must be valid employee')
];

exports.deleteLabTestOrderValidatorRules = [
    body('OrderID')
        .notEmpty().withMessage('OrderID is required')
        .isInt({ min: 1 }).withMessage('Invalid OrderID')
];

exports.getLabTestOrderListValidatorRules = [
    body('Page')
        .optional().default(1)
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50)
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1-200'),

    body('OrderID').optional().isInt({ min: 0 }),
    body('ClinicID').optional().isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('ConsultationID').optional().isInt({ min: 0 }),
    body('VisitID').optional().isInt({ min: 0 }),
    body('PatientID').optional().isInt({ min: 0 }),
    body('PatientName').optional().isLength({ max: 100 }),
    body('DoctorID').optional().isInt({ min: 0 }),
    body('DoctorName').optional().isLength({ max: 100 }),
    body('TestID').optional().isInt({ min: 0 }),
    body('TestName').optional().isLength({ max: 150 }),
    body('Status').optional().isInt(),
    body('Priority').optional().isInt({ min: 0 })
];