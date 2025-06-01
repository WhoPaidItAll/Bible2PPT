import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;
  if (!jobId) {
    return NextResponse.json({ message: 'Job ID is required' }, { status: 400 });
  }

  try {
    // Check if the job exists before attempting to delete (optional, delete is idempotent)
    // However, Prisma's delete throws P2025 if record not found, so this check is good for a custom message.
    const jobExists = await prisma.jobHistory.findUnique({
      where: { id: jobId },
    });

    if (!jobExists) {
      return NextResponse.json({ message: `Job with ID ${jobId} not found.` }, { status: 404 });
    }

    await prisma.jobHistory.delete({
      where: {
        id: jobId,
      },
    });
    return NextResponse.json({ message: `Job ${jobId} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error(`[API History DELETE ${jobId}] Error:`, error);
    // Handle potential Prisma errors, e.g., if the record was already deleted (though findUnique check should prevent this specific case)
    if ((error as any).code === 'P2025') { // Prisma's RecordNotFound error code for delete operation
         return NextResponse.json({ message: `Job with ID ${jobId} not found or already deleted.` }, { status: 404 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to delete job history', error: errorMessage }, { status: 500 });
  }
}
