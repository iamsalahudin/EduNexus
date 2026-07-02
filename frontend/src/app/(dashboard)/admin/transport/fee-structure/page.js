"use client"

import { PageHeader, Card } from '@/components/ui'

export default function Page() {
	return (
		<div className="space-y-6">
			<PageHeader title="Transport Fee Structure" subtitle="Configure transport fee settings by route." />
			<Card>
				<p className="text-sm text-gray-600">Transport fee structure setup will be configured here.</p>
			</Card>
		</div>
	)
}
