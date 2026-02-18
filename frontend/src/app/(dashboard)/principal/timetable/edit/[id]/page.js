"use client";

import React, { useState, useEffect } from "react";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import WeekSelector from "@/components/timetable/WeekSelector";
import { mockTeachers, mockRooms } from "@/utils/mockData";
import { mockTimetable } from "@/utils/mockTimetable";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function EditTimetablePage() {
  const [timetable, setTimetable] = useState(mockTimetable);

  const [weekConfig, setWeekConfig] = useState({
    mode: "different",
    days: ["Mon"], // default selected
  });

  const [activeDay, setActiveDay] = useState("Mon");

  // Ensure weeklyGrids exist and deep copy the data
  useEffect(() => {
    if (!timetable.weeklyGrids) {
      const newWeeklyGrids = {};
      DAYS.forEach((d) => {
        newWeeklyGrids[d] =
          d === "Mon"
            ? JSON.parse(JSON.stringify(mockTimetable.weeklyGrids["Mon"]))
            : mockTimetable.classes.map((cls) => ({
                id: cls.id,
                name: cls.name,
                periods: Object.fromEntries(
                  mockTimetable.timeSlots.map((ts) => [
                    ts.label,
                    { subject: null, teacher: null, room: null },
                  ])
                ),
              }));
      });
      setTimetable((prev) => ({ ...prev, weeklyGrids: newWeeklyGrids }));
    }
  }, []);

  const handleGridChange = (updatedGrid) => {
    setTimetable((prev) => ({
      ...prev,
      weeklyGrids: {
        ...prev.weeklyGrids,
        [activeDay]: JSON.parse(JSON.stringify(updatedGrid)),
      },
    }));
  };

  const handleWeekChange = (value) => {
    if (value.mode === "same") {
      if (
        confirm(
          "Are you sure? This will overwrite all weekdays with Monday's timetable"
        )
      ) {
        const mondayGrid = JSON.parse(
          JSON.stringify(timetable.weeklyGrids["Mon"])
        );
        const newWeekly = {};
        DAYS.forEach((d) => {
          newWeekly[d] = mondayGrid;
        });
        setTimetable((prev) => ({ ...prev, weeklyGrids: newWeekly }));
        setActiveDay("Mon");
      }
    } else {
      setActiveDay("Mon");
    }
    setWeekConfig(value);
  };

  const handleSave = () => {
    console.log("Save timetable payload", timetable);
    alert("Mock save done. Check console.");
  };

  // Dynamically build subjectsByClass from current day's grid
  const subjectsByClass = {};
  (timetable.weeklyGrids[activeDay] || []).forEach((cls) => {
    subjectsByClass[cls.id] = Object.values(cls.periods)
      .map((p) => p.subject)
      .filter(Boolean);
  });

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Edit Timetable</h1>

      <WeekSelector value={weekConfig} onChange={handleWeekChange} />

      {weekConfig.mode === "different" && (
        <div className="flex gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-3 py-1 rounded border ${
                activeDay === day
                  ? "border-theme-primary bg-theme-primary/10"
                  : "opacity-50"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted">Editing Day</div>
          <div className="font-medium">{activeDay}</div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="btn-primary px-4 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      </div>

      <TimetableGrid
        config={timetable}
        teachers={mockTeachers}
        rooms={mockRooms}
        subjectsByClass={subjectsByClass}
        initialGrid={timetable.weeklyGrids[activeDay]}
        onGridChange={handleGridChange}
      />
    </div>
  );
}
