// Validation/medicineStockValidator.js
const { body } = require('express-validator');

exports.addMedicineStockValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),
    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),
    body('MedicineID')
        .notEmpty().withMessage('MedicineID is required')
        .isInt({ min: 1 }).withMessage('Valid MedicineID required'),
    body('BatchNo')
        .notEmpty().withMessage('BatchNo is required')
        .isLength({ max: 50 }).withMessage('BatchNo too long'),
    body('ExpiryDate')
        .notEmpty().withMessage('ExpiryDate is required')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('Valid ExpiryDate required'),
    body('QuantityIn')
        .notEmpty().withMessage('QuantityIn is required')
        .isInt({ min: 1 }).withMessage('QuantityIn must be >= 1'),
    body('PurchasePrice')
        .notEmpty().withMessage('PurchasePrice is required')
        .isDecimal().withMessage('Valid PurchasePrice required')
        .custom(val => val >= 0).withMessage('PurchasePrice cannot be negative')
];

exports.updateMedicineStockValidatorRules = [
    body('StockID')
        .notEmpty().withMessage('StockID is required')
        .isInt({ min: 1 }).withMessage('Valid StockID required'),
    body('BatchNo')
        .optional()
        .isLength({ max: 50 }).withMessage('BatchNo too long'),
    body('ExpiryDate')
        .optional()
        .isDate({ format: 'YYYY-MM-DD' }),
    body('QuantityIn')
        .optional()
        .isInt({ min: 1 }).withMessage('QuantityIn must be >= 1 if provided'),
     body('PurchasePrice')
        .notEmpty().withMessage('PurchasePrice is required')
        .isDecimal().withMessage('Valid PurchasePrice required')
        .custom(val => val >= 0).withMessage('PurchasePrice cannot be negative')
];

exports.getMedicineStockListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }),
    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1, max: 200 }),
    body('StockID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').optional().isInt(),
    body('MedicineID').optional().isInt(),
    body('MedicineName').optional().isLength({ max: 200 }),
    body('BatchNo').optional().isLength({ max: 50 }),
    body('ExpiryFrom').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ExpiryTo').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),   
    body('NearExpiryDays').optional().isInt({ min: 0, max: 365 }),
    body('ZeroStock').optional().isIn([-1,0, 1]),
    body('NegativeStock').optional().isIn([0, 1])
];