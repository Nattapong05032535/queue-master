export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString || '-';
  }

  // Use en-GB for dd/mm/yyyy format
  // Using Asia/Bangkok timezone to ensure consistent date for Thai users
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(date);
}
