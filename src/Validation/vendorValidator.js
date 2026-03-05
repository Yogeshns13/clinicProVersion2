// Validation/vendorValidator.js
const { body } = require('express-validator');

const mobileRegex = /^[6-9]\d{9}$/; // Indian mobile
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

exports.addVendorValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),
    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),
    body('Name')
        .notEmpty().withMessage('Vendor name is required')
        .trim()
        .isLength({ min: 1, max: 500 }).withMessage('Name must be 1–500 characters'),
    body('ContactPerson')
        .optional({ nullable: true })
        .isLength({ max: 300 }).withMessage('Contact person name too long'),
    body('Mobile')
        .notEmpty().withMessage('Mobile is required')
        .matches(mobileRegex).withMessage('Invalid mobile number'),
    body('AltMobile')
        .optional()
        .matches(mobileRegex).withMessage('Invalid alternate mobile'),
    body('Email')
        .optional()
        .isEmail().withMessage('Invalid email format')
        .isLength({ max: 500 }),
    body('Address')
        .optional()
        .isLength({ max: 500 }).withMessage('Address too long'),
    body('GSTNo')
        .optional()
        .isLength({ max: 50 })
        .matches(gstRegex).withMessage('Invalid GST number format'),
    body('LicenseDetail')
        .optional()
        .isLength({ max: 500 })
];

exports.updateVendorValidatorRules = [
    body('VendorID')
        .notEmpty().withMessage('VendorID is required')
        .isInt({ min: 1 }).withMessage('Valid VendorID required'),
    body('Status')
        .optional()
        .isInt().withMessage('Status must be integer'),
    // Reuse add rules but make all fields optional except VendorID
    ...exports.addVendorValidatorRules.map(rule => rule.optional({ nullable: true }))
];

exports.deleteVendorValidatorRules = [
    body('VendorID')
        .notEmpty().withMessage('VendorID is required')
        .isInt({ min: 1 }).withMessage('Valid VendorID required')
];

exports.getVendorListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }),
    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1, max: 200 }),
    body('VendorID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),
    body('BranchID').optional().isInt(),
    body('Name').optional().isLength({ max: 500 }),
    body('ContactPerson').optional().isLength({ max: 300 }),
    body('Mobile').optional().isLength({ max: 50 }),
    body('GSTNo').optional().isLength({ max: 50 }),
    body('Status').optional().isInt()
];