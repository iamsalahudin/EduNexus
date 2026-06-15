"use client";

import { Button, Card, PageHeader } from "@/components/ui";
import Link from "next/link";

function Stat({ label, value, hint }) {
  return (
    <Card>
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
    </Card>
  );
}

export default function FeeReportHub({
  roleBase,
  title,
  subtitle,
  summary = {},
  onRefresh,
  loading = false,
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={
          <Button onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat
          label="Collected"
          value={`Rs ${summary?.totalCollected ?? 0}`}
          hint="All time collected fee"
        />
        <Stat
          label="Incoming Fee"
          value={`Rs ${summary?.incomingFeeThisMonth ?? 0}`}
          hint="Current month credit"
        />
        <Stat
          label="Pending Liability"
          value={`Rs ${summary?.pendingLiabilityThisMonth ?? 0}`}
          hint="Current month dues"
        />
        <Stat
          label="Pending Count"
          value={summary?.pendingCount ?? 0}
          hint="Outstanding records"
        />
      </div>

      <Card>
        <h3 className="font-medium">Quick Links</h3>
        <div className="mt-4 flex flex-col lg:flex-row gap-2">
        <Link
          href={`${roleBase}/fees/report/collection-trend`}
          className=" card nav-item"
        >
          <div className="font-semibold">Collection Trend</div>
          <div className="text-sm text-gray-400">
            Monthly and yearly fee collection snapshots with downloads.
          </div>
        </Link>
        <Link href={`${roleBase}/fees/report/records`} className=" card nav-item">
          <div className="font-semibold">Student Records</div>
          <div className="text-sm text-gray-400">
            Searchable class and student fee record report.
          </div>
        </Link>
        <Link
          href={`${roleBase}/fees/report/defaulters`}
          className=" card nav-item"
        >
          <div className="font-semibold">Defaulters</div>
          <div className="text-sm text-gray-400">
            Outstanding fee list with export options.
          </div>
        </Link>
        </div>
      </Card>
    </div>
  );
}
