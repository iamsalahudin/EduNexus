"use client";
import { useState, useMemo } from "react";
import { Button, Card, Input, Select } from "@/components/ui";
import { VoucherDisplay } from "@/components/fees/VoucherDisplay";
import useSWR from "swr";
import { fetchFeeRecords } from "@/services/feesService";

export default function VoucherPrintPage() {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // Fetch your records (ensure this service call matches your API)
  const { data: students = [] } = useSWR("all-students", () =>
    fetchFeeRecords({}),
  );

  // Using your existing matching logic
  const filteredStudents = useMemo(() => {
    return (Array.isArray(students) ? students : []).filter((row) => {
      const q = query.toLowerCase();
      const text =
        `${row?.roll || ""} ${row?.name || ""} ${row?.class || ""} ${row?.section || ""} ${row?.father || ""}`.toLowerCase();
      const classOk = !classFilter || String(row?.class || "") === classFilter;
      return classOk && (!q || text.includes(q));
    });
  }, [students, query, classFilter]);

  const classOptions = useMemo(() => {
    return [...new Set(students.map((s) => s.class).filter(Boolean))].sort();
  }, [students]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fee Voucher Printing</h1>
        <Button onClick={() => window.print()}>
          Print All {filteredStudents.length} Vouchers
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, roll, father..."
          />
          <Select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">All Classes</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <div className="flex items-center text-sm font-medium">
            Showing {filteredStudents.length} students
          </div>
        </div>
      </Card>

      {/* Vouchers Section */}
      <div className="space-y-10 print:space-y-0">
        <div className="print-only">
          {filteredStudents.map((student) => (
            <div key={student.id} className="print-page">
              {/* Remove the tray background for cleaner printing */}
              <div className="p-0">
                <VoucherDisplay
                  data={{ schoolName: "My School", schoolAddress: "Main City" }}
                  student={student}
                  colorMode="color"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
