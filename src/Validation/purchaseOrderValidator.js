// Validation/purchaseOrderValidator.js
const { body } = require('express-validator');

exports.addPurchaseOrderValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),
    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),
    body('PODate')
        .notEmpty().withMessage('PODate is required')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('Valid PODate required'),
    body('VendorID')
        .notEmpty().withMessage('VendorID is required')
        .isInt({ min: 1 }).withMessage('Valid VendorID required'),
    body('Discount')
        .optional()
        .isDecimal({ decimal_digits: '0,1,2' })
        .custom(val => val >= 0).withMessage('Discount cannot be negative')
];

exports.deletePurchaseOrderValidatorRules = [
    body('POID')
        .notEmpty().withMessage('POID is required')
        .isInt({ min: 1 }).withMessage('Valid POID required')
];

exports.getPurchaseOrderListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }),
    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1, max: 200 }),
    body('POID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').optional().isInt(),
    body('PONumber').optional().isLength({ max: 50 }),
    body('VendorID').optional().isInt(),
    body('VendorName').optional().isLength({ max: 500 }),
    body('FromDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('Status').optional().isInt()
];