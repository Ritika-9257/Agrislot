/**
 * AgriSlot IST (Asia/Kolkata) Date & Time Utilities
 * APMC Mandi operations operate strictly in Indian Standard Time (UTC+05:30).
 */

function getISTDateParts(refDate = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(refDate);
  const getVal = (type) => parts.find(p => p.type === type)?.value;
  return {
    year: parseInt(getVal('year'), 10),
    month: parseInt(getVal('month'), 10),
    day: parseInt(getVal('day'), 10),
    hour: parseInt(getVal('hour'), 10),
    minute: parseInt(getVal('minute'), 10),
    second: parseInt(getVal('second'), 10)
  };
}

function getTodayISTDateString(refDate = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(refDate);
}

function getTomorrowISTDateString(refDate = new Date()) {
  const p = getISTDateParts(refDate);
  const next = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
  return next.toISOString().split('T')[0];
}

function formatToISTDateString(date) {
  if (!date) return null;
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  return getTodayISTDateString(new Date(date));
}

function isPastDateIST(dateStr, refDate = new Date()) {
  const target = formatToISTDateString(dateStr);
  const today = getTodayISTDateString(refDate);
  return target < today;
}

function isSameDayIST(dateStr, refDate = new Date()) {
  const target = formatToISTDateString(dateStr);
  const today = getTodayISTDateString(refDate);
  return target === today;
}

function isAdvanceBookingDateIST(dateStr, refDate = new Date()) {
  const target = formatToISTDateString(dateStr);
  const tomorrow = getTomorrowISTDateString(refDate);
  return target >= tomorrow;
}

module.exports = {
  getISTDateParts,
  getTodayISTDateString,
  getTomorrowISTDateString,
  formatToISTDateString,
  isPastDateIST,
  isSameDayIST,
  isAdvanceBookingDateIST
};
