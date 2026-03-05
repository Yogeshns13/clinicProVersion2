const { body } = require('express-validator');


const allowedCharactersRegex = /^[A-Za-z0-9]+$/;


exports.textTableValidatorRules = [
  

  body('TableID').notEmpty().withMessage('TableID is required'),
  body('TableID').isInt().withMessage('TableID should be a number') 
 
];

exports.addUserValidatorRules = [
  
  body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  body('ClinicID').isInt().withMessage('ClinicID should be a number'),  

  body('BranchID').notEmpty().withMessage('BranchID is required'),
  body('BranchID').isInt().withMessage('BranchID should be a number'),  

  body('EmployeeID').notEmpty().withMessage('EmployeeID is required'),
  body('EmployeeID').isInt().withMessage('EmployeeID should be a number'),  

  body('UserName').notEmpty().withMessage('UserName is required'),
  body('UserName').isLength({max:20}).withMessage('UserName should not exceed 20 characters'),
  body('UserName').isEmail().withMessage('Invalid email format'),

  body('Mobile').notEmpty().withMessage('Mobile is required'),
  body('Mobile').isLength({max:20}).withMessage('Mobile should not exceed 20 characters'),
  body('Mobile').matches(allowedCharactersRegex).withMessage('Mobile should not contain special characters'),

  body('Password').notEmpty().withMessage('Password is required'),
  body('Password').isLength({max:20}).withMessage('Password should not exceed 20 characters')
  
 
];

exports.updateUserValidatorRules = [
  
  body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  body('ClinicID').isInt().withMessage('ClinicID should be a number'),

  body('UserID').notEmpty().withMessage('EmployeeID is required'),
  body('UserID').isInt().withMessage('EmployeeID should be a number'),  

  body('Mobile').notEmpty().withMessage('Mobile is required'),
  body('Mobile').isLength({max:20}).withMessage('Mobile should not exceed 20 characters'),
  body('Mobile').matches(allowedCharactersRegex).withMessage('Mobile should not contain special characters'),

  body('ProfileName').notEmpty().withMessage('ProfileName is required'),
  body('ProfileName').isLength({max:50}).withMessage('ProfileName should not exceed 50 characters')
  
 
];

exports.suspendUserValidatorRules = [
  
   body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  body('ClinicID').isInt().withMessage('ClinicID should be a number'),

  body('UserName').notEmpty().withMessage('UserName is required'),
  body('UserName').isLength({max:20}).withMessage('UserName should not exceed 20 characters'),
  body('UserName').matches(allowedCharactersRegex).withMessage('UserName should not contain special characters')

  
 
];
exports.updatePwdValidatorRules = [ 

  body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  body('ClinicID').isInt().withMessage('ClinicID should be a number'),


  body('UserId').notEmpty().withMessage('UserId is required'),
  body('UserId').isInt().withMessage('UserId should be a number'),  

  body('Password').notEmpty().withMessage('Password is required'),
  body('Password').isLength({max:20}).withMessage('Password should not exceed 20 characters')
  
 
];

exports.deleteUserValidatorRules = [ 

  body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  body('ClinicID').isInt().withMessage('ClinicID should be a number'),

  
  body('UserId').notEmpty().withMessage('UserId is required'),
  body('UserId').isInt().withMessage('UserId should be a number') 
   
];

exports.loginValidatorRules = [
  
  //body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  //body('ClinicID').isInt().withMessage('ClinicID should be a number'),

  body('UserName').notEmpty().withMessage('UserName is required'),
  body('UserName').isLength({max:100}).withMessage('UserName should not exceed 100 characters'),
  //body('UserName').matches(allowedCharactersRegex).withMessage('UserName should not contain special characters'),
  body('UserName').isEmail().withMessage('Please Enter valid email as User'),

  body('Password').notEmpty().withMessage('Password is required'),
  body('Password').isLength({max:20}).withMessage('Password should not exceed 20 characters')

 
];

exports.renewTokenValidatorRules = [  

  body('UserId').notEmpty().withMessage('UserId is required'),
  body('UserId').isInt().withMessage('UserId should be a number') ,

  //body('RefreshToken').notEmpty().withMessage('RefreshToken is required'),
  //body('RefreshToken').isLength({max:1000}).withMessage('RefreshToken should not exceed 1000 characters')
 
];

exports.deleteFileValidatorRules = [  

  body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  body('ClinicID').isInt().withMessage('ClinicID should be a number'),

  body('FileId').notEmpty().withMessage('FileId is required'),
  body('FileId').isInt().withMessage('FileId should be a number') 
 
];

exports.getUserValidatorRules = [ 
  
  body('UserId').notEmpty().withMessage('UserId is required'),
  body('UserId').isInt().withMessage('UserId should be a number') 
   
];
exports.getUserListValidatorRules = [   

  
  body('Page').notEmpty().withMessage('Page is required'),
  body('Page').isInt().withMessage('Page should be a number') ,

  body('PageSize').notEmpty().withMessage('PageSize is required'),
  body('PageSize').isInt().withMessage('PageSize should be a number') ,

  body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  body('ClinicID').isInt().withMessage('ClinicID should be a number') ,

   
];
exports.getFileListValidatorRules = [ 
  
  body('StudentId').notEmpty().withMessage('StudentId is required'),
  body('StudentId').isInt().withMessage('StudentId should be a number') ,

  body('Status').notEmpty().withMessage('Status is required'),
  body('Status').isInt().withMessage('Status should be a number') 
   
];
