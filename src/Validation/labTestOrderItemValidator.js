// Validation/labTestOrderItemValidator.js
const { body } = require('express-validator');

exports.addLabTestOrderItemValidatorRules = [
    body('ClinicID')
        .notEmpty().withMessage('ClinicID is required')
        .isInt({ min: 1 }).withMessage('ClinicID must be a valid positive integer'),

    body('BranchID')
        .notEmpty().withMessage('BranchID is required')
        .isInt({ min: 1 }).withMessage('BranchID must be a valid positive integer'),

    body('OrderID')
        .notEmpty().withMessage('OrderID is required')
        .isInt({ min: 1 }).withMessage('OrderID must be a valid positive integer'),

    body('PatientID')
        .notEmpty().withMessage('PatientID is required')
        .isInt({ min: 1 }).withMessage('PatientID must be a valid positive integer'),

    body('DoctorID')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('DoctorID must be a valid positive integer if provided'),
    
    body('TestID')
        .optional({ nullable: true })
        .custom((value, { req }) => {
            const testVal = value == null ? null : Number(value);
            const packageVal = req.body.PackageID == null ? null : Number(req.body.PackageID);

            const hasTest = testVal !== null && Number.isInteger(testVal) && testVal > 0;
            const hasPackage = packageVal !== null && Number.isInteger(packageVal) && packageVal > 0;

            if (hasTest && hasPackage) {
                throw new Error('Cannot provide both TestID and PackageID');
            }
            if (!hasTest && !hasPackage) {
                throw new Error('Either TestID or PackageID is required (must be > 0)');
            }
            if (hasTest && !Number.isInteger(testVal)) {
                throw new Error('TestID must be a valid positive integer');
            }
            return true;
        }),

    body('PackageID')
        .optional({ nullable: true })
        .custom((value, { req }) => {
            const testVal = req.body.TestID == null ? null : Number(req.body.TestID);
            const packageVal = value == null ? null : Number(value);

            const hasTest = testVal !== null && Number.isInteger(testVal) && testVal > 0;
            const hasPackage = packageVal !== null && Number.isInteger(packageVal) && packageVal > 0;

            if (hasTest && hasPackage) {
                throw new Error('Cannot provide both TestID and PackageID');
            }
            if (!hasTest && !hasPackage) {
                throw new Error('Either TestID or PackageID is required (must be > 0)');
            }
            if (hasPackage && !Number.isInteger(packageVal)) {
                throw new Error('PackageID must be a valid positive integer');
            }
            return true;
        })
];

exports.updateLabTestOrderItemValidatorRules = [
    body('ItemID')
        .notEmpty().withMessage('ItemID is required')
        .isInt({ min: 1 }).withMessage('ItemID must be valid'),

    body('Status')
        .optional()
        .isInt({ min: 1 }).withMessage('Status must be valid')
];

exports.getLabTestOrderItemListValidatorRules = [
    body('Page')
        .optional().default(1)
        .isInt({ min: 1 }).withMessage('Page must be >= 1'),

    body('PageSize')
        .optional().default(50)
        .isInt({ min: 1, max: 200 }).withMessage('PageSize must be 1-200'),

    body('ItemID').optional().isInt({ min: 0 }),
    body('ClinicID').optional().isInt({ min: 1 }),
    body('BranchID').optional().isInt({ min: 1 }),
    body('OrderID').optional().isInt({ min: 0 }),
    body('PatientID').optional().isInt({ min: 0 }),
    body('PatientName').optional().isLength({ max: 100 }),
    body('TestID').optional().isInt({ min: 0 }), 
    body('TestName').optional().isLength({ max: 150 }),
    body('Status').optional().isInt(),  
    body('TechnicianID').optional().isInt({ min: 0 }),
    body('ApproverID').optional().isInt({ min: 0 })  
];