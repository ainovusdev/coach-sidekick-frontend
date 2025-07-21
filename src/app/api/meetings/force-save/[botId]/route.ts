import { NextRequest, NextResponse } from 'next/server'
import { batchSaveService } from '@/lib/batch-save-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> },
) {
  try {
    const { botId } = await params

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const result = await batchSaveService.forceSaveSession(botId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to force save' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${result.savedCount} transcript entries`,
      savedCount: result.savedCount,
    })
  } catch (error) {
    console.error('Error in force save:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
