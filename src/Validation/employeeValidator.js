// Validation/employeeValidator.js
const { body } = require('express-validator');

const nameRegex = /^[A-Za-z\s\.\-']+$/;
const mobileRegex = /^[6-9]\d{9}$/; // Indian mobile format (or adjust as needed)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.addEmployeeValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be a positive integer'),

    body('EmployeeCode')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 20 }).withMessage('EmployeeCode cannot exceed 20 characters')
        .matches(/^[A-Za-z0-9\-_]+$/).withMessage('EmployeeCode contains invalid characters'),

    body('FirstName')
        .notEmpty().withMessage('FirstName is required')
        .isLength({ max: 50 }).withMessage('FirstName too long')
        .matches(nameRegex).withMessage('FirstName contains invalid characters'),

    body('LastName')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 50 }).withMessage('LastName too long')
        .matches(nameRegex).withMessage('LastName contains invalid characters'),

    body('Gender')
        .notEmpty().withMessage('Gender is required')
        .isInt({ min: 1 }).withMessage('Gender must be valid ID from text table'),

    body('BirthDate')
        .notEmpty().withMessage('BirthDate is required')
        .isDate().withMessage('BirthDate must be a valid date (YYYY-MM-DD)'),

    body('Address')
        .notEmpty().withMessage('Address is required')
        .isLength({ max: 1000 }).withMessage('Address too long'),

    body('Mobile')
        .notEmpty().withMessage('Mobile is required')
        .isLength({ max: 10 }).withMessage('Mobile length should be 10')
        .matches(mobileRegex).withMessage('Invalid mobile number'),

    body('AltMobile')
        .optional()
        .isLength({ max: 10 }).withMessage('AltMobile length should be 10')
        .matches(mobileRegex).withMessage('Invalid alternate mobile number'),

    body('Email')
        .optional()
        .isEmail().withMessage('Invalid email format'),

    /*
    body('IdProofType')
        .notEmpty().withMessage('IdProofType is required')
        .isInt({ min: 1 }).withMessage('Valid IdProofType required'),

    body('IdNumber')
        .notEmpty().withMessage('IdNumber is required')
        .isLength({ min: 1, max: 50 }).withMessage('IdNumber too long'),
*/
    body('DepartmentID')
        .optional()
        .isInt({ min: 1 }).withMessage('DepartmentID must be valid'),

    body('Designation')
        .optional()
        .isInt({ min: 1 }).withMessage('Designation must be valid ID'),

    body('ShiftID')
        .optional()
        .isInt({ min: 0 }).withMessage('ShiftID must be valid'),

    body('UniqueSeq')
        .optional()
        .isInt().withMessage('UniqueSeq must be a number')
];

exports.updateEmployeeValidatorRules = [
    body('EmployeeID')
        .notEmpty().withMessage('EmployeeID is required')
        .isInt({ min: 1 }).withMessage('EmployeeID must be a positive integer'),

    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be valid'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be a valid integer'),

    // Re-validate all other fields same as Add
    ...exports.addEmployeeValidatorRules.slice(2) // Reuse from index 2 onward
];

exports.deleteEmployeeValidatorRules = [
    body('EmployeeID')
        .notEmpty().withMessage('EmployeeID is required')
        .isInt({ min: 1 }).withMessage('EmployeeID must be a positive integer')
];

exports.getEmployeeListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be positive'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be positive integer'),

    body('EmployeeID').optional().isInt(),
    body('ClinicID') .notEmpty().withMessage('ClinicID is required'),
    body('BranchID').optional().isInt(),
    body('DepartmentID').optional().isInt(),
    body('Designation').optional().isInt(),
    body('Name').optional().isLength({ max: 100 }),
    body('Mobile').optional().isLength({ max: 15 }),
    body('EmployeeCode').optional().isLength({ max: 20 }),
    body('Status').optional().isInt()
];