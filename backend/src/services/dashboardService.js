const { User, Student, Teacher, Attendance, Fee, SchoolClass } = require('../models');
const StaffAttendance = require('../models/staffAttendance');

async function getDashboardSummary() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalClasses,
      activeClasses,
      totalParents,
      activeParents
    ] = await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ status: 'incampus' }),
      Teacher.countDocuments({}),
      Teacher.countDocuments({ status: 'Working' }),
      SchoolClass.countDocuments({}),
      SchoolClass.countDocuments({ active: true }),
      User.countDocuments({ role: 'Parent' }),
      User.countDocuments({ role: 'Parent', active: true })
    ]);

    const [feesData, monthlyFees] = await Promise.all([
      Fee.aggregate([
        { $match: { active: true } },
        { $group: {
          _id: null,
          totalGenerated: { $sum: '$amount' },
          totalReceived: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } }
        }}
      ]),
      Fee.aggregate([
        { $match: { createdAt: { $gte: monthStart, $lte: monthEnd }, active: true } },
        { $group: {
          _id: null,
          totalGenerated: { $sum: '$amount' },
          totalReceived: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
          totalPending: { $sum: { $cond: [{ $ne: ['$status', 'paid'] }, '$amount', 0] } }
        }}
      ])
    ]);

    const totalFeeData = feesData[0] || { totalGenerated: 0, totalReceived: 0 };
    const monthlyFeeData = monthlyFees[0] || { totalGenerated: 0, totalReceived: 0, totalPending: 0 };
    const receivableFee = totalFeeData.totalGenerated - totalFeeData.totalReceived;
    const collectionPercentage = totalFeeData.totalGenerated > 0
      ? ((totalFeeData.totalReceived / totalFeeData.totalGenerated) * 100).toFixed(2)
      : 0;

    return {
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: Math.max(totalStudents - activeStudents, 0)
      },
      teachers: {
        total: totalTeachers,
        active: activeTeachers,
        inactive: Math.max(totalTeachers - activeTeachers, 0)
      },
      parents: {
        total: totalParents,
        active: activeParents,
        inactive: Math.max(totalParents - activeParents, 0)
      },
      classes: {
        total: totalClasses,
        active: activeClasses,
        inactive: Math.max(totalClasses - activeClasses, 0)
      },
      fees: {
        totalGenerated: totalFeeData.totalGenerated,
        totalReceived: totalFeeData.totalReceived,
        receivableFee,
        collectionPercentage,
        monthlyData: {
          generated: monthlyFeeData.totalGenerated,
          received: monthlyFeeData.totalReceived,
          pending: monthlyFeeData.totalPending
        }
      }
    };
  } catch (err) {
    console.error('[dashboardService] getDashboardSummary failed', err);
    throw err;
  }
}

async function getAttendanceToday() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [studentAttendance, teacherAttendance] = await Promise.all([
      Attendance.aggregate([
        { $match: { date: { $gte: today, $lt: tomorrow } } },
        { $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
        }}
      ]),
      StaffAttendance.aggregate([
        { $match: { date: { $gte: today, $lt: tomorrow } } },
        { $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
        }}
      ])
    ]);

    return {
      students: studentAttendance[0] || { present: 0, absent: 0, late: 0, excused: 0 },
      teachers: teacherAttendance[0] || { present: 0, absent: 0, late: 0 }
    };
  } catch (err) {
    console.error('[dashboardService] getAttendanceToday failed', err);
    throw err;
  }
}

async function getFinanceOverview() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();

    const collections = await Fee.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd }, status: 'paid' } },
      { $group: {
        _id: { $dayOfMonth: '$createdAt' },
        amount: { $sum: '$amount' }
      }},
      { $sort: { '_id': 1 } }
    ]);

    const graphData = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const collectedDay = collections.find(c => c._id === day);
      return {
        day,
        collections: collectedDay?.amount || 0,
        expenses: 0
      };
    });

    const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);
    return {
      summary: { totalCollected, totalExpenses: 0, netIncome: totalCollected },
      graphData
    };
  } catch (err) {
    console.error('[dashboardService] getFinanceOverview failed', err);
    throw err;
  }
}

async function getClassStrength() {
  try {
    const [schoolClasses, studentStrengthRows] = await Promise.all([
      SchoolClass.find({ active: true }).sort({ name: 1 }).lean(),
      Student.aggregate([
        { $match: { status: 'incampus' } },
        {
          $group: {
            _id: {
              className: '$class',
              section: { $ifNull: ['$section', ''] }
            },
            studentCount: { $sum: 1 }
          }
        }
      ])
    ]);

    const strengthByClass = new Map();

    for (const row of studentStrengthRows) {
      const className = String(row?._id?.className || '').trim();
      const sectionName = String(row?._id?.section || '').trim() || 'General';
      const count = Number(row?.studentCount || 0);

      if (!strengthByClass.has(className)) {
        strengthByClass.set(className, { total: 0, sections: new Map() });
      }

      const entry = strengthByClass.get(className);
      entry.total += count;
      entry.sections.set(sectionName, (entry.sections.get(sectionName) || 0) + count);
    }

    return schoolClasses.map((schoolClass) => {
      const className = String(schoolClass.name || '').trim();
      const aggregated = strengthByClass.get(className) || { total: 0, sections: new Map() };
      const sectionNames = Array.isArray(schoolClass.sections) && schoolClass.sections.length > 0
        ? schoolClass.sections.map((section) => String(section || '').trim()).filter(Boolean)
        : Array.from(aggregated.sections.keys());

      const sections = sectionNames.length > 0
        ? sectionNames.map((section) => ({
            section,
            strength: aggregated.sections.get(section) || 0
          }))
        : [{ section: 'General', strength: aggregated.total }];

      return {
        _id: schoolClass._id,
        name: schoolClass.name,
        totalStrength: aggregated.total,
        sections
      };
    });
  } catch (err) {
    console.error('[dashboardService] getClassStrength failed', err);
    throw err;
  }
}

async function getRecentActivities(limit = 10) {
  try {
    const recentUsers = await User.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .select('name role createdAt');

    const activities = recentUsers.map(u => ({
      id: `user-${u._id}`,
      type: 'user_created',
      text: `${u.name} registered as ${u.role}`,
      timestamp: u.createdAt,
      icon: 'user-plus'
    }));

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (err) {
    console.error('[dashboardService] getRecentActivities failed', err);
    throw err;
  }
}

async function getDashboardNotifications(limit = 20) {
  try {
    const notifications = [];
    const overdueFees = await Fee.countDocuments({
      status: 'pending',
      dueDate: { $lt: new Date() }
    });

    if (overdueFees > 0) {
      notifications.push({
        id: 'fee-alert',
        type: 'fee_alert',
        title: `${overdueFees} Overdue Fees`,
        message: `${overdueFees} students have overdue fee payments`,
        priority: 'high',
        icon: 'alert-circle',
        read: false
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalStudents = await Student.countDocuments({ status: 'incampus' });
    const markedToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    if (markedToday < totalStudents) {
      notifications.push({
        id: 'attendance-pending',
        type: 'attendance_alert',
        title: 'Attendance Pending',
        message: `Attendance marked for ${markedToday}/${totalStudents} students`,
        priority: 'medium',
        icon: 'clock',
        read: false
      });
    }

    return notifications.slice(0, limit);
  } catch (err) {
    console.error('[dashboardService] getDashboardNotifications failed', err);
    throw err;
  }
}

module.exports = {
  getDashboardSummary,
  getAttendanceToday,
  getFinanceOverview,
  getClassStrength,
  getRecentActivities,
  getDashboardNotifications
};
