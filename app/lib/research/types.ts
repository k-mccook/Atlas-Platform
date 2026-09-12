export type SearchResult = {
  chunk_id: string;
  source_id: string;
  source_title: string | null;
  organization: string | null;
  source_type: string | null;
  source_url: string | null;
  domain: string | null;
  section: string | null;
  chunk_title: string | null;
  authority_level: string | null;
  source_version: string | null;
  effective_date: string | null;
  content: string;
  rank: number;
};

export type TargetSource =
  | 'Fannie Mae'
  | 'Freddie Mac'
  | 'FHA'
  | 'USPAP'
  | 'VA'
  | 'UAD'
  | null;

export type Topic =
  | 'comparable_sales'
  | 'adjustments'
  | 'sales_comparison'
  | 'reconciliation'
  | 'verification'
  | 'concessions'
  | 'market_area'
  | 'older_comparables'
  | 'rural_comparables'
  | 'distance'
  | 'listings_contracts'
  | 'general';

