export interface SearchOptions {
  /** Regex or literal string to search for */
  pattern: string;
  /** Root directory to search from (default: process.cwd()) */
  directory?: string;
  /** File extensions to include (default: common source extensions) */
  fileExtensions?: string[];
  /** Case-sensitive matching (default: false) */
  caseSensitive?: boolean;
  /** Number of context lines to include before and after each match (default: 2) */
  contextLines?: number;
  /** Maximum number of results to return (default: 100) */
  maxResults?: number;
  /** Directory/file names to skip (merged with built-in ignore list) */
  ignore?: string[];
}

export interface SearchMatch {
  /** Absolute path to the matched file */
  file: string;
  /** 1-based line number */
  line: number;
  /** 1-based column of first match */
  column: number;
  /** The matched line (trimmed) */
  content: string;
  /** Lines surrounding the match */
  context: {
    before: string[];
    after: string[];
  };
}

export interface SearchResult {
  /** Original pattern used */
  pattern: string;
  /** Number of files scanned */
  filesScanned: number;
  /** Total match count */
  totalMatches: number;
  /** Grouped by file for easy consumption */
  byFile: Record<string, SearchMatch[]>;
  /** Flat list in order found */
  matches: SearchMatch[];
}
