// Validation/purchaseOrderDetailValidator.js
const { body } = require('express-validator');

exports.addPurchaseOrderDetailValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),
    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),
    body('POID')
        .notEmpty().withMessage('POID is required')
        .isInt({ min: 1 }).withMessage('Valid POID required'),
    body('MedicineID')
        .notEmpty().withMessage('MedicineID is required')
        .isInt({ min: 1 }).withMessage('Valid MedicineID required'),
    body('Quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
    body('UnitPrice')
        .notEmpty().withMessage('UnitPrice is required')
        .isDecimal({ decimal_digits: '0,1,2' })
        .custom(val => val > 0).withMessage('UnitPrice must be greater than 0')
];

exports.updatePurchaseOrderDetailValidatorRules = [
    body('PODetailID')
        .notEmpty().withMessage('PODetailID is required')
        .isInt({ min: 1 }).withMessage('Valid PODetailID required'),
    body('Quantity')
        .optional()
        .isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
    body('UnitPrice')
        .optional()
        .isDecimal({ decimal_digits: '0,1,2' })
        .custom(val => val > 0).withMessage('UnitPrice must be > 0'),
    body('Status')
        .optional()
        .isInt().withMessage('Status must be integer')
];

exports.deletePurchaseOrderDetailValidatorRules = [
    body('PODetailID')
        .notEmpty().withMessage('PODetailID is required')
        .isInt({ min: 1 }).withMessage('Valid PODetailID required')
];

exports.getPurchaseOrderDetailListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }),
    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1, max: 200 }),
    body('PODetailID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').optional().isInt(),
    body('POID').optional().isInt(),
    body('PONumber').optional().isLength({ max: 50 }),
    body('VendorID').optional().isInt(),
    body('MedicineID').optional().isInt(),
    body('MedicineName').optional().isLength({ max: 200 }),
    body('Status').optional().isInt()
];