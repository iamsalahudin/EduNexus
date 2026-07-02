"use client";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import {
  getFeeVoucherTemplate,
  saveFeeVoucherTemplate,
} from "@/services/feesService";
import { VoucherDisplay } from "@/components/fees/VoucherDisplay";

const VoucherSchema = z.object({
  schoolName: z.string().min(1),
  schoolAddress: z.string().min(1),
  banks: z
    .array(
      z.object({ bankName: z.string().min(1), account: z.string().min(1) }),
    )
    .min(1),
});

export default function FeeVoucherPage() {
  const [saveMessage, setSaveMessage] = useState("");
  const [colorMode, setColorMode] = useState("color");

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(VoucherSchema),
    defaultValues: {
      schoolName: "My School",
      schoolAddress: "Address",
      banks: [{ bankName: "Bank A", account: "XXXX" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ name: "banks", control });
  const liveData = watch();

  useEffect(() => {
    getFeeVoucherTemplate().then((template) => {
      if (template) reset(template);
    });
  }, [reset]);

  async function onSubmit(values) {
    await saveFeeVoucherTemplate(values);
    setSaveMessage("Voucher template saved successfully.");
    setTimeout(() => setSaveMessage(""), 3000);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <PageHeader title="Fee Voucher Configuration" />
        <Link href="/admin/fees/voucher/print" className="p-3 px-5 border-[--color-primary] border rounded-md text-sm text-[--color-primary] font-medium hover:bg-[--color-primary] hover:text-white transition">
          Print Vouchers
        </Link>
      </div>
      {saveMessage && (
        <div className="mt-2 text-sm text-green-600 font-medium">
          {saveMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card>
          <h3 className="font-medium mb-3">School Info</h3>
          <Input
            {...register("schoolName")}
            placeholder="School Name"
            className="mb-2"
          />
          <Input {...register("schoolAddress")} placeholder="School Address" />
        </Card>

        <Card>
          <h3 className="font-medium mb-3">Bank Accounts</h3>
          {fields.map((f, i) => (
            <div key={f.id} className="flex gap-2 mb-2">
              <Input {...register(`banks.${i}.bankName`)} placeholder="Bank" />
              <Input
                {...register(`banks.${i}.account`)}
                placeholder="A/C No."
              />
              <Button type="button" variant="outline" onClick={() => remove(i)}>
                X
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => append({ bankName: "", account: "" })}
          >
            + Add Bank
          </Button>
        </Card>

        <Button type="submit" variant="primary" className="md:col-span-2">
          Save Template
        </Button>
      </form>

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Voucher Preview</h3>
          <div
            style={{
              display: "inline-flex",
              background: "#f1f1f1",
              borderRadius: 8,
              padding: 3,
              gap: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setColorMode("color")}
              style={{
                padding: "6px 18px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.18s",
                background: colorMode === "color" ? "#1a1a2e" : "transparent",
                color: colorMode === "color" ? "#c8b560" : "#666",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🎨 Color
            </button>
            <button
              type="button"
              onClick={() => setColorMode("bw")}
              style={{
                padding: "6px 18px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.18s",
                background: colorMode === "bw" ? "#222" : "transparent",
                color: colorMode === "bw" ? "#fff" : "#666",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ⬛ Black & White
            </button>
          </div>
        </div>

        {/* The reusable voucher component */}
        <div style={{ background: "#d6d3ca", borderRadius: 10, padding: 20 }}>
          <VoucherDisplay data={liveData} colorMode={colorMode} />
        </div>
      </div>
    </div>
  );
}
