// Validation/slotValidator.js
const { body } = require('express-validator');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:00$/;

exports.addWorkDaysValidatorRules = [
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),   
    body('EmployeeID').notEmpty().withMessage('EmployeeID is required').isInt({ min: 1 }),
    body('WorkDay').notEmpty().withMessage('WorkDay is required').isInt({ min: 1 ,max:7})
   
    
];


exports.deleteWorkDaysValidatorRules = [
    body('WorkDaysID').notEmpty().withMessage("WorkDaysID Id is required").isInt({ min: 1 })
];

exports.getWorkDaysValidatorRules = [
    body('ClinicID').notEmpty().withMessage('ClinicID is required').isInt({ min: 1 }),   
    body('EmployeeID').notEmpty().withMessage('EmployeeID is required').isInt({ min: 1 })
   
];