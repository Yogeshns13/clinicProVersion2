// Validation/invoicePaymentValidator.js
const { body } = require('express-validator');

exports.getInvoicePaymentListValidatorRules = [
    body('Page')
        .optional().default(1).isInt({ min: 1 }),

    body('PageSize')
        .optional().default(50).isInt({ min: 1, max: 200 }),

    body('PaymentID').optional().isInt({ min: 0 }),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('InvoiceID').optional().isInt({ min: 0 }),
    body('InvoiceNo').optional().isLength({ max: 50 }).trim(),
    body('PatientID').optional().isInt({ min: 0 }),
    body('PatientName').optional().isLength({ max: 100 }).trim(),
    body('PaymentMode').optional().isInt({ min: 0}),
   body('FromDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('Status').optional().isInt(),
    body('ReferenceNo').optional().isLength({ max: 100 }).trim()
];