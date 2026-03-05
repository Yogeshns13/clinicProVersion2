// Validation/labTestWorkItemValidator.js
const { body } = require('express-validator');

exports.CreateWorkItemsForOrderValidatorRules = [
   body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be valid'),

    body('OrderID')
        .notEmpty().withMessage('OrderID is required')
        .isInt({ min: 1 }).withMessage('OrderID must be valid')

   
];
exports.updateSampleCollectionValidatorRules = [
    body('WorkID')
        .notEmpty().withMessage('WorkID is required')
        .isInt({ min: 1 }).withMessage('WorkID must be valid'),

    body('SampleCollectedTime')
        .notEmpty().withMessage('SampleCollectedTime is required')
        .isISO8601().toDate().withMessage('Must be valid datetime'),

    body('SampleCollectedPlace')
        .optional()
        .isLength({ max: 100 }).withMessage('SampleCollectedPlace too long')
];

exports.updateLabWorkItemResultValidatorRules = [
    body('WorkID')
        .notEmpty().withMessage('WorkID is required')
        .isInt({ min: 1 }),

    body('ResultValue')
        .notEmpty().withMessage('ResultValue is required')
        .isLength({ max: 500 }),

    body('ResultUnits')
        .optional()
        .isLength({ max: 30 }),

    body('NormalRange')
        .optional()
        .isLength({ max: 100 }),

    body('Interpretation')
        .optional().default(1)
        .isInt({ min: 1 }),

    body('Remarks')
        .optional()
        .isLength({ max: 2000 }),

    body('TestDoneBy')
        .notEmpty().withMessage('TestDoneBy (Technician) is required')
        .isInt({ min: 1 })
];

exports.approveLabWorkItemValidatorRules = [
    body('WorkID')
        .notEmpty().withMessage('WorkID is required')
        .isInt({ min: 1 }),

    body('TestApprovedBy')
        .notEmpty().withMessage('Approver ID is required')
        .isInt({ min: 1 }),

    body('ApprovalRemarks')
        .optional()
        .isLength({ max: 1000 })
];

exports.rejectLabWorkItemValidatorRules = [
    body('WorkID')
        .notEmpty().withMessage('WorkID is required')
        .isInt({ min: 1 }),

    body('TestApprovedBy')
        .notEmpty().withMessage('Approver ID is required')
        .isInt({ min: 1 }),

    body('RejectReason')
        .notEmpty().withMessage('RejectReason is required')
        .isLength({ min: 1, max: 1000 })
];
exports.getWorkItemListValidatorRules = [
    body('Page')
        .optional().default(1)
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50)
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1-200'),

    body('ClinicID').optional().isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('Status').optional().isInt(),   
    body('PatientID').optional().isInt({ min: 0 }),    
    body('DoctorID').optional().isInt({ min: 0 }),
    body('TestID').optional().isInt({ min: 0 }),
    body('OrderID').optional().isInt({ min: 0 }),
    body('FromDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),
    body('ToDate').optional({ nullable: true,checkFalsy: true  }).isDate({ format: 'YYYY-MM-DD' }),  
    body('Search').optional().isLength({ max: 100 }),
];