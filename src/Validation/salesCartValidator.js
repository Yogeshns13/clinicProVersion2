// Validation/salesCartValidator.js
const { body } = require('express-validator');

exports.addSalesCartValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),
    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),
    body('PatientID')
        .optional()
        .isInt({ min: 1 }).withMessage('PatientID must be valid if provided'),
    body('Name')
        .optional()
        .isLength({ max: 100 }).withMessage('Name too long')
        .custom((value, { req }) => {
            const hasPatient = req.body.PatientID && req.body.PatientID > 0;
            const hasName = value && value.trim() !== '';
            if (!hasPatient && !hasName) {
                throw new Error('Either PatientID or Name is required');
            }
            return true;
        }),
    body('ConsultationID')
        .optional()
        .isInt({ min: 1 }).withMessage('ConsultationID must be valid if provided'),
    body('VisitID')
        .optional()
        .isInt({ min: 1 }).withMessage('VisitID must be valid if provided')
];

exports.deleteSalesCartValidatorRules = [
    body('CartID')
        .notEmpty().withMessage('CartID is required')
        .isInt({ min: 1 }).withMessage('Valid CartID required')
];

exports.updateCartTotalsValidatorRules = [
    body('CartID')
        .notEmpty().withMessage('CartID is required')
        .isInt({ min: 1 }).withMessage('Valid CartID required')
];

exports.getSalesCartListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }),
    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1, max: 200 }),
    body('CartID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').optional().isInt(),
    body('PatientID').optional().isInt(),
    body('PatientName').optional().isLength({ max: 100 }),
    body('Status').optional().isInt()
];