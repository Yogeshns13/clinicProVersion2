// Validation/salesCartDetailValidator.js
const { body } = require('express-validator');

exports.addSalesCartDetailValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }),
    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }),
    body('CartID')
        .notEmpty().withMessage('CartID is required')
        .isInt({ min: 1 }),
    body('MedicineID')
        .notEmpty().withMessage('MedicineID is required')
        .isInt({ min: 1 }),
    body('Quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
    body('UnitPrice')
        .optional({ nullable: true })
        .isDecimal({ decimal_digits: '0,1,2' })
        .custom(val => val >= 0).withMessage('UnitPrice cannot be negative'),
    body('DiscountPercentage')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Discount % must be 0–100'),
    body('BatchSelection')
        .optional()
        .isIn(['FIFO', 'FEFO'])
        .withMessage('BatchSelection must be FIFO or FEFO')
];

exports.deleteSalesCartDetailValidatorRules = [
    body('CartDetailID')
        .notEmpty().withMessage('CartDetailID is required')
        .isInt({ min: 1 })
];

exports.getSalesCartDetailListValidatorRules = [
    body('Page').notEmpty().isInt({ min: 1 }),
    body('PageSize').notEmpty().isInt({ min: 1, max: 200 }),
    body('CartDetailID').optional().isInt(),
    body('CartID').optional().isInt(),
    body('ClinicID').notEmpty().isInt({ min: 1 }),
    body('BranchID').optional().isInt(),
    body('PatientID').optional().isInt(),
    body('PatientName').optional().isLength({ max: 100 }),
    body('MedicineID').optional().isInt(),
    body('MedicineName').optional().isLength({ max: 200 }),
    body('BatchNo').optional().isLength({ max: 50 }),
    body('Status').optional().isInt()
];