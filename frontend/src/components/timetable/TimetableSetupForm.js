"use client";

import React, { useEffect, useMemo, useState } from "react";
import TimeSlotBuilder from "./TimeSlotBuilder";
import classesService from "@/services/classesService";

export default function TimetableSetupForm({ onComplete }) {
  const [name, setName] = useState("New Timetable");
  const [academicYear, setAcademicYear] = useState("2024-25");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [type, setType] = useState("class");
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [classes, setClasses] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { classes: list } = await classesService.listClasses({ active: true })
        if (!mounted) return
        const normalized = (Array.isArray(list) ? list : []).map((c) => ({ id: c.name, name: c.name }))
        setClasses(normalized)
      } catch (e) {
        if (!mounted) return
        setClasses([])
        setLoadError(e?.response?.data?.error || 'Failed to load classes')
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const allLevels = ['All'];
  const allClassesFlat = useMemo(() => classes, [classes]);

  function handleTypeChange(thisType) {
    setType(thisType);
    setSelectedLevels(thisType === 'level' ? ['All'] : []);
    setSelectedClasses([]);
  }

  function toggleLevel(level) {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  }

  function toggleClass(classId) {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((c) => c !== classId)
        : [...prev, classId]
    );
  }

  function handleContinue() {
    let classes = [];

    if (type === "level") {
      // Only a single synthetic level: All
      classes = selectedLevels.includes('All') ? allClassesFlat : [];
    } else {
      classes = allClassesFlat.filter((c) => selectedClasses.includes(c.id));
    }

    if (!classes.length || !timeSlots.length) return;

    onComplete({
      name,
      academicYear,
      effectiveDate,
      classes: classes.map((c) => ({ id: c.id, name: c.name })),
      timeSlots,
    });
  }

  return (
    <div className="space-y-6">
      {loadError ? (
        <div className="text-sm text-red-600">{loadError}</div>
      ) : null}
      {/* BASIC INFO */}
      <div className="card">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              className="input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Academic Year</label>
            <input
              className="input mt-1"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Effective Date</label>
            <input
              type="date"
              className="input mt-1"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TYPE */}
      <div className="card">
        <label className="text-sm font-medium">Timetable Type</label>
        <div className="mt-3 flex gap-3">
          {["class", "level"].map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-4 py-2 rounded border text-sm font-medium
                ${
                  type === t
                    ? "border-[color:var(--color-primary)] text-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10"
                    : "hover:border-gray-400"
                }`}
            >
              {t === "class" ? "By Class" : "By Level"}
            </button>
          ))}
        </div>
      </div>

      {/* LEVEL SELECT */}
      {type === "level" && (
        <div className="card">
          <label className="text-sm font-medium">Select Levels</label>
          <div className="mt-3 flex flex-wrap gap-3">
            {allLevels.map((l) => {
              const active = selectedLevels.includes(l);
              return (
                <div
                  key={l}
                  onClick={() => toggleLevel(l)}
                  className={`px-3 py-2 rounded border cursor-pointer text-sm
                    ${
                      active
                        ? "border-[color:var(--color-primary)] text-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10"
                        : "hover:border-gray-400"
                    }`}
                >
                    {l}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLASS SELECT */}
      {type === "class" && (
        <div className="card">
          <label className="text-sm font-medium">Select Classes</label>
          <div className="mt-3 flex flex-wrap gap-3">
            {allClassesFlat.map((c) => {
              const active = selectedClasses.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleClass(c.id)}
                  className={`px-3 py-2 rounded border cursor-pointer text-sm
                    ${
                      active
                        ? "border-[color:var(--color-primary)] text-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10"
                        : "hover:border-gray-400"
                    }`}
                >
                  {c.name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TimeSlotBuilder onChange={setTimeSlots} />

      <div className="flex justify-end">
        <button onClick={handleContinue} className="btn-primary p-2 rounded">
          Continue to Grid →
        </button>
      </div>
    </div>
  );
}

