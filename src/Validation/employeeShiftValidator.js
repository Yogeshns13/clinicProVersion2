// Validation/employeeShiftValidator.js
const { body } = require('express-validator');

exports.addEmployeeShiftValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('EmployeeID')
        .notEmpty().withMessage('EmployeeID is required')
        .isInt({ min: 1 }).withMessage('EmployeeID must be a positive integer'),

    body('ShiftID')
        .notEmpty().withMessage('ShiftID is required')
        .isInt({ min: 1 }).withMessage('ShiftID must be a positive integer')
];

exports.deleteEmployeeShiftValidatorRules = [
    body('ShiftMapID')
        .notEmpty().withMessage('ShiftMapID is required')
        .isInt({ min: 1 }).withMessage('ShiftMapID must be a positive integer')
];

exports.getEmployeeShiftsValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1}).withMessage('PageSize must be positive Number'),

    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('EmployeeID')
        .optional()
        .isInt().withMessage('EmployeeID must be a number'),

    body('ShiftID')
        .optional()
        .isInt().withMessage('ShiftID must be a number')
];
