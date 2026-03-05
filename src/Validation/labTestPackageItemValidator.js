// Validation/labTestPackageItemValidator.js
const { body } = require('express-validator');

exports.addLabPackageItemValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be valid'),

    body('PackageID')
        .notEmpty().withMessage('PackageID is required')
        .isInt({ min: 1 }).withMessage('PackageID must be valid'),

    body('TestID')
        .notEmpty().withMessage('TestID is required')
        .isInt({ min: 1 }).withMessage('TestID must be valid')
];

exports.deleteLabPackageItemValidatorRules = [
    body('PackageItemID')
        .notEmpty().withMessage('PackageItemID is required')
        .isInt({ min: 1 }).withMessage('PackageItemID must be valid')
];

exports.getLabTestPackageDetailsValidatorRules = [
    body('PackageID')
        .notEmpty().withMessage('PackageID is required')
        .isInt({ min: 1 }).withMessage('PackageID must be valid')
];

exports.rebuildPackageFeesValidatorRules = [
    body('PackageID')
        .notEmpty().withMessage('PackageID is required')
        .isInt({ min: 1 }).withMessage('PackageID must be valid')
];