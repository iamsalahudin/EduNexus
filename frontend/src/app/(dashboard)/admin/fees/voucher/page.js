"use client"
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const BankSchema = z.object({ bankName: z.string().min(1), account: z.string().min(1) })
const VoucherSchema = z.object({
  schoolName: z.string().min(1),
  schoolAddress: z.string().min(1),
  banks: z.array(BankSchema).min(1)
})

export default function FeeVoucher(){
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(VoucherSchema),
    defaultValues: { schoolName:'My School', schoolAddress:'Address', banks: [{ bankName:'Bank A', account:'XXXX' }] }
  })

  const { fields, append, remove } = useFieldArray({ name: 'banks', control })

  function onSubmit(values){
    console.log('Voucher values', values)
    alert('Saved (mock)')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Fee Voucher</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-medium">School Info</h3>
          <input {...register('schoolName')} placeholder="School Name" className="w-full border rounded px-2 py-1 mt-2" />
          {errors.schoolName && <div className="text-red-500 text-sm">{errors.schoolName.message}</div>}
          <input {...register('schoolAddress')} placeholder="School Address" className="w-full border rounded px-2 py-1 mt-2" />
          {errors.schoolAddress && <div className="text-red-500 text-sm">{errors.schoolAddress.message}</div>}
        </div>

        <div className="card">
          <h3 className="font-medium">Bank Accounts</h3>
          <div className="mt-2 space-y-2">
            {fields.map((f,i)=> (
              <div key={f.id} className="flex gap-2">
                <input {...register(`banks.${i}.bankName`)} placeholder="Bank Name" className="flex-1 border rounded px-2 py-1" />
                <input {...register(`banks.${i}.account`)} placeholder="Account" className="flex-1 border rounded px-2 py-1" />
                <button type="button" onClick={()=>remove(i)} className="px-2 py-1 border rounded">Remove</button>
              </div>
            ))}
            <button type="button" onClick={()=>append({ bankName:'', account:'' })} className="mt-2 px-3 py-1 border rounded">Add Another Bank</button>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="mt-4 card">
            <h3 className="font-medium">Voucher Preview</h3>
            <div className="mt-3 p-4 border rounded">Voucher preview area (design editor placeholder)</div>
          </div>

          <div className="mt-3 flex gap-2">
            <button type="submit" className="px-4 py-2 btn-primary rounded">Save Voucher</button>
          </div>
        </div>
      </form>
    </div>
  )
}
