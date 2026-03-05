const { body } = require('express-validator');

exports.addUserPermissionOverrideValidatorRules = [
    body('UserID')
        .notEmpty().withMessage('UserID is required')
        .isInt({ min: 1 }).withMessage('UserID must be a positive integer'),

    body('PermissionID')
        .notEmpty().withMessage('PermissionID is required')
        .isInt({ min: 1 }).withMessage('PermissionID must be a positive integer'),

    body('IsAllowed')
        .optional()
        .isInt({ min: 0, max: 1 }).withMessage('IsAllowed must be 0 or 1'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.updateUserPermissionOverrideValidatorRules = [
    body('UserID')
        .notEmpty().withMessage('UserID is required')
        .isInt({ min: 1 }).withMessage('UserID must be a positive integer'),

    body('PermissionID')
        .notEmpty().withMessage('PermissionID is required')
        .isInt({ min: 1 }).withMessage('PermissionID must be a positive integer'),

    body('IsAllowed')
        .notEmpty().withMessage('IsAllowed is required')
        .isInt({ min: 0, max: 1 }).withMessage('IsAllowed must be 0 or 1'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.deleteUserPermissionOverrideValidatorRules = [
    body('UserID')
        .notEmpty().withMessage('UserID is required')
        .isInt({ min: 1 }).withMessage('UserID must be a positive integer'),

    body('PermissionID')
        .notEmpty().withMessage('PermissionID is required')
        .isInt({ min: 1 }).withMessage('PermissionID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.getUserPermissionOverrideListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be a positive integer'),

    body('UserID').isInt().notEmpty().withMessage('UserID is required')
        .notEmpty().withMessage('UserID is required')
        .isInt({ min: 0 }).withMessage('UserID must be a positive integer'),

    body('PermissionID')
        .optional()
        .isInt({ min: 0 }).withMessage('PermissionID must be a positive integer'),
   
];