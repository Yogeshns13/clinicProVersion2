// Validation/employeeProofValidator.js
const { body } = require('express-validator');

exports.addEmployeeProofValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be valid'),

    body('EmployeeID')
        .notEmpty().withMessage('EmployeeID is required')
        .isInt({ min: 1 }).withMessage('EmployeeID must be valid'),

    body('ProofType')
        .notEmpty().withMessage('ProofType is required')
        .isInt({ min: 1 }).withMessage('ProofType must be valid ID from text table'),

    body('IdNumber')
        .notEmpty().withMessage('IdNumber is required')
        .isLength({ max: 20 }).withMessage('IdNumber cannot exceed 20 characters')
        .matches(/^[ A-Za-z0-9\/\-]+$/).withMessage('Invalid characters in IdNumber'),

    body('Detail')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage('Detail too long'),

    body('ExpiryDate')
        .optional()
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('ExpiryDate must be valid date'),

    body('FileID')
        .optional()
        .isInt().withMessage('FileID must be a number')

    
];

exports.updateEmployeeProofValidatorRules = [
    body('ProofID')
        .notEmpty().withMessage('ProofID is required')
        .isInt({ min: 1 }).withMessage('ProofID must be valid'),

    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be valid'),

    body('EmployeeID')
        .notEmpty().withMessage('EmployeeID is required')
        .isInt({ min: 1 }).withMessage('EmployeeID must be valid'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be a number'),

    // Reuse all other rules from add
    ...exports.addEmployeeProofValidatorRules.slice(3) // From ProofType onward
];

exports.deleteEmployeeProofValidatorRules = [
    body('ProofID')
        .notEmpty().withMessage('ProofID is required')
        .isInt({ min: 1 }).withMessage('ProofID must be valid')
];

exports.getEmployeeProofListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be positive'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1–200'),

    body('ProofID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt(),
    body('BranchID').optional().isInt(),
    body('EmployeeID').optional().isInt(),
    body('ProofType').optional().isInt(),
    body('IdNumber').optional().isLength({ max: 20 }),
    body('Status').optional().isInt()
];