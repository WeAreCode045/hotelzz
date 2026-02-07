export const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

export const getDaysArray = (start: Date, days: number): string[] => {
  const arr = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    arr.push(d.toISOString().split('T')[0]);
  }
  return arr;
};

export const getDateDiff = (start: string, end: string): number => {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
};

export const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const isSameDate = (d1: string, d2: string) => d1 === d2;

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'Confirmed': return 'bg-blue-500 border-blue-600 text-white';
    case 'Checked In': return 'bg-green-500 border-green-600 text-white';
    case 'Checked Out': return 'bg-gray-400 border-gray-500 text-white';
    case 'Cancelled': return 'bg-red-400 border-red-500 text-white line-through';
    case 'Clean': return 'bg-green-100 text-green-800';
    case 'Dirty': return 'bg-red-100 text-red-800';
    case 'Inspected': return 'bg-blue-100 text-blue-800';
    case 'Out of Order': return 'bg-gray-800 text-gray-200';
    default: return 'bg-gray-500 text-white';
  }
};
