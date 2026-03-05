// Validation/labTestPackageValidator.js
const { body } = require('express-validator');

exports.addLabTestPackageValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),

    body('PackName')
        .notEmpty().withMessage('PackName is required')
        .isLength({ min: 1, max: 150 }).withMessage('PackName must be 1-150 characters')
        .trim(),

    body('PackShortName')
        .notEmpty().withMessage('PackShortName is required')
        .isLength({ min: 1, max: 30 }).withMessage('PackShortName must be 1-30 characters')
        .trim(),

    body('Description')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage('Description too long'),

    body('Fees')
        .notEmpty().withMessage('Fees is required')
        .isDecimal({ decimal_digits: '2' }).withMessage('Fees must be valid amount (e.g., 9999.99)'),

    body('CGSTPercentage')
        .optional().default(0.00)
        .isDecimal({ decimal_digits: '0,2' }).withMessage('CGST must be valid percentage'),

    body('SGSTPercentage')
        .optional().default(0.00)
        .isDecimal({ decimal_digits: '0,2' }).withMessage('SGST must be valid percentage')
];

exports.updateLabTestPackageValidatorRules = [
    body('PackageID')
        .notEmpty().withMessage('PackageID is required')
        .isInt({ min: 1 }).withMessage('PackageID must be positive integer'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be integer (1=Active, 0=Inactive)'),

    body('PackName')
        .optional()
        .isLength({ max: 150 }).withMessage('PackName too long')
        .trim(),

    body('PackShortName')
        .optional()
        .isLength({ max: 30 }).withMessage('PackShortName too long')
        .trim(),

    body('Description').optional().isLength({ max: 500 }),
    body('Fees').optional().isDecimal({ decimal_digits: '2' }),
    body('CGSTPercentage').optional().isDecimal({ decimal_digits: '0,2' }),
    body('SGSTPercentage').optional().isDecimal({ decimal_digits: '0,2' })
];

exports.deleteLabTestPackageValidatorRules = [
    body('PackageID')
        .notEmpty().withMessage('PackageID is required')
        .isInt({ min: 1 }).withMessage('Invalid PackageID')
];

exports.getLabTestPackagesValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('Page')
        .optional().default(1)
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50)
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1-200'),

    body('BranchID').optional().isInt({ min: 1 }),
    body('PackNameSearch').optional().isLength({ max: 100 }),
    body('Status').optional().isInt()
];