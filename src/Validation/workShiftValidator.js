// Validation/workShiftValidator.js
const { body } = require('express-validator');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/; // Accepts HH:MM or HH:MM:SS

exports.addWorkShiftValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('ShiftName')
        .notEmpty().withMessage('ShiftName is required')
        .isLength({ max: 50 }).withMessage('ShiftName should not exceed 50 characters')
        .matches(/^[A-Za-z0-9\s\-_]+$/).withMessage('ShiftName contains invalid characters'),

    body('ShiftTimeStart')
        .notEmpty().withMessage('ShiftTimeStart is required')
        .matches(timeRegex).withMessage('ShiftTimeStart must be a valid time (HH:MM or HH:MM:SS)'),

    body('ShiftTimeEnd')
        .notEmpty().withMessage('ShiftTimeEnd is required')
        .matches(timeRegex).withMessage('ShiftTimeEnd must be a valid time (HH:MM or HH:MM:SS)'),

    body('WorkingHours')
        .notEmpty().withMessage('WorkingHours is required')        
        .isDecimal({ decimal_digits: '0,2' }).withMessage('WorkingHours must be decimal with max 2 places (e.g., 8.50)')
];

exports.updateWorkShiftValidatorRules = [
    body('ShiftID')
        .notEmpty().withMessage('ShiftID is required')
        .isInt({ min: 1 }).withMessage('ShiftID must be a positive integer'),

    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('ShiftName')
        .notEmpty().withMessage('ShiftName is required')
        .isLength({ max: 50 }).withMessage('ShiftName should not exceed 50 characters')
        .matches(/^[A-Za-z0-9\s\-_]+$/).withMessage('ShiftName contains invalid characters'),

    body('ShiftTimeStart')
        .notEmpty().withMessage('ShiftTimeStart is required')
        .matches(timeRegex).withMessage('ShiftTimeStart must be a valid time (HH:MM or HH:MM:SS)'),

    body('ShiftTimeEnd')
        .notEmpty().withMessage('ShiftTimeEnd is required')
        .matches(timeRegex).withMessage('ShiftTimeEnd must be a valid time (HH:MM or HH:MM:SS)'),

    body('WorkingHours')
        .notEmpty().withMessage('WorkingHours is required')   
        .isDecimal({ decimal_digits: '0,2' }).withMessage('WorkingHours must be decimal with max 2 places'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be a valid integer')
];

exports.deleteWorkShiftValidatorRules = [
    body('ShiftID')
        .notEmpty().withMessage('ShiftID is required')
        .isInt({ min: 1 }).withMessage('ShiftID must be a positive integer')
];

exports.getWorkShiftListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be positive integer'),

    body('ShiftID')
        .optional()
        .isInt().withMessage('ShiftID must be a number'),

    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt().withMessage('ClinicID must be a number'),

    body('ShiftName')
        .optional()
        .isLength({ max: 50 }).withMessage('ShiftName search term too long'),

    body('Status')
        .optional()
        .isInt().withMessage('Status must be a number')
];