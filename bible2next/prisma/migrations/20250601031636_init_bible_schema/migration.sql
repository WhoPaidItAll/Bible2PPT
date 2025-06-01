-- CreateTable
CREATE TABLE "BibleSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BibleVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    CONSTRAINT "BibleVersion_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "BibleSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "Book_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BibleVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    CONSTRAINT "Chapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Verse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "verseNumber" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Verse_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BibleSource_identifier_key" ON "BibleSource"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "BibleVersion_sourceId_identifier_key" ON "BibleVersion"("sourceId", "identifier");

-- CreateIndex
CREATE INDEX "Book_versionId_order_idx" ON "Book"("versionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Book_versionId_abbreviation_key" ON "Book"("versionId", "abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_bookId_chapterNumber_key" ON "Chapter"("bookId", "chapterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Verse_chapterId_verseNumber_key" ON "Verse"("chapterId", "verseNumber");
