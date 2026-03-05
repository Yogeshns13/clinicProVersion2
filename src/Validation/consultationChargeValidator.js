// Validation/consultationChargeValidator.js
const { body } = require('express-validator');

exports.addConsultationChargeValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be a positive integer'),

    body('ConsultationID')
        .notEmpty().withMessage('ConsultationID is required')
        .isInt({ min: 1 }).withMessage('ConsultationID must be a positive integer'),

    body('ChargeID')
        .notEmpty().withMessage('ChargeID is required')
        .isInt({ min: 1 }).withMessage('ChargeID must be valid from charge config'),

    body('ChargeAmount')
        .optional({ nullable: true })
        .isDecimal({ decimal_digits: '0,2' }).withMessage('ChargeAmount must be valid decimal')
        .custom(val => {
            if (val !== null && parseFloat(val) < 0) {
                throw new Error('ChargeAmount must be greater than 0 if provided');
            }
            return true;
        })
];

exports.cancelConsultationChargeValidatorRules = [
    body('ConsChargeID')
        .notEmpty().withMessage('ConsChargeID is required')
        .isInt({ min: 1 }).withMessage('ConsChargeID must be a positive integer')
];

exports.getConsultationChargeListValidatorRules = [
    body('Page')
        .optional().default(1).isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50).isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1–200'),

    body('ConsChargeID').optional().isInt({ min: 0 }),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('ConsultationID').optional().isInt({ min: 0 }),
    body('VisitID').optional().isInt({ min: 0 }),
    body('PatientID').optional().isInt({ min: 0 }),
    body('PatientName').optional().isLength({ max: 100 }).trim(),
    body('DoctorID').optional().isInt({ min: 0 }),
    body('ChargeID').optional().isInt({ min: 0 }),
    body('ChargeName').optional().isLength({ max: 100 }).trim(),
    body('InvoiceID').optional().isInt({ min: 0 }),
    body('InvoicedOnly')
        .optional()
        .isIn([0, 1, null]).withMessage('InvoicedOnly must be 0, 1 or null'),
    body('Status').optional().isInt()
];