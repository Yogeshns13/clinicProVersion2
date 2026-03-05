// Validation/labTestReportValidator.js
const { body } = require('express-validator');

exports.addLabTestReportValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),

    body('ConsultationID')
        .notEmpty().withMessage('ConsultationID is required')
        .isInt({ min: 1 }).withMessage('ConsultationID must be valid'),

    body('VisitID')
        .notEmpty().withMessage('VisitID is required')
        .isInt({ min: 1 }).withMessage('VisitID must be valid'),

    body('PatientID')
        .notEmpty().withMessage('PatientID is required')
        .isInt({ min: 1 }).withMessage('PatientID must be valid'),

    body('DoctorID')
        .notEmpty().withMessage('DoctorID is required')
        .isInt({ min: 1 }).withMessage('DoctorID must be valid'),

    body('FileID')
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage('FileID must be valid'),

    body('OrderID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('OrderID must be valid'),

    body('VerifiedBy')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('VerifiedBy must be valid employee'),

    body('VerifiedDatetime')
        .optional({ nullable: true })
        .isISO8601().withMessage('VerifiedDatetime must be valid datetime'),

    body('Remarks')
        .optional()
        .isLength({ max: 2000 }).withMessage('Remarks too long')
];

exports.updateLabTestReportValidatorRules = [
    body('ReportID')
        .notEmpty().withMessage('ReportID is required')
        .isInt({ min: 1 }).withMessage('ReportID must be positive integer'),

     body('FileID').notEmpty().withMessage('FileID must not be empty')       
        .isInt({ min: 1 }).withMessage('FileID must be valid'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be valid integer'),

    body('VerifiedBy')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('VerifiedBy must be valid employee'),

    body('VerifiedDatetime')
        .optional({ nullable: true })
        .isISO8601().withMessage('VerifiedDatetime must be valid datetime'),

    body('Remarks')
        .optional()
        .isLength({ max: 2000 }).withMessage('Remarks too long')
];

exports.deleteLabTestReportValidatorRules = [
    body('ReportID')
        .notEmpty().withMessage('ReportID is required')
        .isInt({ min: 1 }).withMessage('ReportID must be positive integer')
];

exports.getLabTestReportListValidatorRules = [
    body('Page')
        .optional().default(1)
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50)
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1-200'),

    body('ReportID').optional().isInt({ min: 0 }),
    body('ClinicID').optional().isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('OrderID').optional().isInt({ min: 0 }),
    body('ConsultationID').optional().isInt({ min: 0 }),
    body('VisitID').optional().isInt({ min: 0 }),
    body('PatientID').optional().isInt({ min: 0 }),
    body('PatientName').optional().isLength({ max: 100 }),
    body('DoctorID').optional().isInt({ min: 0 }),
    body('DoctorName').optional().isLength({ max: 100 }),
    body('VerifiedBy').optional().isInt({ min: 0 }),
     body('FromDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('Status').optional().isInt()
];