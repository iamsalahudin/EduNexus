"use client"

import { ButtonLink, Card } from '@/components/ui'

export default function AttendanceActionCard({
  title,
  description,
  href,
  buttonLabel,
  icon,
  iconClassName = 'bg-blue-100',
  buttonVariant = 'primary',
  children,
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClassName}`}>
          <span className="text-lg">{icon}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {children || (
        <ButtonLink href={href} variant={buttonVariant} className="w-full">
          {buttonLabel}
        </ButtonLink>
      )}
    </Card>
  )
}
