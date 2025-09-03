import { objectIdToDate } from './objectId';

describe('objectIdToDate', () => {
  test('returns null for invalid', () => {
    expect(objectIdToDate('')).toBeNull();
    expect(objectIdToDate('zzzzzzzz')).toBeNull();
  });

  test('parses timestamp from oid', () => {
    // Construct an ObjectId-like string from a known timestamp
    const ts = Math.floor(new Date('2020-01-01T00:00:00Z').getTime() / 1000);
    const tsHex = ts.toString(16).padStart(8, '0');
    const fakeOid = tsHex + 'abcdefabcdefabcdefab'.slice(0, 16);
    const d = objectIdToDate(fakeOid);
    expect(d).not.toBeNull();
    expect(d.toISOString().startsWith('2020-01-01')).toBe(true);
  });
});
