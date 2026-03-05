const { body } = require('express-validator');

// ========================================
// ROLE VALIDATORS
// ========================================

exports.addRoleValidatorRules = [
    body('RoleName')
        .notEmpty().withMessage('RoleName is required')
        .isLength({ min: 2, max: 100 }).withMessage('RoleName must be between 2 and 100 characters')
        .matches(/^[A-Za-z0-9\s\-_]+$/).withMessage('RoleName contains invalid characters'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.updateRoleValidatorRules = [
    body('RoleID')
        .notEmpty().withMessage('RoleID is required')
        .isInt({ min: 1 }).withMessage('RoleID must be a positive integer'),

    body('RoleName')
        .notEmpty().withMessage('RoleName is required')
        .isLength({ min: 2, max: 100 }).withMessage('RoleName must be between 2 and 100 characters'),

    body('IsActive')
        .optional()
        .isInt({ min: 0, max: 1 }).withMessage('IsActive must be 0 or 1'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.deleteRoleValidatorRules = [
    body('RoleID')
        .notEmpty().withMessage('RoleID is required')
        .isInt({ min: 1 }).withMessage('RoleID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.getRoleListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be a positive integer'),

    body('RoleID').isInt().notEmpty().withMessage('RoleID is required'),
    body('RoleName').isLength({ max: 100 }).withMessage('RoleName must be at most 100 characters'),
    body('IsActive').isInt({ min: -1, max: 1 }).notEmpty().withMessage('IsActive is required'),
    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];
