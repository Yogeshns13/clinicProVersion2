// Validation/consultationValidator.js
const { body } = require('express-validator');

exports.addConsultationValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be positive integer'),

    body('VisitID')
        .notEmpty().withMessage('VisitID is required')
        .isInt({ min: 1 }).withMessage('VisitID must be valid'),

    body('PatientID')
        .notEmpty().withMessage('PatientID is required')
        .isInt({ min: 1 }).withMessage('PatientID must be valid'),

    body('DoctorID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('DoctorID must be valid'),

    body('Reason')
        .optional()
        .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),

    body('Symptoms')
        .optional()
        .isLength({ max: 500 }).withMessage('Symptoms cannot exceed 500 characters'),

    body('BPSystolic')
        .optional()
        .isInt({ min: 50, max: 250 }).withMessage('BP Systolic must be realistic'),

    body('BPDiastolic')
        .optional()
        .isInt({ min: 30, max: 150 }).withMessage('BP Diastolic must be realistic'),

    body('Temperature')
        .optional()
        .isFloat({ min: 90, max: 110 }).withMessage('Temperature should be in valid range'),

    body('Weight')
        .optional()
        .isFloat({ min: 1, max: 500 }).withMessage('Weight must be between 1 and 500 kg'),

    body('EMRNotes')
        .optional()
        .isLength({ max: 65535 }).withMessage('EMR Notes too long'),

    body('EHRNotes')
        .optional()
        .isLength({ max: 65535 }).withMessage('EHR Notes too long'),

    body('Instructions')
        .optional()
        .isLength({ max: 65535 }).withMessage('Instructions too long'),

    body('ConsultationNotes')
        .optional()
        .isLength({ max: 65535 }).withMessage('Consultation Notes too long'),

    body('NextConsultationDate')       
       .optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),

    body('TreatmentPlan')
        .optional()
        .isLength({ max: 65535 }).withMessage('Treatment Plan too long')
];

exports.updateConsultationValidatorRules = [
    body('ConsultationID')
        .notEmpty().withMessage('ConsultationID is required')
        .isInt({ min: 1 }).withMessage('ConsultationID must be positive integer'),

    // All fields optional in update (partial update via COALESCE in SP)
    ...exports.addConsultationValidatorRules.slice(4) // Skip ClinicID, BranchID, VisitID, PatientID
];

exports.getConsultationListValidatorRules = [
    body('Page')
        .optional().default(1)
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50)
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1-200'),

    body('ConsultationID').optional().isInt({ min: 0 }),
    body('ClinicID').optional().isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('VisitID').optional().isInt({ min: 0 }),
    body('PatientID').optional().isInt({ min: 0 }),
    body('PatientName').optional().isLength({ max: 100 }),
    body('DoctorID').optional().isInt({ min: 0 }),
    body('DoctorName').optional().isLength({ max: 100 }),
    body('FromDate') .optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate') .optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('NextConsultationDate') .optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('InvoiceID').optional().isInt()
];