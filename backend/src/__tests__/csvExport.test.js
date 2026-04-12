/**
 * CSV Export Utility Unit Tests
 */

const { arrayToCSV, escapeCSVField, getNestedValue } = require('../utils/csvExport');

describe('escapeCSVField', () => {
  test('Returns empty string for null/undefined', () => {
    expect(escapeCSVField(null)).toBe('');
    expect(escapeCSVField(undefined)).toBe('');
  });
  
  test('Handles simple strings without special characters', () => {
    expect(escapeCSVField('simple')).toBe('simple');
    expect(escapeCSVField('Hello World')).toBe('Hello World');
  });
  
  test('Wraps and escapes fields with commas', () => {
    expect(escapeCSVField('Last, First')).toBe('"Last, First"');
  });
  
  test('Wraps and escapes fields with quotes', () => {
    expect(escapeCSVField('Say "Hello"')).toBe('"Say ""Hello"""');
  });
  
  test('Wraps fields with newlines', () => {
    expect(escapeCSVField('Line1\nLine2')).toBe('"Line1\nLine2"');
  });
  
  test('Handles numbers', () => {
    expect(escapeCSVField(123)).toBe('123');
  });
});

describe('getNestedValue', () => {
  const obj = {
    name: 'John',
    user: {
      email: 'john@test.com',
      profile: {
        role: 'Admin'
      }
    },
    date: new Date('2024-03-01'),
    count: 0,
    empty: null
  };
  
  test('Gets simple property', () => {
    expect(getNestedValue(obj, 'name')).toBe('John');
  });
  
  test('Gets nested property', () => {
    expect(getNestedValue(obj, 'user.email')).toBe('john@test.com');
  });
  
  test('Gets deeply nested property', () => {
    expect(getNestedValue(obj, 'user.profile.role')).toBe('Admin');
  });
  
  test('Handles missing property', () => {
    expect(getNestedValue(obj, 'missing')).toBe('');
    expect(getNestedValue(obj, 'user.missing')).toBe('');
  });
  
  test('Handles null/undefined values', () => {
    expect(getNestedValue(obj, 'empty')).toBe('');
  });
  
  test('Handles zero values', () => {
    expect(getNestedValue(obj, 'count')).toBe('0');
  });
  
  test('Formats dates to ISO date string', () => {
    expect(getNestedValue(obj, 'date')).toBe('2024-03-01');
  });
  
  test('Stringifies objects', () => {
    expect(getNestedValue(obj, 'user.profile')).toBe('{"role":"Admin"}');
  });
});

describe('arrayToCSV', () => {
  const data = [
    {
      name: 'John Doe',
      email: 'john@test.com',
      role: 'Admin',
      user: {
        id: '123'
      }
    },
    {
      name: 'Jane Smith',
      email: 'jane@test.com',
      role: 'Teacher',
      user: {
        id: '456'
      }
    }
  ];
  
  const headers = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'user.id', label: 'User ID' }
  ];
  
  test('Converts array to CSV', () => {
    const csv = arrayToCSV(data, headers);
    const lines = csv.split('\n');
    
    expect(lines[0]).toBe('Name,Email,Role,User ID');
    expect(lines[1]).toBe('John Doe,john@test.com,Admin,123');
    expect(lines[2]).toBe('Jane Smith,jane@test.com,Teacher,456');
  });
  
  test('Handles empty array', () => {
    const csv = arrayToCSV([], headers);
    expect(csv).toBe('Name,Email,Role,User ID');
  });
  
  test('Handles special characters in data', () => {
    const specialData = [
      {
        name: 'Doe, John',
        email: 'john@test.com',
        remarks: 'Said "Hello"'
      }
    ];
    
    const specialHeaders = [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'remarks', label: 'Remarks' }
    ];
    
    const csv = arrayToCSV(specialData, specialHeaders);
    const lines = csv.split('\n');
    
    expect(lines[1]).toContain('"Doe, John"');
    expect(lines[1]).toContain('"Said ""Hello"""');
  });
  
  test('Handles missing fields', () => {
    const incompleteData = [
      { name: 'John', email: 'john@test.com' }
    ];
    
    const csv = arrayToCSV(incompleteData, headers);
    const lines = csv.split('\n');
    
    expect(lines[1]).toBe('John,john@test.com,,');
  });
});
