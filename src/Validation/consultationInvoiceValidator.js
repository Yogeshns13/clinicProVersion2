// Validation/consultationInvoiceValidator.js
const { body } = require('express-validator');

exports.generateConsultationInvoiceValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be a positive integer'),

    body('ConsultationID')
        .notEmpty().withMessage('ConsultationID is required')
        .isInt({ min: 1 }).withMessage('ConsultationID must be a positive integer'),

    body('InvoiceDate')
        .optional()
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('InvoiceDate must be a valid date (YYYY-MM-DD)'),

    body('Discount')
        .optional()
        .isDecimal({ decimal_digits: '0,2' }).withMessage('Discount must be a valid amount with up to 2 decimals')
        .custom(val => parseFloat(val) >= 0).withMessage('Discount cannot be negative')
];

exports.getConsultationInvoiceDetailListValidatorRules = [
    body('Page')
        .optional().default(1).isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50).isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1–200'),

    body('DetailID').optional().isInt({ min: 0 }),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('InvoiceID').optional().isInt({ min: 0 }),
    body('InvoiceNo').optional().isLength({ max: 50 }).trim(),
    body('ConsultationID').optional().isInt({ min: 0 }),
    body('VisitID').optional().isInt({ min: 0 }),
    body('PatientID').optional().isInt({ min: 0 }),
    body('PatientName').optional().isLength({ max: 100 }).trim(),
    body('DoctorID').optional().isInt({ min: 0 }),
    body('ChargeID').optional().isInt({ min: 0 }),
    body('ChargeName').optional().isLength({ max: 100 }).trim(),
    body('FromDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' })
        .custom((value, { req }) => {
            if (value && req.body.FromDate && new Date(value) < new Date(req.body.FromDate)) {
                throw new Error('ToDate cannot be earlier than FromDate');
            }
            return true;
        })
];