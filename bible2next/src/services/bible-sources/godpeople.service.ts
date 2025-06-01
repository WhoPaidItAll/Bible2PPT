import axios from 'axios';
import iconv from 'iconv-lite';

const GODPEOPLE_BASE_URL = 'http://find.godpeople.com';

interface VerseData {
  number: number;
  text: string;
}

// Helper function to mimic C# ENCODING.GetBytes(s).Select(b => $"%{b:X}").Join("") for EUC-KR
function encodeStringToEucKrUrl(text: string): string {
  const buffer = iconv.encode(text, 'euc-kr');
  let encoded = '';
  for (let i = 0; i < buffer.length; i++) {
    encoded += '%' + buffer[i].toString(16).toUpperCase();
  }
  return encoded;
}

// Helper function to strip HTML tags, similar to C# version
function stripHtmlTags(html: string): string {
  // This regex is a direct translation from the C# version.
  // It might be improved for robustness if needed.
  return html.replace(/<u.+?u>|<.+?>/g, '').trim();
}

async function getVerses(
  bibleVersionIdentifier: string, // e.g., "rvsn" (개역개정 from Godpeople)
  bookOnlineId: string,           // The OnlineId/abbreviation Godpeople uses, e.g., "창"
  chapterNumber: number
): Promise<VerseData[]> {
  if (!bibleVersionIdentifier || !bookOnlineId || chapterNumber < 1) {
    throw new Error('Invalid parameters for fetching verses.');
  }

  const encodedBookId = encodeStringToEucKrUrl(bookOnlineId);
  const url = `/\?page=bidx&kwrd=\${encodedBookId}\${chapterNumber}&vers=\${bibleVersionIdentifier}`;

  console.log(`Fetching verses from Godpeople: \${GODPEOPLE_BASE_URL}\${url}`);

  try {
    const response = await axios.get(url, {
      baseURL: GODPEOPLE_BASE_URL,
      responseType: 'arraybuffer', // Important to get raw bytes
      timeout: 10000, // 10 seconds timeout
    });

    // Decode the response from EUC-KR to UTF-8 string
    const decodedData = iconv.decode(response.data, 'euc-kr');

    const verses: VerseData[] = [];
    // Regex to find verses: bidx_listTd_yak.+?>(\d+)[\s\S]+?bidx_listTd_phrase.+?>(.+?)</td
    // Need to be careful with [\s\S] in JS regex if not handled by default like C# Singleline
    const verseRegex = /bidx_listTd_yak[^>]*>(\d+)[\s\S]*?bidx_listTd_phrase[^>]*>([\s\S]+?)<\/td/g;

    let match;
    while ((match = verseRegex.exec(decodedData)) !== null) {
      const verseNumber = parseInt(match[1], 10);
      const rawText = match[2];
      const cleanedText = stripHtmlTags(rawText);
      if (!isNaN(verseNumber) && cleanedText) {
        verses.push({ number: verseNumber, text: cleanedText });
      }
    }

    if (verses.length === 0) {
        console.warn(`No verses found for \${bookOnlineId} chapter \${chapterNumber} (\${bibleVersionIdentifier}). Response might be empty or parsing failed.`);
        console.warn(`URL: \${GODPEOPLE_BASE_URL}\${url}`);
        // console.warn(`Decoded data snippet: \${decodedData.substring(0, 500)}`);
    }

    return verses;
  } catch (error) {
    console.error(`Error fetching verses from Godpeople for \${bookOnlineId} \${chapterNumber} (\${bibleVersionIdentifier}):\`, error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        // data: error.response?.data ? iconv.decode(error.response.data, 'euc-kr').substring(0, 200) : 'No response data'
      });
    }
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Example of how this service might be structured or exported
// For now, we'll just export the function directly for testing in API routes
export const GodpeopleBibleService = {
  getVerses,
  // In a real scenario, you might also port getBiblesOnlineAsync and getBooksOnlineAsync
  // but those are covered by our seeding for now.
};

// Quick test function (can be removed later)
async function testService() {
  try {
    // Test with Genesis chapter 1 from 개역개정 (rvsn)
    console.log("Testing GodpeopleBibleService with Genesis 1 (rvsn)...");
    const verses = await GodpeopleBibleService.getVerses('rvsn', '창', 1);
    if (verses.length > 0) {
      console.log("Successfully fetched verses for Genesis 1 (rvsn):");
      verses.slice(0, 3).forEach(v => console.log(`  \${v.number}. \${v.text}`));
    } else {
      console.log("Test finished, but no verses were returned for Genesis 1 (rvsn).");
    }
  } catch (e) {
    console.error("Test failed:", e);
  }
}

// Uncomment to run test when file is directly executed (e.g. via ts-node for debug)
// if (require.main === module) {
//   testService();
// }
