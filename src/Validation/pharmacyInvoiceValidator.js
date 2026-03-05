// Validation/pharmacyInvoiceValidator.js
const { body } = require('express-validator');

exports.generatePharmacyInvoiceRules = [
    body('ClinicID').notEmpty().isInt({ min: 1 }),
    body('BranchID').notEmpty().isInt({ min: 1 }),
    body('CartID').notEmpty().isInt({ min: 1 }),
    body('InvoiceDate').notEmpty().isDate({ format: 'YYYY-MM-DD' }),
    body('Discount').optional().isDecimal().custom(v => v >= 0)
];

exports.cancelInvoiceRules = [
    body('InvoiceID').notEmpty().isInt({ min: 1 })
];

exports.addInvoicePaymentRules = [
    body('ClinicID').notEmpty().isInt({ min: 1 }),
    body('BranchID').notEmpty().isInt({ min: 1 }),
    body('InvoiceID').notEmpty().isInt({ min: 1 }),
    body('PatientID').optional().isInt({ min: 1 }),
    body('PaymentDate').notEmpty().isDate({ format: 'YYYY-MM-DD' }),
    body('PaymentMode').notEmpty().isInt({ min: 1, max: 10 }),
    body('Amount').notEmpty().isDecimal().custom(v => v > 0),
    body('ReferenceNo').optional().isLength({ max: 100 }),
    body('Remarks').optional()
];

exports.cancelInvoicePaymentRules = [
    body('PaymentID').notEmpty().isInt({ min: 1 }),
    body('Status').optional().isIn([4, 5]),
    body('Remarks').optional()
];

exports.getPharmacyInvoiceDetailListRules = [
    body('Page').notEmpty().isInt({ min: 1 }),
    body('PageSize').notEmpty().isInt({ min: 1, max: 200 }),
    body('InvDetailID').optional().isInt(),
    body('ClinicID').notEmpty().isInt({ min: 1 }),
    body('BranchID').optional().isInt(),
    body('InvoiceID').optional().isInt(),
    body('InvoiceNo').optional().isLength({ max: 50 }),
    body('PatientID').optional().isInt(),
    body('PatientName').optional().isLength({ max: 300 }),
    body('MedicineID').optional().isInt(),
    body('MedicineName').optional().isLength({ max: 200 }),
    body('BatchNo').optional().isLength({ max: 50 }),
    body('FromDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' })
];