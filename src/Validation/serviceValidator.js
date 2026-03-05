const { body } = require('express-validator');

exports.addServiceValidatorRules = [
    body('ServiceName')
        .notEmpty().withMessage('ServiceName is required')
        .isLength({ min: 2, max: 100 }).withMessage('ServiceName must be between 2 and 100 characters')
        .matches(/^[A-Za-z0-9\s\-_]+$/).withMessage('ServiceName contains invalid characters'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.updateServiceValidatorRules = [
    body('ServiceID')
        .notEmpty().withMessage('ServiceID is required')
        .isInt({ min: 1 }).withMessage('ServiceID must be a positive integer'),

    body('ServiceName')
        .notEmpty().withMessage('ServiceName is required')
        .isLength({ min: 2, max: 100 }).withMessage('ServiceName must be between 2 and 100 characters'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.deleteServiceValidatorRules = [
    body('ServiceID')
        .notEmpty().withMessage('ServiceID is required')
        .isInt({ min: 1 }).withMessage('ServiceID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.getServiceListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be a positive integer'),

    body('ServiceID').isInt().notEmpty().withMessage('ServiceID is required'),
    body('ServiceName').isLength({ max: 100 }).withMessage('ServiceName must be at most 100 characters'),

];
