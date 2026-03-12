import pdfParse from 'pdf-parse';
import { readFile } from 'fs/promises';

/**
 * Extract text content from a PDF file.
 */
export async function parsePdf(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text.trim();
}
