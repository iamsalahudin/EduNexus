"use client";

import FeesDashboard from "@/components/fees/FeesDashboard";

export default function FeesHome() {
  return (
    <FeesDashboard
      roleBase="/principal"
      title="Fees"
      subtitle="Manage fee structure, voucher, collection, records, defaulters, and reports from one place."
      actionLinks={[
        { href: "/principal/fees/collection", label: "Fee Collection", variant: "primary" },
        { href: "/principal/fees/report", label: "Past Fee Reports", variant: "outline" },
        { href: "/principal/fees/defaulters", label: "Defaulters", variant: "outline" }
      ]}
    />
  );
}
