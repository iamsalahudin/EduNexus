'use client'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, Input, PageHeader } from '@/components/ui'

const BankSchema = z.object({ bankName: z.string().min(1), account: z.string().min(1) })
const VoucherSchema = z.object({
  schoolName: z.string().min(1),
  schoolAddress: z.string().min(1),
  banks: z.array(BankSchema).min(1)
})

export default function FeeVoucher(){
  const [saveMessage, setSaveMessage] = useState('')
  const [savedTemplate, setSavedTemplate] = useState(null)
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(VoucherSchema),
    defaultValues: { schoolName:'My School', schoolAddress:'Address', banks: [{ bankName:'Bank A', account:'XXXX' }] }
  })

  const { fields, append, remove } = useFieldArray({ name: 'banks', control })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('feeVoucherTemplate')
      if (stored) {
        setSavedTemplate(JSON.parse(stored))
      }
    } catch {
      setSavedTemplate(null)
    }
  }, [])

  function onSubmit(values){
    localStorage.setItem('feeVoucherTemplate', JSON.stringify(values))
    setSavedTemplate(values)
    setSaveMessage('Voucher template saved.')
  }

  const { ref: schoolNameRef, ...schoolNameReg } = register('schoolName')
  const { ref: schoolAddressRef, ...schoolAddressReg } = register('schoolAddress')

  return (
    <div>
      <PageHeader title="Fee Voucher" />
      {saveMessage ? <div className="mt-2 text-sm text-green-600">{saveMessage}</div> : null}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-medium">School Info</h3>
          <Input
            {...schoolNameReg}
            ref={schoolNameRef}
            placeholder="School Name"
            className="mt-2"
          />
          {errors.schoolName && <div className="text-red-500 text-sm">{errors.schoolName.message}</div>}
          <Input
            {...schoolAddressReg}
            ref={schoolAddressRef}
            placeholder="School Address"
            className="mt-2"
          />
          {errors.schoolAddress && <div className="text-red-500 text-sm">{errors.schoolAddress.message}</div>}
        </Card>

        <Card>
          <h3 className="font-medium">Bank Accounts</h3>
          <div className="mt-2 space-y-2">
            {fields.map((f,i)=> (
              <div key={f.id} className="flex gap-2">
                {(() => {
                  const { ref: bankNameRef, ...bankNameReg } = register(`banks.${i}.bankName`)
                  const { ref: accountRef, ...accountReg } = register(`banks.${i}.account`)
                  return (
                    <>
                      <Input {...bankNameReg} ref={bankNameRef} placeholder="Bank Name" className="flex-1" />
                      <Input {...accountReg} ref={accountRef} placeholder="Account" className="flex-1" />
                      <Button type="button" variant="outline" size="sm" onClick={() => remove(i)}>
                        Remove
                      </Button>
                    </>
                  )
                })()}
              </div>
            ))}
            <div>
              <Button type="button" variant="secondary" onClick={() => append({ bankName:'', account:'' })}>
                Add Another Bank
              </Button>
            </div>
          </div>
        </Card>

        <div className="md:col-span-2">
          <Card className="mt-4">
            <h3 className="font-medium">Voucher Preview</h3>
            {savedTemplate ? (
              <div className="mt-3 p-4 border rounded space-y-2 text-sm">
                <div><span className="font-medium">School:</span> {savedTemplate.schoolName}</div>
                <div><span className="font-medium">Address:</span> {savedTemplate.schoolAddress}</div>
                <div>
                  <span className="font-medium">Banks:</span>
                  <ul className="list-disc ml-6 mt-1">
                    {savedTemplate.banks.map((bank, index) => (
                      <li key={`${bank.bankName}-${index}`}>{bank.bankName} - {bank.account}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-4 border rounded text-sm text-gray-500">Save a template to preview the voucher content here.</div>
            )}
          </Card>

          <div className="mt-3 flex gap-2">
            <Button type="submit" variant="primary">Save Voucher</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
