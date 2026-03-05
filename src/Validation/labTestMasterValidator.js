// Validation/labTestMasterValidator.js
const { body } = require('express-validator');

exports.addLabTestMasterValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),

    body('TestName')
        .notEmpty().withMessage('TestName is required')
        .isLength({ min: 1, max: 150 }).withMessage('TestName must be 1-150 characters')
        .trim(),

    body('ShortName')
        .notEmpty().withMessage('ShortName is required')
        .isLength({ min: 1, max: 30 }).withMessage('ShortName must be 1-30 characters')
        .trim(),

    body('Description')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage('Description too long'),

    body('TestType')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('TestType must be valid ID'),

    body('NormalRange')
        .optional({ nullable: true })
        .isLength({ max: 100 }).withMessage('NormalRange too long'),

    body('Units')
        .optional({ nullable: true })
        .isLength({ max: 30 }).withMessage('Units too long'),

    body('Remarks')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage('Remarks too long'),

    body('Fees')
        .optional().default(0.00)
        .isDecimal({ decimal_digits: '2' }).withMessage('Fees must be decimal with 2 places'),

    body('CGSTPercentage')
        .optional().default(0.00)
        .isDecimal({ decimal_digits: '0,2' }).withMessage('CGST must be valid percentage'),

    body('SGSTPercentage')
        .optional().default(0.00)
        .isDecimal({ decimal_digits: '0,2' }).withMessage('SGST must be valid percentage')
];

exports.updateLabTestMasterValidatorRules = [
    body('TestID')
        .notEmpty().withMessage('TestID is required')
        .isInt({ min: 1 }).withMessage('TestID must be positive integer'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be integer'),

    // All other fields optional (partial update)
    body('TestName').optional().isLength({ max: 150 }).trim(),
    body('ShortName').optional().isLength({ max: 30 }).trim(),
    body('Description').optional().isLength({ max: 500 }),
    body('TestType').optional().isInt(),
    body('NormalRange').optional().isLength({ max: 100 }),
    body('Units').optional().isLength({ max: 30 }),
    body('Remarks').optional().isLength({ max: 500 }),
    body('Fees').optional().isDecimal({ decimal_digits: '2' }),
    body('CGSTPercentage').optional().isDecimal({ decimal_digits: '0,2' }),
    body('SGSTPercentage').optional().isDecimal({ decimal_digits: '0,2' })
];

exports.deleteLabTestMasterValidatorRules = [
    body('TestID')
        .notEmpty().withMessage('TestID is required')
        .isInt({ min: 1 }).withMessage('TestID must be positive integer')
];

exports.getLabTestMasterListValidatorRules = [
    body('Page')
        .optional().default(1)
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50)
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1-200'),

    body('TestID').optional().isInt({ min: 0 }),
    body('ClinicID').optional().isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('TestName').optional().isLength({ max: 150 }),
    body('TestType').optional().isInt(),
    body('Status').optional().isInt()
];