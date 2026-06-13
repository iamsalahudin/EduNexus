"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonLink,
  Card,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Table,
  TableRoot,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui";
import AttendanceStatsGrid from "@/components/attendance/AttendanceStatsGrid";
import {
  fetchStudents,
  fetchStudentAttendance,
  markStudentAttendance,
  updateStudentAttendance,
} from "@/services/attendanceService";
import classesService from "@/services/classesService";
import { ATTENDANCE_STATUS_OPTIONS } from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date();
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DailyStudentAttendanceView({
  title = "Daily Student Attendance",
  subtitle = "View and manage student attendance for a specific date by class and section.",
  backHref = "/admin/attendance",
}) {
  const today = toInputDate(new Date());
  const [date, setDate] = useState(today);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");

  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const classSections = useMemo(() => {
    if (!classId) return [];
    const selectedClass = classes.find(
      (c) => String(c.name) === String(classId),
    );
    return Array.isArray(selectedClass?.sections) ? selectedClass.sections : [];
  }, [classes, classId]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await classesService.listClasses({ active: true });
        setClasses(Array.isArray(res?.classes) ? res.classes : []);
      } catch {
        setClasses([]);
      }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      setRecords([]);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, section, date]);

  useEffect(() => {
    if (classId && section && !classSections.includes(section)) {
      setSection("");
    }
  }, [classId, classSections, section]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        fetchStudents({ classId, section: section || undefined, limit: 500 }),
        fetchStudentAttendance({ classId, date }),
      ]);
      const studentList = studentsRes.students || [];
      const recordList = attendanceRes.records || [];

      const recordByStudentId = new Map();
      for (const r of recordList) {
        const sid = r?.student?._id || r?.student;
        if (sid) recordByStudentId.set(String(sid), r);
      }

      const merged = studentList.map((s) => ({
        ...s,
        attendance: recordByStudentId.get(String(s._id)),
      }));

      setStudents(merged);
      setRecords(recordList);
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          e.message ||
          "Failed to load attendance data",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(studentId, recordId, newStatus) {
    setUpdating(true);
    setError(null);
    try {
      if (recordId) {
        await updateStudentAttendance(recordId, { status: newStatus });
      } else {
        const role = String(user?.role || "").toLowerCase();
        if (!["teacher", "admin", "principal"].includes(role)) {
          setError(
            "Attendance record not created yet. Ask the class teacher to mark attendance first.",
          );
          return;
        }
        const res = await markStudentAttendance({
          date,
          entries: [{ studentId, status: newStatus }],
        });
        const created = Array.isArray(res?.records)
          ? res.records.find(
              (item) => String(item?.student) === String(studentId),
            )
          : null;
        if (created) {
          setStudents((prev) =>
            prev.map((s) =>
              s._id === studentId
                ? { ...s, attendance: { ...created, status: newStatus } }
                : s,
            ),
          );
          return;
        }
      }
      setStudents((prev) =>
        prev.map((s) =>
          s._id === studentId
            ? { ...s, attendance: { ...s.attendance, status: newStatus } }
            : s,
        ),
      );
    } catch (e) {
      setError(
        e?.response?.data?.error || e.message || "Failed to update attendance",
      );
    } finally {
      setUpdating(false);
    }
  }

  const summary = useMemo(() => {
    const total = students.length;
    const present = students.filter(
      (s) => s.attendance?.status === "present",
    ).length;
    const absent = students.filter(
      (s) => s.attendance?.status === "absent",
    ).length;
    const late = students.filter((s) => s.attendance?.status === "late").length;
    const excused = students.filter(
      (s) => s.attendance?.status === "excused",
    ).length;
    return { total, present, absent, late, excused };
  }, [students]);

  const maxDate = toInputDate(new Date());

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={
          <ButtonLink href={backHref} variant="secondary">
            Back
          </ButtonLink>
        }
      />

      {error ? (
        <Card className="mt-6 bg-red-50 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <h3 className="font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={maxDate}
          />
          <Select
            label="Class"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSection("");
            }}
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c._id || c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={!classId}
          >
            <option value="">All Sections</option>
            {classSections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </Select>
          <div className="flex items-end">
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      </Card>

      {classId && (
        <AttendanceStatsGrid
          columns={5}
          className="mt-6"
          items={[
            {
              label: "Total Students",
              value: summary.total,
              className: "bg-blue-50 border border-blue-200",
              labelClassName: "text-blue-600 font-medium",
              valueClassName: "text-blue-700",
            },
            {
              label: "Present",
              value: summary.present,
              className: "bg-green-50 border border-green-200",
              labelClassName: "text-green-600 font-medium",
              valueClassName: "text-green-700",
            },
            {
              label: "Absent",
              value: summary.absent,
              className: "bg-red-50 border border-red-200",
              labelClassName: "text-red-600 font-medium",
              valueClassName: "text-red-700",
            },
            {
              label: "Late",
              value: summary.late,
              className: "bg-amber-50 border border-amber-200",
              labelClassName: "text-amber-600 font-medium",
              valueClassName: "text-amber-700",
            },
            {
              label: "Excused",
              value: summary.excused,
              className: "bg-purple-50 border border-purple-200",
              labelClassName: "text-purple-600 font-medium",
              valueClassName: "text-purple-700",
            },
          ]}
        />
      )}

      {classId && (
        <Card className="mt-6">
          <h3 className="font-semibold mb-4">Attendance Records</h3>
          <div className="overflow-auto">
            {loading && students.length === 0 ? (
              <Skeleton className="h-64" />
            ) : students.length === 0 ? (
              <div className="text-sm text-gray-600 py-4">
                No students found for selected class and section.
              </div>
            ) : (
              <Table>
                <TableRoot className="min-w-full text-sm">
                  <TableHead>
                    <TableRow className="text-left border-b bg-gray-50">
                      <TableHeader>Student Name</TableHeader>
                      <TableHeader>Class</TableHeader>
                      <TableHeader>Section</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => {
                      const attendanceStatus =
                        student.attendance?.status || "present";
                      const recordId = student.attendance?._id;
                      return (
                        <TableRow key={student._id}>
                          <TableCell>{student.name || "-"}</TableCell>
                          <TableCell>{student.class?.name || "-"}</TableCell>
                          <TableCell>{student.section || "-"}</TableCell>
                          <TableCell>
                            <Select
                              value={attendanceStatus}
                              onChange={(e) =>
                                handleStatusChange(
                                  student._id,
                                  recordId,
                                  e.target.value,
                                )
                              }
                              disabled={updating}
                              className={`py-1 px-2 text-sm rounded ${
                                attendanceStatus === "present"
                                  ? "bg-green-100 text-green-700"
                                  : attendanceStatus === "absent"
                                    ? "bg-red-100 text-red-700"
                                    : attendanceStatus === "late"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </TableRoot>
              </Table>
            )}
          </div>
        </Card>
      )}

      {!classId && (
        <Card className="mt-6 bg-blue-50 border border-blue-200">
          <div className="text-center text-blue-700">
            <p className="text-sm">
              Select a class above to view and manage attendance for{" "}
              {date || "the selected date"}.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
