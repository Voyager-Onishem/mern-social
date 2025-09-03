// Extract approximate creation Date from a MongoDB ObjectId string
export function objectIdToDate(oid) {
  if (!oid || typeof oid !== 'string' || oid.length < 8) return null;
  try {
    const tsHex = oid.substring(0, 8);
    const seconds = parseInt(tsHex, 16);
    if (Number.isNaN(seconds)) return null;
    return new Date(seconds * 1000);
  } catch {
    return null;
  }
}

export default objectIdToDate;
