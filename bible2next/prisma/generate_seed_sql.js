const fs = require('fs');
const path = require('path');

const seedFilePath = path.join(__dirname, 'books_seed_data.json');
const seedFileContent = fs.readFileSync(seedFilePath, 'utf-8');
const seedData = JSON.parse(seedFileContent);

let sqlStatements = 'BEGIN TRANSACTION;\n';

// Helper to generate cuid-like unique IDs
// This is a simplified version for seeding, Prisma handles actual cuids
const usedIds = new Set();
function generateSimpleId(prefix) {
  let id;
  do {
    id = prefix + '_' + Math.random().toString(36).substr(2, 9);
  } while (usedIds.has(id));
  usedIds.add(id);
  return id;
}

seedData.sources.forEach(sourceData => {
  const sourceId = generateSimpleId('src');
  sqlStatements += `INSERT INTO "BibleSource" ("id", "identifier", "name") VALUES ('${sourceId}', '${sourceData.identifier}', '${sourceData.name.replace(/'/g, "''")}') ON CONFLICT("identifier") DO UPDATE SET "name" = excluded.name;\n`;

  sourceData.versions.forEach(versionData => {
    const versionId = generateSimpleId('ver');
    sqlStatements += `INSERT INTO "BibleVersion" ("id", "sourceId", "identifier", "name", "language") VALUES ('${versionId}', '${sourceId}', '${versionData.identifier}', '${versionData.name.replace(/'/g, "''")}', '${versionData.language}') ON CONFLICT("sourceId", "identifier") DO UPDATE SET "name" = excluded.name, "language" = excluded.language;\n`;

    versionData.books.forEach(bookData => {
      const bookId = generateSimpleId('bk');
      // Note: Prisma's schema has @@unique([versionId, abbreviation]) for Book
      // SQLite's ON CONFLICT can use this.
      // The schema does NOT have chapterCount on Book model. It was removed.
      // So, the INSERT statement must not include chapterCount.
      sqlStatements += `INSERT INTO "Book" ("id", "versionId", "name", "abbreviation", "order") VALUES ('${bookId}', '${versionId}', '${bookData.name.replace(/'/g, "''")}', '${bookData.abbreviation.replace(/'/g, "''")}', ${bookData.order}) ON CONFLICT("versionId", "abbreviation") DO UPDATE SET "name" = excluded.name, "order" = excluded."order";\n`;
    });
  });
});

sqlStatements += 'COMMIT;\n';

const outputSqlPath = path.join(__dirname, 'seed_script.sql');
fs.writeFileSync(outputSqlPath, sqlStatements);
console.log(`Generated SQL script at ${outputSqlPath}`);
