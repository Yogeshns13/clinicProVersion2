const { body } = require('express-validator');


const allowedCharactersRegex = /^[A-Za-z0-9 ]+$/;




exports.addClinicValidatorRules = [
  

  body('ClinicName').notEmpty().withMessage('ClinicName is required'),
  body('ClinicName').isLength({max:100}).withMessage('ClinicName should not exceed 100 characters'),
  body('ClinicName').matches(allowedCharactersRegex).withMessage('ClinicName should not contain special characters'),

  body('Address').notEmpty().withMessage('Address is required'),
  body('Address').isLength({max:500}).withMessage('Address should not exceed 500 characters'),

  body('Location').notEmpty().withMessage('Location is required'),
  body('Location').isLength({max:500}).withMessage('Location should not exceed 500 characters'),

  body('ClinicType').notEmpty().withMessage('ClinicType is required'),
  body('ClinicType').isLength({max:500}).withMessage('ClinicType should not exceed 500 characters'),

  body('GstNo').notEmpty().withMessage('GstNo is required'),
  body('GstNo').isLength({max:50}).withMessage('GstNo should not exceed 50 characters'),
  
  body('CgstPercentage').notEmpty().withMessage('CgstPercentage is required'),
  body('CgstPercentage').isDecimal().withMessage('CgstPercentage should be a decimal'),

  body('SgstPercentage').notEmpty().withMessage('SgstPercentage is required'),
  body('SgstPercentage').isDecimal().withMessage('SgstPercentage should be a decimal'),

  body('OwnerName').notEmpty().withMessage('OwnerName is required'),
  body('OwnerName').isLength({max:100}).withMessage('OwnerName should not exceed 100 characters'),
  body('OwnerName').matches(allowedCharactersRegex).withMessage('OwnerName should not contain special characters'),

  body('Mobile').notEmpty().withMessage('Mobile is required'),
  body('Mobile').isLength({max:20}).withMessage('Mobile should not exceed 20 characters'),
  body('Mobile').matches(allowedCharactersRegex).withMessage('Mobile should not contain special characters'),

  body('AltMobile').notEmpty().withMessage('AltMobile is required'),
  body('AltMobile').isLength({max:20}).withMessage('AltMobile should not exceed 20 characters'),
  body('AltMobile').matches(allowedCharactersRegex).withMessage('AltMobile should not contain special characters'),

   body('Email').isEmail().withMessage('Valid email is required'),
  
  body('FileNoPrefix').isLength({max:10}).withMessage('FileNoPrefix should not exceed 10 characters'),
  
  body('LastFileSeq').notEmpty().withMessage('LastFileSeq is required'),
  body('LastFileSeq').isInt().withMessage('LastFileSeq should be a number'),

  body('InvoicePrefix').isLength({max:10}).withMessage('InvoicePrefix should not exceed 10 characters')
 
];

exports.updateClinicValidatorRules = [
  
  body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  body('ClinicID').isInt().withMessage('ClinicID should be a number'),

  body('ClinicName').notEmpty().withMessage('ClinicName is required'),
  body('ClinicName').isLength({max:100}).withMessage('ClinicName should not exceed 100 characters'),
  body('ClinicName').matches(allowedCharactersRegex).withMessage('ClinicName should not contain special characters'),

  body('Address').notEmpty().withMessage('Address is required'),
  body('Address').isLength({max:500}).withMessage('Address should not exceed 500 characters'),

  body('Location').notEmpty().withMessage('Location is required'),
  body('Location').isLength({max:500}).withMessage('Location should not exceed 500 characters'),

  body('ClinicType').notEmpty().withMessage('ClinicType is required'),
  body('ClinicType').isLength({max:500}).withMessage('ClinicType should not exceed 500 characters'),

  body('GstNo').notEmpty().withMessage('GstNo is required'),
  body('GstNo').isLength({max:50}).withMessage('GstNo should not exceed 50 characters'),
  
  body('CgstPercentage').notEmpty().withMessage('CgstPercentage is required'),
  body('CgstPercentage').isDecimal().withMessage('CgstPercentage should be a decimal'),

  body('SgstPercentage').notEmpty().withMessage('SgstPercentage is required'),
  body('SgstPercentage').isDecimal().withMessage('SgstPercentage should be a decimal'),

  body('OwnerName').notEmpty().withMessage('OwnerName is required'),
  body('OwnerName').isLength({max:100}).withMessage('OwnerName should not exceed 100 characters'),
  body('OwnerName').matches(allowedCharactersRegex).withMessage('OwnerName should not contain special characters'),

  body('Mobile').notEmpty().withMessage('Mobile is required'),
  body('Mobile').isLength({max:20}).withMessage('Mobile should not exceed 20 characters'),
  body('Mobile').matches(allowedCharactersRegex).withMessage('Mobile should not contain special characters'),

  body('AltMobile').notEmpty().withMessage('AltMobile is required'),
  body('AltMobile').isLength({max:20}).withMessage('AltMobile should not exceed 20 characters'),
  body('AltMobile').matches(allowedCharactersRegex).withMessage('AltMobile should not contain special characters'),

  body('Email').isEmail().withMessage('Valid email is required'),
  
  body('Status').notEmpty().withMessage('Status is required'),
  body('Status').isInt().withMessage('Status should be a number')

];

exports.deleteClinicValidatorRules = [
  
  body('ClinicID').notEmpty().withMessage('ClinicID is required'),
  body('ClinicID').isInt().withMessage('ClinicID should be a number')


];
exports.getCliniclISTValidatorRules = [

   body('Page').notEmpty().withMessage('Page is required'),
  body('Page').isInt().withMessage('Page should be a number') ,

  body('PageSize').notEmpty().withMessage('PageSize is required'),
  body('PageSize').isInt().withMessage('PageSize should be a number'),
  
  
  body('ClinicID').isInt().withMessage('ClinicID should be a number'),

  //body('ClinicName').optional({ nullable: true }),
  body('ClinicName').isLength({max:100}).withMessage('ClinicName should not exceed 100 characters'),
  body('ClinicName').optional({ nullable: true , checkFalsy: true }).matches(allowedCharactersRegex).withMessage('ClinicName should not contain special characters'),

  body('Mobile').optional({ nullable: true }),
  body('Mobile').isLength({max:20}).withMessage('Mobile should not exceed 20 characters'),
  body('Mobile').optional({ nullable: true , checkFalsy: true }).matches(allowedCharactersRegex).withMessage('Mobile should not contain special characters'),

  
  body('GstNo').isLength({max:50}).withMessage('GstNo should not exceed 50 characters')


];

