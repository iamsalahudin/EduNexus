"use client"
import { useEffect } from 'react'
import { fetchFeeStructure } from '@/services/feesService'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, Input, PageHeader } from '@/components/ui'

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
        <PageHeader title="Fee Structure" />
        <Card className="mt-4">
          <h3 className="font-medium">Regular Fees</h3>
          <div className="mt-2 space-y-2">
            <Controller name="regularFees" control={control} render={({ field })=> (
              <div>
                {field.value?.map((r,idx)=> (
                  <div key={idx} className="flex items-center justify-between">
                    <div>{r.label}</div>
                    {(() => {
                      const { ref, ...amountReg } = register(`regularFees.${idx}.amount`, { valueAsNumber: true })
                      return (
                        <Input
                          type="number"
                          {...amountReg}
                          ref={ref}
                          defaultValue={r.amount}
                          inputClassName="w-24"
                        />
                      )
                    })()}
                  </div>
                ))}
              </div>
            )} />
          </div>
        </Card>

        <Card className="mt-4">
          <h3 className="font-medium">Tuition Fee</h3>
          <Controller name="tuition" control={control} render={({ field })=> (
            <div>
              <div className="mt-2 text-sm flex items-center gap-2">
                <div>Type:</div>
                {(() => {
                  const { ref, ...typeReg } = register('tuition.type')
                  return <Input {...typeReg} ref={ref} inputClassName="w-32" />
                })()}
              </div>
              <div className="mt-2 space-y-2">
                {Object.entries(field.value.levels || {}).map(([lvl,amt])=> (
                  <div key={lvl} className="flex items-center justify-between">
                    <div>{lvl}</div>
                    {(() => {
                      const { ref, ...lvlReg } = register(`tuition.levels.${lvl}`, { valueAsNumber: true })
                      return (
                        <Input
                          type="number"
                          {...lvlReg}
                          ref={ref}
                          defaultValue={amt}
                          inputClassName="w-28"
                        />
                      )
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )} />
        </Card>

        <div className="mt-4">
          <Button type="submit" variant="primary">Save Structure</Button>
        </div>
      </form>
    </div>
  )
}
