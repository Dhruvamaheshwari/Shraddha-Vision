const generateCSV = (headers, dataRows) => {
  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '';
    const s = String(str);
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const BOM = '\uFEFF';
  const headerRow = headers.map(escapeCsv).join(',');
  const bodyRows = dataRows.map(row => row.map(escapeCsv).join(',')).join('\n');
  return BOM + headerRow + '\n' + bodyRows;
};

module.exports = { generateCSV };
