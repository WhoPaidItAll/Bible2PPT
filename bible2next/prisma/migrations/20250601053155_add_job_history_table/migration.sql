-- CreateTable
CREATE TABLE "JobHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queryString" TEXT NOT NULL,
    "bibleVersionsUsed" JSONB NOT NULL,
    "optionsUsed" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "outputFilename" TEXT,
    "errorMessage" TEXT
);

-- CreateIndex
CREATE INDEX "JobHistory_createdAt_idx" ON "JobHistory"("createdAt");
