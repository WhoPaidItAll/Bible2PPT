/*
  Warnings:

  - The primary key for the `Chapter` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    CONSTRAINT "Chapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Chapter" ("bookId", "id", "number") SELECT "bookId", "id", "number" FROM "Chapter";
DROP TABLE "Chapter";
ALTER TABLE "new_Chapter" RENAME TO "Chapter";
CREATE TABLE "new_Verse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    CONSTRAINT "Verse_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Verse" ("chapterId", "id", "number", "text") SELECT "chapterId", "id", "number", "text" FROM "Verse";
DROP TABLE "Verse";
ALTER TABLE "new_Verse" RENAME TO "Verse";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
