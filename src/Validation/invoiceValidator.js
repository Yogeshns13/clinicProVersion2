
const { body } = require('express-validator');

exports.generateLabInvoiceValidatorRules = [
    body('ClinicID').notEmpty().isInt({ min: 1 }),
    body('BranchID').notEmpty().isInt({ min: 1 }),
    body('OrderID').notEmpty().isInt({ min: 1 }),
    body('InvoiceDate').notEmpty().isISO8601().toDate(),
    body('Discount').optional().isDecimal({ decimal_digits: '2' }).custom(v => v >= 0)
];

exports.updateInvoiceStatusValidatorRules = [
    body('InvoiceID').notEmpty().isInt({ min: 1 }),
    body('Status')
        .notEmpty()
        .isInt({ min: 1, max: 6 })
        .withMessage('Status must be 1-6 (Draft, Issued, Paid, Partial, Cancelled, Refunded)')
];

exports.getInvoiceListValidatorRules = [
    body('Page').optional().default(1).isInt({ min: 1 }),
    body('PageSize').optional().default(50).isInt({ min: 1, max: 200 }),

    body('InvoiceID').optional().isInt({ min: 0 }),
    body('ClinicID').optional().isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('InvoiceNo').optional().isLength({ max: 50 }),
    body('PatientID').optional().isInt({ min: 0 }),
    body('PatientName').optional().isLength({ max: 100 }),
    body('VisitID').optional().isInt({ min: 0 }),
    body('InvoiceType').optional().isInt({ min: 0, max: 3 }),
    body('FromDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('Status').optional().isInt()
];

exports.getLabInvoiceDetailListValidatorRules = [
    body('Page').optional().default(1).isInt({ min: 1 }),
    body('PageSize').optional().default(50).isInt({ min: 1, max: 200 }),

    body('InvDetailID').optional().isInt({ min:0 }),
    body('ClinicID').optional().isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('InvoiceID').optional().isInt({ min: 0 }),
    body('OrderID').optional().isInt({ min: 0 }),
    body('TestID').optional().isInt({ min: 0 }),
    body('TestName').optional().isLength({ max: 150 }),
    body('PatientID').optional().isInt({ min: 0 })
];