export const downloadBlob = (data: string | Blob, filename: string) => {
  const blob = typeof data === 'string' ? new Blob([data], { type: 'text/csv;charset=utf-8;' }) : data;
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
