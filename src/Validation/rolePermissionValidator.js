const { body } = require('express-validator');

exports.addRolePermissionValidatorRules = [
    body('RoleID')
        .notEmpty().withMessage('RoleID is required')
        .isInt({ min: 1 }).withMessage('RoleID must be a positive integer'),

    body('PermissionID')
        .notEmpty().withMessage('PermissionID is required')
        .isInt({ min: 1 }).withMessage('PermissionID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.updateRolePermissionStatusValidatorRules = [
    body('RoleID')
        .notEmpty().withMessage('RoleID is required')
        .isInt({ min: 1 }).withMessage('RoleID must be a positive integer'),

    body('PermissionID')
        .notEmpty().withMessage('PermissionID is required')
        .isInt({ min: 1 }).withMessage('PermissionID must be a positive integer'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be an integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.deleteRolePermissionValidatorRules = [
    body('RoleID')
        .notEmpty().withMessage('RoleID is required')
        .isInt({ min: 1 }).withMessage('RoleID must be a positive integer'),

    body('PermissionID')
        .notEmpty().withMessage('PermissionID is required')
        .isInt({ min: 1 }).withMessage('PermissionID must be a positive integer'),

    body('CHANNEL_ID')
        .notEmpty().withMessage('CHANNEL_ID is required')
        .isInt({ min: 1 }).withMessage('CHANNEL_ID must be a positive integer')
];

exports.getRolePermissionListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be a positive integer'),

     body('RoleID')
        .notEmpty().withMessage('RoleID is required')
        .isInt({ min: 0 }).withMessage('RoleID must be a positive integer'),

    body('PermissionID')
        .notEmpty().withMessage('PermissionID is required')
        .isInt({ min: 0 }).withMessage('PermissionID must be a positive integer'),

 
];

exports.getRolePermissionsValidatorRules = [


    body('RoleID')
        .notEmpty().withMessage('RoleID is required')
        .isInt({ min: 1 }).withMessage('RoleID must be a positive integer'),

   
];