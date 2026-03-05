// Validation/appointmentValidator.js
const { body } = require('express-validator');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:00$/;

exports.addAppointmentValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be valid'),

    body('PatientID')
        .notEmpty().withMessage('PatientID is required')
        .isInt({ min: 1 }).withMessage('PatientID must be valid'),

    body('DoctorID')
        .notEmpty().withMessage('DoctorID is required')
        .isInt({ min: 1 }).withMessage('DoctorID must be valid'),

    body('SlotID')
        .notEmpty().withMessage('SlotID is required')
        .isInt({ min: 1 }).withMessage('SlotID must be Positive Integer'),

  
    body('Reason')
        .optional({ nullable: true })
        .isLength({ max: 500 }).withMessage('Reason too long')

   
];

exports.cancelAppointmentValidatorRules = [
    body('AppointmentID')
        .notEmpty().withMessage('AppointmentID is required')
        .isInt({ min: 1 }).withMessage('AppointmentID must be valid')
];

exports.getAppointmentListValidatorRules = [
    body('Page')
        .notEmpty().withMessage('Page is required')
        .isInt({ min: 1 }).withMessage('Page must be positive'),

    body('PageSize')
        .notEmpty().withMessage('PageSize is required')
        .isInt({ min: 1 }).withMessage('PageSize must be positive Integer'),

    body('AppointmentID')
       .optional({ nullable: true,checkFalsy: true  })        
        .isInt().withMessage('AppointmentID must be a number'),

    body('ClinicID')
       .notEmpty().withMessage('ClinicID is required')
        .isInt().withMessage('ClinicID must be a number'),

    body('BranchID')
       .optional({ nullable: true,checkFalsy: true  })
        .isInt().withMessage('BranchID must be a number'),

    body('PatientID')
        .optional({ nullable: true,checkFalsy: true  })
        .isInt().withMessage('PatientID must be a number'),

    body('PatientName')
        .optional({ nullable: true,checkFalsy: true  })
        .isLength({ max: 100 }).withMessage('PatientName search too long'),

    body('DoctorID')
        .optional({ nullable: true,checkFalsy: true  })
        .isInt().withMessage('DoctorID must be a number'),

    body('DoctorName')
        .optional({ nullable: true,checkFalsy: true  })
        .isLength({ max: 100 }).withMessage('DoctorName search too long'),

    body('AppointmentDate')
       .optional({ nullable: true,checkFalsy: true  })
        .isDate({ format: 'YYYY-MM-DD' }),

    body('FromDate')
       .optional({ nullable: true,checkFalsy: true  })
        .isDate({ format: 'YYYY-MM-DD' }),

    body('ToDate')
        .optional({ nullable: true,checkFalsy: true  })
        .isDate({ format: 'YYYY-MM-DD' }),

    body('SlotID')
        .optional({ nullable: true,checkFalsy: true  })
        .isInt().withMessage('SlotID must be a number'),

    body('Status')
        .optional()
        .isInt().withMessage('Status must be a number')
];