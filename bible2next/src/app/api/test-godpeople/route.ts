import { NextResponse } from 'next/server';
import { GodpeopleBibleService } from '@/services/bible-sources/godpeople.service';

export async function GET() {
  try {
    // Fetch Genesis 1 from 'rvsn' (개역개정) which uses '창' as OnlineId
    const verses = await GodpeopleBibleService.getVerses('rvsn', '창', 1);
    if (verses.length > 0) {
      return NextResponse.json({ success: true, book: '창세기', chapter: 1, version: '개역개정 (rvsn)', count: verses.length, verses });
    } else {
      return NextResponse.json({ success: false, message: 'No verses found, but request was made.' }, { status: 404 });
    }
  } catch (error) {
    console.error('[API Test Godpeople] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: 'Failed to fetch verses from Godpeople', error: errorMessage }, { status: 500 });
  }
}
