// Validation/patientVisitValidator.js
const { body } = require('express-validator');

exports.addPatientVisitValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be a positive integer'),

    body('PatientID')
        .notEmpty().withMessage('PatientID is required')
        .isInt({ min: 1 }).withMessage('PatientID must be valid'),

    body('DoctorID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('DoctorID must be valid'),

    body('AppointmentID')
        .optional({ nullable: true  })
        .isInt({ min: 0 }).withMessage('AppointmentID must be valid'),

    body('VisitDate')
        .notEmpty().withMessage('VisitDate is required')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('VisitDate must be valid date'),

    body('VisitTime')
        .notEmpty().withMessage('VisitTime is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
        .withMessage('VisitTime must be in HH:MM or HH:MM:SS format'),

    body('Reason')
        .optional()
        .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),

    body('Symptoms')
        .optional()
        .isLength({ max: 500 }).withMessage('Symptoms cannot exceed 500 characters'),

    body('BPSystolic')
        .optional(),
       // .isInt({ min: 50, max: 250 }).withMessage('BP Systolic must be between 50-250'),

    body('BPDiastolic')
        .optional(),
        //.isInt({ min: 30, max: 150 }).withMessage('BP Diastolic must be between 30-150'),

    body('Temperature')
        .optional(),
        //.isFloat({ min: 90, max: 110 }).withMessage('Temperature should be realistic (90-110°F)'),

    body('Weight')
        .optional()
        //.isFloat({ min: 1, max: 500 }).withMessage('Weight must be between 1 and 500 kg')
];

exports.updatePatientVisitValidatorRules = [
    body('VisitID')
        .notEmpty().withMessage('VisitID is required')
        .isInt({ min: 1 }).withMessage('VisitID must be positive integer'),

     body('DoctorID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('DoctorID must be valid'),

    body('AppointmentID')
        .optional({ nullable: true  })
        .isInt({ min: 0 }).withMessage('AppointmentID must be valid'),

    body('VisitDate')
        .notEmpty().withMessage('VisitDate is required')
        .isDate({ format: 'YYYY-MM-DD' }).withMessage('VisitDate must be valid date'),

    body('VisitTime')
        .notEmpty().withMessage('VisitTime is required')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
        .withMessage('VisitTime must be in HH:MM or HH:MM:SS format'),

    body('Reason')
        .optional()
        .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),

    body('Symptoms')
        .optional()
        .isLength({ max: 500 }).withMessage('Symptoms cannot exceed 500 characters'),

    body('BPSystolic')
        .optional()
        .isInt({ min: 50, max: 250 }).withMessage('BP Systolic must be between 50-250'),

    body('BPDiastolic')
        .optional()
        .isInt({ min: 30, max: 150 }).withMessage('BP Diastolic must be between 30-150'),

    body('Temperature')
        .optional()
        .isFloat({ min: 90, max: 110 }).withMessage('Temperature should be realistic (90-110°F)'),

    body('Weight')
        .optional()
        .isFloat({ min: 1, max: 500 }).withMessage('Weight must be between 1 and 500 kg'),
    body('Status')
        .notEmpty().withMessage('Status is required')
        .isInt().withMessage('Status must be valid'),

    
    
    
];


exports.getPatientVisitListValidatorRules = [
    body('Page')
        .optional().default(1)
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50)
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1-200'),

    body('VisitID').optional().isInt(),
    body('ClinicID').optional().isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('PatientID').optional().isInt({ min: 0 }),
    body('PatientName').optional().isLength({ max: 100 }),
    body('DoctorID').optional().isInt({ min: 0 }),
    body('DoctorName').optional().isLength({ max: 100 }),
    body('AppointmentID').optional().isInt({ min: 0}),
    body('VisitDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('FromVisitDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToVisitDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('Reason').optional().isLength({ max: 500 })
];