// Validation/departmentValidator.js
const { body } = require('express-validator');

const allowedCharactersRegex = /^[A-Za-z0-9\s\-_.,'&]+$/; // Realistic for department names

exports.addDepartmentValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be a positive integer'),

    body('DepartmentName')
        .notEmpty().withMessage('DepartmentName is required')
        .isLength({ max: 100 }).withMessage('DepartmentName should not exceed 100 characters')
        .matches(allowedCharactersRegex).withMessage('DepartmentName contains invalid characters'),

    body('Profile')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 100 }).withMessage('Profile should not exceed 100 characters')

  
];

exports.updateDepartmentValidatorRules = [
    body('DepartmentID')
        .notEmpty().withMessage('DepartmentID is required')
        .isInt({ min: 1 }).withMessage('DepartmentID must be a positive integer'),

    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('DepartmentName')
        .notEmpty().withMessage('DepartmentName is required')
        .isLength({ max: 100 }).withMessage('DepartmentName should not exceed 100 characters')
        .matches(allowedCharactersRegex).withMessage('DepartmentName contains invalid characters'),

    body('Profile')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 100 }).withMessage('Profile should not exceed 100 characters')
];

exports.getDepartmentListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1}).withMessage('PageSize must be positive integer'),

    body('DepartmentID')
        .optional()
        .isInt().withMessage('DepartmentID must be a number'),

    body('ClinicID')
        .optional()
        .isInt().withMessage('ClinicID must be a number'),

    body('BranchID')
        .optional()
        .isInt().withMessage('BranchID must be a number'),

    body('DepartmentName')
        .optional()
        .isLength({ max: 100 }).withMessage('DepartmentName search term too long')
];