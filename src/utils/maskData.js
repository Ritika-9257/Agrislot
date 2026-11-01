function maskAadhaar(aadhar) {
  if (!aadhar || typeof aadhar !== 'string') return null;
  const clean = aadhar.replace(/\D/g, '');
  if (clean.length < 4) return 'XXXX';
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

function maskUPI(upi) {
  if (!upi || typeof upi !== 'string') return null;
  const parts = upi.split('@');
  if (parts.length !== 2) return '****';
  const name = parts[0];
  const handle = parts[1];
  if (name.length <= 2) {
    return `*@${handle}`;
  }
  const maskedName = name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  return `${maskedName}@${handle}`;
}

function maskFarmerProfile(farmer) {
  if (!farmer) return null;
  const result = { ...farmer };
  if (result.Aadhar_No) {
    result.Aadhar_No = maskAadhaar(result.Aadhar_No);
  }
  if (result.UPI_ID) {
    result.UPI_ID = maskUPI(result.UPI_ID);
  }
  return result;
}

module.exports = {
  maskAadhaar,
  maskUPI,
  maskFarmerProfile
};
