import axios from 'axios';
// import iconv from 'iconv-lite'; // Keep commented unless encoding issues arise

const GODPIA_BASE_URL = 'http://bible.godpia.com';

interface VerseData {
  number: number;
  text: string;
}

// Helper function to strip HTML tags
// This regex is from the C# GodpiaBible.cs: Regex.Replace(s, @"<.+?>", "", RegexOptions.Singleline)
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

async function getVerses(
  bibleIdentifier: string, // e.g., "han" (개역한글 from Godpia)
  bookOnlineId: string,    // Godpia's specific ID for the book, e.g., "gen"
  chapterNumber: number
): Promise<VerseData[]> {
  if (!bibleIdentifier || !bookOnlineId || chapterNumber < 1) {
    throw new Error('Invalid parameters for fetching Godpia verses.');
  }

  const url = `/read/reading.asp?ver=${bibleIdentifier}&vol=${bookOnlineId}&chap=${chapterNumber}`;

  console.log(`Fetching verses from Godpia: ${GODPIA_BASE_URL}${url}`);

  try {
    const response = await axios.get(url, {
      baseURL: GODPIA_BASE_URL,
      timeout: 10000, // 10 seconds timeout
      // Godpia seems to respond with UTF-8 encoded HTML directly, so arraybuffer and iconv might not be needed
      // If encoding issues arise (e.g. garbled Korean text), then responseType: 'arraybuffer' and iconv.decode would be necessary.
    });

    const htmlData: string = response.data;
    const verses: VerseData[] = [];

    // Regex from C# GodpiaBible.cs: @"class=""num"">(\d+).*?</span>(.*?)</p>"
    // JS equivalent: /class="num">(\d+)<\/span>([\s\S]*?)<\/p>/gi
    // The content between </span> and </p> is captured by match[2]
    const verseRegex = /class="num">(\d+)<\/span>([\s\S]*?)<\/p>/gi;

    let match;
    while ((match = verseRegex.exec(htmlData)) !== null) {
      const verseNumber = parseInt(match[1], 10);
      // match[2] is the content between </span> and </p>
      const cleanedText = stripHtmlTags(match[2]);

      if (!isNaN(verseNumber) && cleanedText) {
        verses.push({ number: verseNumber, text: cleanedText });
      }
    }

    if (verses.length === 0) {
        console.warn(`No verses found for Godpia: ${bookOnlineId} chapter ${chapterNumber} (${bibleIdentifier}). Response might be empty or parsing failed.`);
        // console.warn(`Data snippet for Godpia: ${htmlData.substring(0, 1000)}`); // For debugging
    }

    return verses;
  } catch (error) {
    console.error(`Error fetching verses from Godpia for ${bookOnlineId} ${chapterNumber} (${bibleIdentifier}):`, error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Axios error details (Godpia):', {
        message: error.message,
        url: error.config?.url,
        status: error.response?.status,
        // responseData: error.response.data // Could be large, log snippet if needed
      });
    } else if (axios.isAxiosError(error)) {
        console.error('Axios error details (Godpia - no response):', {
            message: error.message,
            url: error.config?.url,
        });
    }
    throw error;
  }
}

export const GodpiaBibleService = {
  getVerses,
};

// Quick test function (can be removed or moved to a dedicated test file)
async function testGodpiaService() {
  try {
    console.log("Testing GodpiaBibleService with Genesis 1 (han)...");
    // "gen" is the onlineId for Genesis from GodpiaBible.cs
    const verses = await GodpiaBibleService.getVerses('han', 'gen', 1);
    if (verses.length > 0) {
      console.log("Successfully fetched verses from Godpia for Genesis 1 (han):");
      verses.slice(0, 3).forEach(v => console.log(`  ${v.number}. ${v.text}`));
    } else {
      console.log("Test finished for Godpia, but no verses were returned for Genesis 1 (han).");
    }
  } catch (e) {
    console.error("Godpia Service Test failed:", e);
  }
}

// Uncomment to run test when file is directly executed (e.g. via ts-node for debug)
// if (require.main === module) {
//   testGodpiaService();
// }
