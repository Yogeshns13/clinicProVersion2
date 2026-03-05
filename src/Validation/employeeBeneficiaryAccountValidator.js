// Validation/employeeBeneficiaryAccountValidator.js
const { body } = require('express-validator');

const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/; // Indian IFSC format
const accountNoRegex = /^\d{9,18}$/;        // Typical bank account length

exports.addEmployeeBeneficiaryAccountValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be valid'),

    body('EmployeeID')
        .notEmpty().withMessage('EmployeeID is required')
        .isInt({ min: 1 }).withMessage('EmployeeID must be valid'),

    body('AccountHolderName')
        .notEmpty().withMessage('AccountHolderName is required')
        .isLength({ max: 100 }).withMessage('AccountHolderName too long')
        .matches(/^[A-Za-z\s\.\-']+$/).withMessage('Invalid characters in AccountHolderName'),

    body('AccountNo')
        .notEmpty().withMessage('AccountNo is required')
        .matches(accountNoRegex).withMessage('AccountNo must be 9–18 digits'),

    body('BankName')
        .notEmpty().withMessage('BankName is required')
        .isLength({ max: 100 }).withMessage('BankName too long'),

    body('IFSCCode')
        .optional({ nullable: true })
        .matches(ifscRegex).withMessage('Invalid IFSC code format (e.g., SBIN0001234)'),

    body('BankAddress')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage('BankAddress too long'),

    body('IsDefault')
        .notEmpty().withMessage('IsDefault is required')
        .isIn([0, 1]).withMessage('IsDefault must be 0 or 1')

   
];

exports.updateEmployeeBeneficiaryAccountValidatorRules = [
    body('BeneficiaryID')
        .notEmpty().withMessage('BeneficiaryID is required')
        .isInt({ min: 1 }).withMessage('BeneficiaryID must be valid'),

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

    // Reuse all other rules from add (except UniqueSeq)
    ...exports.addEmployeeBeneficiaryAccountValidatorRules.slice(2)
];

exports.deleteEmployeeBeneficiaryAccountValidatorRules = [
    body('BeneficiaryID')
        .notEmpty().withMessage('BeneficiaryID is required')
        .isInt({ min: 1 }).withMessage('BeneficiaryID must be valid')
];

exports.getEmployeeBeneficiaryAccountListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be positive'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1–200'),

    body('BeneficiaryID').optional().isInt(),
    body('ClinicID') .notEmpty().withMessage('ClinicID is required'),
    body('BranchID').optional().isInt(),
    body('EmployeeID').optional().isInt(),
    body('AccountNo').optional().isLength({ max: 50 }),
    body('IFSCCode').optional().isLength({ max: 30 }),
    body('IsDefault').optional().isIn([0, 1, -1]),
    body('Status').optional().isInt()
];