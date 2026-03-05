// Validation/medicineMasterValidator.js
const { body } = require('express-validator');

const nameRegex = /^[A-Za-z0-9\s\.\,\-\(\)\[\]\/\+]+$/;

exports.addMedicineMasterValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),
    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),
    body('Name')
        .notEmpty().withMessage('Medicine name is required')
        .isLength({ min: 1, max: 200 }).withMessage('Name must be 1–200 characters')
        .matches(nameRegex).withMessage('Name contains invalid characters'),
    body('GenericName').optional().isLength({ max: 500 }),
    body('Composition').optional().isLength({ max: 500 }),
    body('Manufacturer').optional().isLength({ max: 200 }),
    body('Type')
        .notEmpty().withMessage('Medicine type is required')
        .isInt({ min: 1 }).withMessage('Valid Type ID required (Text Table #22)'),
    body('DosageForm').optional().isLength({ max: 100 }),
    body('Unit').optional().isInt({ min: 1 }),
    body('HSNCode').optional().isLength({ max: 20 }),
    body('ReorderLevelQty').optional().isInt({ min: 0 }),
    body('MRP').optional().isDecimal({ decimal_digits: '2' }),
    body('PurchasePrice').optional().isDecimal({ decimal_digits: '2' }),
    body('SellPrice').optional().isDecimal({ decimal_digits: '2' }),
    body('StockQuantity').optional().isInt({ min: 0 }),
    body('CGSTPercentage').optional().isDecimal({ decimal_digits: '2', max: 100 }),
    body('SGSTPercentage').optional().isDecimal({ decimal_digits: '2', max: 100 }),
    body('Barcode').optional().isLength({ max: 100 })
];

exports.updateMedicineMasterValidatorRules = [
    body('MedicineID')
        .notEmpty().withMessage('MedicineID is required')
        .isInt({ min: 1 }).withMessage('Valid MedicineID required'),
    body('Status').optional().isInt(),
    // Reuse add rules but make everything optional except ID

     ...exports.addMedicineMasterValidatorRules.slice(2)

    
];

exports.deleteMedicineMasterValidatorRules = [
    body('MedicineID')
        .notEmpty().withMessage('MedicineID is required')
        .isInt({ min: 1 }).withMessage('Valid MedicineID required')
];

exports.getMedicineMasterListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),
    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1, max: 200 }).withMessage('PageSize 1–200'),
    body('MedicineID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('Name').optional().isLength({ max: 200 }),
    body('Manufacturer').optional().isLength({ max: 200 }),
    body('Type').optional().isInt(),
    body('Unit').optional().isInt(),
    body('HSNCode').optional().isLength({ max: 20 }),
    body('Barcode').optional().isLength({ max: 100 }),
    body('LowStockOnly').optional().isIn([0, 1]),
    body('Status').optional().isInt()
];
