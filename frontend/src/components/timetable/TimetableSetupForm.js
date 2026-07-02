"use client";

import React, { useEffect, useMemo, useState } from "react";
import TimeSlotBuilder from "./TimeSlotBuilder";
import classesService from "@/services/classesService";

export default function TimetableSetupForm({ onComplete }) {
  const [name, setName] = useState("New Timetable");
  const [academicYear, setAcademicYear] = useState("2024-25");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [sectionModeByClass, setSectionModeByClass] = useState({})

  const [classes, setClasses] = useState([]);
  const [configuredLevels, setConfiguredLevels] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [classesRes, levelsRes] = await Promise.all([
          classesService.listClasses({ active: true }),
          classesService.listLevels().catch(() => ({ levels: [] }))
        ])
        if (!mounted) return
        const list = classesRes?.classes
        const normalized = (Array.isArray(list) ? list : []).map((c) => ({
          id: c.name,
          name: c.name,
          level: String(c?.level || '').trim(),
          sections: Array.isArray(c?.sections)
            ? c.sections.map((s) => String(s || '').trim()).filter(Boolean)
            : []
        }))
        setClasses(normalized)
        setConfiguredLevels(Array.isArray(levelsRes?.levels) ? levelsRes.levels : [])
      } catch (e) {
        if (!mounted) return
        setClasses([])
        setConfiguredLevels([])
        setLoadError(e?.response?.data?.error || 'Failed to load classes')
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Levels come from the configured level list (e.g. pre-primary/primary/middle/high)
  // merged with any levels already assigned to classes, so the picker is never empty.
  const availableLevels = useMemo(() => {
    const merged = [...configuredLevels, ...classes.map((c) => c.level)]
      .map((l) => String(l || '').trim())
      .filter(Boolean)
    return [...new Set(merged)].sort()
  }, [classes, configuredLevels])

  const classesInSelectedLevel = useMemo(() => {
    if (!selectedLevel) return []
    return classes.filter((c) => c.level === selectedLevel)
  }, [classes, selectedLevel])

  const generatedColumnsByClass = useMemo(() => {
    return classesInSelectedLevel.map((c) => {
      const className = String(c?.name || '').trim()
      const sections = Array.isArray(c?.sections) ? c.sections : []
      const sectionWise = Boolean(sectionModeByClass[className]) && sections.length > 0

      const columns = sectionWise
        ? sections.map((section) => ({
            id: `${className}::${section}`,
            name: `${className} - ${section}`,
            className,
            section
          }))
        : [{ id: className, name: className, className, section: '' }]

      return {
        className,
        sectionWise,
        columns
      }
    })
  }, [classesInSelectedLevel, sectionModeByClass])

  const generatedSummary = useMemo(() => {
    const totalClasses = generatedColumnsByClass.length
    const sectionWiseClasses = generatedColumnsByClass.filter((row) => row.sectionWise).length
    const classOnlyClasses = totalClasses - sectionWiseClasses
    const totalColumns = generatedColumnsByClass.reduce((sum, row) => sum + row.columns.length, 0)

    return {
      totalClasses,
      sectionWiseClasses,
      classOnlyClasses,
      totalColumns
    }
  }, [generatedColumnsByClass])

  const canContinue = Boolean(
    selectedLevel &&
    classesInSelectedLevel.length &&
    timeSlots.length &&
    generatedSummary.totalColumns > 0
  )

  useEffect(() => {
    if (!classesInSelectedLevel.length) {
      setSectionModeByClass({})
      return
    }

    setSectionModeByClass((prev) => {
      const next = {}
      classesInSelectedLevel.forEach((c) => {
        const className = String(c?.name || '').trim()
        if (!className) return
        next[className] = Boolean(prev[className])
      })
      return next
    })
  }, [classesInSelectedLevel])

  function buildClassColumns() {
    const columns = []
    classesInSelectedLevel.forEach((c) => {
      const className = String(c?.name || '').trim()
      if (!className) return

      const sections = Array.isArray(c?.sections) ? c.sections : []
      const sectionWise = Boolean(sectionModeByClass[className]) && sections.length > 0

      if (sectionWise) {
        sections.forEach((section) => {
          columns.push({
            id: `${className}::${section}`,
            name: `${className} - ${section}`,
            className,
            section
          })
        })
        return
      }

      columns.push({
        id: className,
        name: className,
        className,
        section: ''
      })
    })
    return columns
  }

  function toggleSectionMode(className) {
    setSectionModeByClass((prev) => ({
      ...prev,
      [className]: !Boolean(prev[className])
    }))
  }

  function enableAllSectionWise() {
    setSectionModeByClass((prev) => {
      const next = { ...prev }
      classesInSelectedLevel.forEach((c) => {
        const className = String(c?.name || '').trim()
        const sections = Array.isArray(c?.sections) ? c.sections : []
        if (!className) return
        if (sections.length > 0) next[className] = true
      })
      return next
    })
  }

  function resetAllToClassOnly() {
    setSectionModeByClass((prev) => {
      const next = { ...prev }
      classesInSelectedLevel.forEach((c) => {
        const className = String(c?.name || '').trim()
        if (!className) return
        next[className] = false
      })
      return next
    })
  }

  function resetClassToClassOnly(className) {
    setSectionModeByClass((prev) => ({
      ...prev,
      [className]: false
    }))
  }

  function handleContinue() {
    if (!selectedLevel || !classesInSelectedLevel.length || !timeSlots.length) return;

    const classColumns = buildClassColumns()
    if (!classColumns.length) return

    onComplete({
      name,
      academicYear,
      effectiveDate,
      level: selectedLevel,
      classes: classColumns,
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

      <div className="card">
        <label className="text-sm font-medium">Level (Level-only timetable)</label>
        <div className="mt-3">
          <select
            className="input"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="">Select level</option>
            {availableLevels.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-2">
            Apply to Class will include all active classes in this level into one timetable.
          </div>
        </div>
      </div>

      <div className="card">
        <label className="text-sm font-medium">Classes in selected level</label>
        {selectedLevel ? (
          <div className="mt-3 space-y-3">
            {classesInSelectedLevel.length ? (
              <>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs border rounded hover-theme-primary"
                    onClick={enableAllSectionWise}
                  >
                    Include all classes + sections
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs border rounded hover-theme-primary"
                    onClick={resetAllToClassOnly}
                  >
                    Reset all to class-only
                  </button>
                </div>

                <div className="grid md:grid-cols-4 gap-2 text-xs">
                  <div className="border rounded p-2">
                    <div className="text-gray-500">Classes</div>
                    <div className="font-medium text-gray-900 mt-1">{generatedSummary.totalClasses}</div>
                  </div>
                  <div className="border rounded p-2">
                    <div className="text-gray-500">Section-wise Classes</div>
                    <div className="font-medium text-gray-900 mt-1">{generatedSummary.sectionWiseClasses}</div>
                  </div>
                  <div className="border rounded p-2">
                    <div className="text-gray-500">Class-only Classes</div>
                    <div className="font-medium text-gray-900 mt-1">{generatedSummary.classOnlyClasses}</div>
                  </div>
                  <div className="border rounded p-2">
                    <div className="text-gray-500">Generated Columns</div>
                    <div className="font-medium text-gray-900 mt-1">{generatedSummary.totalColumns}</div>
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-700">Overall generated columns</div>
                  <div className="mt-2 text-xs text-gray-700 leading-relaxed">
                    {generatedColumnsByClass
                      .flatMap((row) => row.columns.map((col) => col.name))
                      .join(', ') || 'No columns generated yet.'}
                  </div>
                </div>

                <div className="space-y-2">
                  {classesInSelectedLevel.map((c) => {
                    const sections = Array.isArray(c?.sections) ? c.sections : []
                    const sectionWise = Boolean(sectionModeByClass[c.name]) && sections.length > 0
                    const classColumns = generatedColumnsByClass.find((row) => row.className === c.name)?.columns || []

                    return (
                      <div key={c.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{c.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {sections.length
                                ? `Sections: ${sections.join(', ')}`
                                : 'No sections configured'}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={!sections.length}
                              onClick={() => toggleSectionMode(c.name)}
                              className={`px-3 py-1.5 text-xs border rounded ${sections.length ? 'hover-theme-primary' : 'opacity-50 cursor-not-allowed'}`}
                            >
                              {sectionWise ? 'Section-wise enabled' : 'Class-only'}
                            </button>

                            <button
                              type="button"
                              onClick={() => resetClassToClassOnly(c.name)}
                              className="px-3 py-1.5 text-xs border rounded hover-theme-primary"
                            >
                              Reset class
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-700">
                          Output columns:{' '}
                          {classColumns.map((col) => col.name).join(', ')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <span className="text-sm text-red-600">No active classes are tagged with this level. Assign this level to classes in Class Management first.</span>
            )}
          </div>
        ) : (
          <div className="mt-3 text-sm text-gray-600">Select a level first to preview classes.</div>
        )}
      </div>

      <TimeSlotBuilder onChange={setTimeSlots} />

      {selectedLevel ? (
        <div className="sticky bottom-3 z-10 border rounded-lg bg-white p-3 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs text-gray-700">
              <span className="font-medium">Ready to continue:</span>{' '}
              {canContinue ? 'Yes' : 'No'}
              {' · '}
              Columns: <span className="font-medium">{generatedSummary.totalColumns}</span>
              {' · '}
              Time Slots: <span className="font-medium">{timeSlots.length}</span>
            </div>

            {!canContinue ? (
              <div className="text-xs text-red-600">
                Select level, ensure classes are available, and add at least one time slot.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button onClick={handleContinue} disabled={!canContinue} className={`btn-primary p-2 rounded ${canContinue ? '' : 'opacity-60 cursor-not-allowed'}`}>
          Apply to Class →
        </button>
      </div>
    </div>
  );
}

