import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BookSeedData {
  key: string; // Corresponds to BookKey enum names for reference
  name: string;
  abbreviation: string;
  chapterCount: number;
  order: number;
}

interface VersionSeedData {
  identifier: string;
  name: string;
  language: string;
  books: BookSeedData[];
}

interface SourceSeedData {
  identifier: string;
  name: string;
  versions: VersionSeedData[];
}

interface SeedData {
  sources: SourceSeedData[];
}

async function main() {
  console.log(\`Start seeding ...\`);

  const seedFilePath = path.join(__dirname, 'books_seed_data.json');
  const seedFileContent = fs.readFileSync(seedFilePath, 'utf-8');
  const seedData = JSON.parse(seedFileContent) as SeedData;

  for (const sourceData of seedData.sources) {
    const source = await prisma.bibleSource.upsert({
      where: { identifier: sourceData.identifier },
      update: { name: sourceData.name },
      create: {
        identifier: sourceData.identifier,
        name: sourceData.name,
      },
    });
    console.log(\`Upserted source: \${source.name}\`);

    for (const versionData of sourceData.versions) {
      const version = await prisma.bibleVersion.upsert({
        where: {
          sourceId_identifier: { // Using the compound unique key
            sourceId: source.id,
            identifier: versionData.identifier
          }
        },
        update: {
          name: versionData.name,
          language: versionData.language,
        },
        create: {
          sourceId: source.id,
          identifier: versionData.identifier,
          name: versionData.name,
          language: versionData.language,
        },
      });
      console.log(\`  Upserted version: \${version.name} for source \${source.name}\`);

      for (const bookData of versionData.books) {
        // Query for the book to get its chapterCount if it exists
        const existingBook = await prisma.book.findUnique({
          where: {
            versionId_abbreviation: {
              versionId: version.id,
              abbreviation: bookData.abbreviation,
            },
          },
        });

        // Determine chapterCount for upsert
        // The problem states: "The chapterCount field on the Book model should be removed as it will be derived from the actual Chapter data later"
        // However, the seed script *provides* chapterCount. And the schema *still has* chapterCount on Book model.
        // For now, I will keep the logic as in the provided seed script, which uses the chapterCount from JSON.
        // If the intention is to truly remove it and derive it, this seed script and potentially the schema would need changes.
        // For this subtask, I will follow the provided script.

        await prisma.book.upsert({
          where: {
            versionId_abbreviation: { // Using the compound unique key
              versionId: version.id,
              abbreviation: bookData.abbreviation
            }
          },
          update: {
            name: bookData.name,
            order: bookData.order,
            // chapterCount: bookData.chapterCount, // Keep if schema expects it
          },
          create: {
            versionId: version.id,
            name: bookData.name,
            abbreviation: bookData.abbreviation,
            order: bookData.order,
            // chapterCount: bookData.chapterCount, // Keep if schema expects it
          },
        });
        // console.log(\`    Upserted book: \${bookData.name} for version \${version.name}\`);
      }
      console.log(\`    Upserted \${versionData.books.length} books for version \${version.name}\`);
    }
  }

  console.log(\`Seeding finished.\`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.\$disconnect();
  });
