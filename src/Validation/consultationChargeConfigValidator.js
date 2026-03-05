// Validation/consultationChargeConfigValidator.js
const { body } = require('express-validator');

const codeRegex = /^[A-Za-z0-9\-_]+$/;

exports.addConsultationChargeConfigValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('ChargeCode')
        .notEmpty().withMessage('ChargeCode is required')
        .isLength({ max: 20 }).withMessage('ChargeCode cannot exceed 20 characters')
        .matches(codeRegex).withMessage('ChargeCode can only contain letters, numbers, hyphen and underscore'),

    body('ChargeName')
        .notEmpty().withMessage('ChargeName is required')
        .isLength({ min: 1, max: 100 }).withMessage('ChargeName must be between 1 and 100 characters'),

    body('DefaultAmount')
        .notEmpty().withMessage('DefaultAmount is required')
        .isDecimal({ decimal_digits: '0,2' }).withMessage('DefaultAmount must be a valid decimal with up to 2 places')
        .custom(value => {
            if (parseFloat(value) <= 0) throw new Error('DefaultAmount must be greater than 0');
            return true;
        }),

    body('CgstPercentage')
        .optional({ nullable: true })
        .isDecimal({ decimal_digits: '0,2' }).withMessage('CGSTPercentage must be valid (e.g., 9.00)')
        .custom(val => val >= 0 && val <= 100).withMessage('CGSTPercentage must be between 0 and 100'),

    body('SgstPercentage')
        .optional({ nullable: true })
        .isDecimal({ decimal_digits: '0,2' }).withMessage('SGSTPercentage must be valid')
        .custom(val => val >= 0 && val <= 100).withMessage('SGSTPercentage must be between 0 and 100')
];

exports.updateConsultationChargeConfigValidatorRules = [
    body('ChargeID')
        .notEmpty().withMessage('ChargeID is required')
        .isInt({ min: 1 }).withMessage('ChargeID must be a positive integer'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be a valid integer'),

          ...exports.addConsultationChargeConfigValidatorRules.slice(1)

    // Optional fields - reuse add rules but make them optional
   
];

exports.deleteConsultationChargeConfigValidatorRules = [
    body('ChargeID')
        .notEmpty().withMessage('ChargeID is required')
        .isInt({ min: 1 }).withMessage('ChargeID must be a positive integer')
];

exports.getConsultationChargeConfigListValidatorRules = [
    body('Page')
        .optional().default(1).isInt({ min: 1 }).withMessage('Page must be >= 1'),
    body('PageSize')
        .optional().default(50).isInt({ min: 1, max: 200 }).withMessage('PageSize must be between 1 and 200'),
    body('ChargeID').optional().isInt({ min: 0 }),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('ChargeCode').optional().isLength({ max: 20 }),
    body('ChargeName').optional().isLength({ max: 100 }),
    body('Status').optional().isInt()
];