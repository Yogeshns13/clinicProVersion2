const { body } = require('express-validator');

exports.addUserRoleValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('UserID')
        .notEmpty().withMessage('UserID is required')
        .isInt({ min: 1 }).withMessage('UserID must be a positive integer'),

    body('RoleID')
        .notEmpty().withMessage('RoleID is required')
        .isInt({ min: 1 }).withMessage('RoleID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.updateUserRoleValidatorRules = [
    body('UserRoleID')
        .notEmpty().withMessage('UserRoleID is required')
        .isInt({ min: 1 }).withMessage('UserRoleID must be a positive integer'),

    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('UserID')
        .notEmpty().withMessage('UserID is required')
        .isInt({ min: 1 }).withMessage('UserID must be a positive integer'),

    body('RoleID')
        .notEmpty().withMessage('RoleID is required')
        .isInt({ min: 1 }).withMessage('RoleID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.deleteUserRoleValidatorRules = [
    body('UserRoleID')
        .notEmpty().withMessage('UserRoleID is required')
        .isInt({ min: 1 }).withMessage('UserRoleID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.getUserRoleListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be a positive integer'),

    body('ClinicID').notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 0}).withMessage('ClinicID must be a positive integer'),
    body('UserID').optional().isInt(),
    body('RoleID').optional().isInt(),
    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.getUserRoleValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('UserID')
        .notEmpty().withMessage('UserID is required')
        .isInt({ min: 1 }).withMessage('UserID must be a positive integer'),

    
];
