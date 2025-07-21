import { NextRequest, NextResponse } from 'next/server'
import { batchSaveService } from '@/lib/batch-save-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const saveStatus = batchSaveService.getSaveStatus(botId)

    if (!saveStatus) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(saveStatus)
  } catch (error) {
    console.error('Error fetching batch save status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
