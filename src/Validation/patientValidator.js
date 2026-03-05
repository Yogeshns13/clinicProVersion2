// Validation/patientValidator.js
const { body } = require('express-validator');

const mobileRegex = /^[6-9]\d{9}$/;
const nameRegex = /^[A-Za-z\s\.\-']+$/;

exports.addPatientValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be valid'),

    body('FirstName')
        .notEmpty().withMessage('FirstName is required')
        .isLength({ max: 50 }).withMessage('FirstName too long')
        .matches(nameRegex).withMessage('Invalid characters in FirstName'),

    body('LastName')
        .optional({ nullable: true })
        .isLength({ max: 50 }).withMessage('LastName too long')
        .matches(nameRegex).withMessage('Invalid characters in LastName'),

    body('Mobile')
        .notEmpty().withMessage('Mobile is required')
        .matches(mobileRegex).withMessage('Invalid mobile number'),

    body('AltMobile')
        .optional()
        .matches(mobileRegex).withMessage('Invalid alternate mobile'),

    body('Gender')
         .notEmpty().withMessage('Gender is required')
        .isInt().withMessage('Gender must be valid ID'),

    body('BirthDate')
        .optional()
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('Invalid BirthDate'),

    body('Age')
        .notEmpty().withMessage('Age is required')       
        .isInt({ min: 0, max: 150 }).withMessage('Age must be realistic'),

    body('BloodGroup')
        .optional()
        .isInt().withMessage('BloodGroup must be valid ID'),

    body('MaritalStatus')
        .optional()
        .isInt().withMessage('MaritalStatus must be valid ID'),

    body('Email')
        .optional()
        .isEmail().withMessage('Invalid email'),

    body('Address')
        .optional()
        .isLength({ max: 500 }).withMessage('Address too long'),

    body('EmergencyContactNo')
        .optional()
        .matches(mobileRegex).withMessage('Invalid emergency contact'),

    body('Allergies')
        .optional()
        .isLength({ max: 500 }),

    body('CurrentMedications')
        .optional()
        .isLength({ max: 500 }),

    body('FamilyPatientID')
        .optional()
        .isInt().withMessage('FamilyPatientID must be number')

  
];

exports.updatePatientValidatorRules = [
    body('PatientID')
        .notEmpty().withMessage('PatientID is required')
        .isInt({ min: 1 }).withMessage('PatientID must be valid'),

    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be valid'),

    // Reuse all rules from add (except ClinicID, BranchID, UniqueSeq)
    ...exports.addPatientValidatorRules.slice(2)
];

exports.deletePatientValidatorRules = [
    body('PatientID')
        .notEmpty().withMessage('PatientID is required')
        .isInt({ min: 1 }).withMessage('PatientID must be valid')
];

exports.getPatientListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }),

    body('PatientID').optional().isInt(),
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt(),
    body('BranchID').optional().isInt(),
    body('FileNo').optional().isLength({ max: 50 }),
    body('Name').optional().isLength({ max: 100 }),
    body('Mobile').optional().isLength({ max: 15 }),
    body('Gender').optional().isInt(),
    body('BloodGroup').optional().isInt(),
    body('FamilyPatientID').optional().isInt(),
    body('Status').optional().isInt()
];