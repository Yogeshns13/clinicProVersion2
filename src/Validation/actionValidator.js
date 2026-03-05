const { body } = require('express-validator');

exports.addActionValidatorRules = [
    body('ActionName')
        .notEmpty().withMessage('ActionName is required')
        .isLength({ min: 2, max: 50 }).withMessage('ActionName must be between 2 and 50 characters')
        .matches(/^[A-Za-z0-9\s\-_]+$/).withMessage('ActionName contains invalid characters'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.updateActionValidatorRules = [
    body('ActionID')
        .notEmpty().withMessage('ActionID is required')
        .isInt({ min: 1 }).withMessage('ActionID must be a positive integer'),

    body('ActionName')
        .notEmpty().withMessage('ActionName is required')
        .isLength({ min: 2, max: 50 }).withMessage('ActionName must be between 2 and 50 characters'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.deleteActionValidatorRules = [
    body('ActionID')
        .notEmpty().withMessage('ActionID is required')
        .isInt({ min: 1 }).withMessage('ActionID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.getActionListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be a positive integer'),

    body('ActionID').isInt().notEmpty().withMessage('ActionID is required'),
    body('ActionName').isLength({ max: 50 }).optional().withMessage('ActionName must be at most 50 characters'),
];