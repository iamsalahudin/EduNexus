"use client"
import { useEffect } from 'react'
import { fetchFeeStructure } from '@/services/feesService'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const StructureSchema = z.object({
  regularFees: z.array(z.object({ label: z.string(), amount: z.number().min(0) })),
  tuition: z.object({ type: z.string(), levels: z.record(z.number()) })
})

export default function FeeStructure(){
  const { register, control, handleSubmit, reset } = useForm({ resolver: zodResolver(StructureSchema), defaultValues: { regularFees: [], tuition: { type:'Monthly', levels: {} } } })

  useEffect(()=>{ fetchFeeStructure().then(d=>{ reset(d) }) },[reset])

  function onSubmit(values){
    console.log('Save structure', values)
    alert('Saved (mock)')
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1 className="text-2xl font-semibold">Fee Structure</h1>
        <div className="mt-4 card">
          <h3 className="font-medium">Regular Fees</h3>
          <div className="mt-2 space-y-2">
            <Controller name="regularFees" control={control} render={({ field })=> (
              <div>
                {field.value?.map((r,idx)=> (
                  <div key={idx} className="flex items-center justify-between">
                    <div>{r.label}</div>
                    <input type="number" defaultValue={r.amount} {...register(`regularFees.${idx}.amount`, { valueAsNumber: true })} className="border rounded px-2 py-1 w-24" />
                  </div>
                ))}
              </div>
            )} />
          </div>
        </div>

        <div className="mt-4 card">
          <h3 className="font-medium">Tuition Fee</h3>
          <Controller name="tuition" control={control} render={({ field })=> (
            <div>
              <div className="mt-2 text-sm">Type: <input {...register('tuition.type')} className="border rounded px-2 py-1 w-32 inline-block ml-2" /></div>
              <div className="mt-2 space-y-2">
                {Object.entries(field.value.levels || {}).map(([lvl,amt])=> (
                  <div key={lvl} className="flex items-center justify-between">
                    <div>{lvl}</div>
                    <input type="number" defaultValue={amt} {...register(`tuition.levels.${lvl}`, { valueAsNumber: true })} className="border rounded px-2 py-1 w-28" />
                  </div>
                ))}
              </div>
            </div>
          )} />
        </div>

        <div className="mt-4">
          <button type="submit" className="px-4 py-2 btn-primary rounded">Save Structure</button>
        </div>
      </form>
    </div>
  )
}
