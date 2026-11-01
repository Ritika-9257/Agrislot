const { z } = require('zod');

const registerFarmerSchema = z.preprocess((val) => {
  if (val && typeof val === 'object') {
    return {
      Name: val.Name !== undefined ? val.Name : (val.Full_Name !== undefined ? val.Full_Name : val.name),
      Phone: val.Phone !== undefined ? val.Phone : (val.Phone_Number !== undefined ? val.Phone_Number : val.phone),
      Aadhar_No: val.Aadhar_No !== undefined ? val.Aadhar_No : (val.Aadhaar_Number !== undefined ? val.Aadhaar_Number : (val.aadhar_no !== undefined ? val.aadhar_no : val.aadhar)),
      UPI_ID: val.UPI_ID !== undefined ? val.UPI_ID : (val.upi_id !== undefined ? val.upi_id : val.upi),
      Village: val.Village !== undefined ? val.Village : val.village,
      Password: val.Password !== undefined ? val.Password : (val.password !== undefined ? val.password : (val.Passcode !== undefined ? val.Passcode : val.passcode))
    };
  }
  return val;
}, z.object({
  Name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  Phone: z.string().trim().regex(/^[0-9]{10}$/, 'Phone number must contain exactly 10 digits'),
  Aadhar_No: z.string().trim().regex(/^[0-9]{12}$/, 'Aadhaar number must contain exactly 12 digits'),
  UPI_ID: z.string().trim().max(50).regex(/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID format (e.g., user@bank)').optional().nullable(),
  Village: z.string().trim().min(2).max(100).optional().nullable(),
  Password: z.string().min(6, 'Password must be at least 6 characters').max(100).optional().nullable()
}));

const farmerIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Farmer ID must be a positive integer').transform(val => parseInt(val, 10))
});

module.exports = {
  registerFarmerSchema,
  farmerIdParamSchema
};
