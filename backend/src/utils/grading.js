// Auto-calculate grade based on marks
function calculateGrade(marks, totalMarks = 100) {
  const percentage = (marks / totalMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  if (percentage >= 40) return 'D';
  return 'F';
}

// Calculate total marks and percentage from subjects
function calculateTotals(subjects) {
  if (!subjects || subjects.length === 0) return { totalMarks: 0, percentage: 0 };
  const total = subjects.reduce((sum, s) => sum + (s.marks || 0), 0);
  const avg = total / subjects.length;
  return { totalMarks: Math.round(total), percentage: Math.round(avg * 100) / 100 };
}

module.exports = { calculateGrade, calculateTotals };
