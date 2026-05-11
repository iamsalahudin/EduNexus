<<<<<<< HEAD
'use client'

const PERIOD_OPTIONS = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
]

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

function buildYears(centerYear) {
  const year = Number(centerYear) || new Date().getFullYear()
  return [year - 1, year, year + 1]
}

export default function AttendancePeriodSelector({
  mode,
  onModeChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
}) {
  const years = buildYears(year)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((option) => {
          const active = mode === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'border-theme-primary bg-theme-primary text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover-theme-primary'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {mode === 'month' ? (
          <>
            <label className="block text-sm font-medium text-gray-700">
              Month
              <select
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={month}
                onChange={(e) => onMonthChange(e.target.value)}
              >
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Year
              <select
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
              >
                {years.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Showing the full selected month.
            </div>
          </>
        ) : null}

        {mode === 'year' ? (
          <>
            <label className="block text-sm font-medium text-gray-700">
              Year
              <select
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
              >
                {years.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 md:col-span-2">
              Showing the full selected year.
            </div>
          </>
        ) : null}

        {mode === 'custom' ? (
          <>
            <label className="block text-sm font-medium text-gray-700">
              From
              <input
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              To
              <input
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
              />
            </label>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Select any range for a custom attendance snapshot.
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
=======
'use client'

const PERIOD_OPTIONS = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
]

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

function buildYears(centerYear) {
  const year = Number(centerYear) || new Date().getFullYear()
  return [year - 1, year, year + 1]
}

export default function AttendancePeriodSelector({
  mode,
  onModeChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
}) {
  const years = buildYears(year)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((option) => {
          const active = mode === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'border-theme-primary bg-theme-primary text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover-theme-primary'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {mode === 'month' ? (
          <>
            <label className="block text-sm font-medium text-gray-700">
              Month
              <select
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={month}
                onChange={(e) => onMonthChange(e.target.value)}
              >
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Year
              <select
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
              >
                {years.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Showing the full selected month.
            </div>
          </>
        ) : null}

        {mode === 'year' ? (
          <>
            <label className="block text-sm font-medium text-gray-700">
              Year
              <select
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
              >
                {years.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 md:col-span-2">
              Showing the full selected year.
            </div>
          </>
        ) : null}

        {mode === 'custom' ? (
          <>
            <label className="block text-sm font-medium text-gray-700">
              From
              <input
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              To
              <input
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
              />
            </label>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Select any range for a custom attendance snapshot.
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
}