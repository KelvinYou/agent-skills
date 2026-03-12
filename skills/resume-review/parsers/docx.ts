import mammoth from 'mammoth';

/**
 * Extract text content from a DOCX file.
 */
export async function parseDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value.trim();
}
