const { body } = require('express-validator');

exports.addPermissionValidatorRules = [
    body('ServiceID')
        .notEmpty().withMessage('ServiceID is required')
        .isInt({ min: 1 }).withMessage('ServiceID must be a positive integer'),

    body('ActionID')
        .notEmpty().withMessage('ActionID is required')
        .isInt({ min: 1 }).withMessage('ActionID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.updatePermissionValidatorRules = [
    body('PermissionID')
        .notEmpty().withMessage('PermissionID is required')
        .isInt({ min: 1 }).withMessage('PermissionID must be a positive integer'),

    body('ServiceID')
        .notEmpty().withMessage('ServiceID is required')
        .isInt({ min: 1 }).withMessage('ServiceID must be a positive integer'),

    body('ActionID')
        .notEmpty().withMessage('ActionID is required')
        .isInt({ min: 1 }).withMessage('ActionID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.deletePermissionValidatorRules = [
    body('PermissionID')
        .notEmpty().withMessage('PermissionID is required')
        .isInt({ min: 1 }).withMessage('PermissionID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.getPermissionListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be a positive integer'),

    body('PermissionID').isInt().notEmpty().withMessage('PermissionID is required'),
    body('ServiceID').isInt().notEmpty().withMessage('ServiceID is required'),
    body('ActionID').isInt().notEmpty().withMessage('ActionID is required'),
    
];
