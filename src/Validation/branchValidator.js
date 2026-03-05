// validators/BranchValidator.js
const { body } = require('express-validator');

const allowedCharactersRegex = /^[A-Za-z0-9\s\-_]+$/; // Slightly relaxed for names with space/hyphen

exports.addBranchValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt().withMessage('ClinicID must be a positive integer'),

    body('BranchName')
        .notEmpty().withMessage('BranchName is required')
        .isLength({ max: 100 }).withMessage('BranchName should not exceed 100 characters')
        .matches(allowedCharactersRegex).withMessage('BranchName contains invalid characters'),

    body('Address')
        .notEmpty().withMessage('Address is required')
        .isLength({ max: 500 }).withMessage('Address should not exceed 500 characters'),

    body('Location')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage('Location should not exceed 500 characters'),

    body('BranchType')
        .notEmpty().withMessage('BranchType is required')
        .isInt({ min: 1 }).withMessage('BranchType must be a valid integer (from text table)')

    
];

exports.updateBranchValidatorRules = [
    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be a positive integer'),

    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('BranchName')
        .notEmpty().withMessage('BranchName is required')
        .isLength({ max: 100 }).withMessage('BranchName should not exceed 100 characters')
        .matches(allowedCharactersRegex).withMessage('BranchName contains invalid characters'),

    body('Address')
         .notEmpty().withMessage('Address is required')
        .isLength({ max: 500 }).withMessage('Address should not exceed 500 characters'),

    body('Location')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage('Location should not exceed 500 characters'),

    body('BranchType')
        .notEmpty().withMessage('BranchType is required')
        .isInt({ min: 1 }).withMessage('BranchType must be a valid integer'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be a number')
];

exports.deleteBranchValidatorRules = [
    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be a positive integer')
];

exports.getBranchListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be positive integer'),

     body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt().withMessage('ClinicID must be a number'),


    body('BranchID')
        .optional()
        .isInt().withMessage('BranchID must be a number'),

   
    body('BranchName')
        .optional()
        .isLength({ max: 100 }).withMessage('BranchName search term too long'),

    body('Location')
        .optional()
        .isLength({ max: 500 }).withMessage('Location search term too long'),

    body('BranchType')
        .optional()
        .isInt().withMessage('BranchType must be a number'),

    body('Status')
        .optional()
        .isInt().withMessage('Status must be a number')
];