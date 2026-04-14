export type DomainKey = 'platform' | 'etl_ingestion' | 'data_processing' | 'productionizing' | 'governance';

export interface DomainMeta {
  displayName: string;
  weight: number;
  count: number;
}

/**
 * Official Databricks Data Engineer Associate domain weights.
 * Counts sum to exactly 45: 7 + 9 + 15 + 9 + 5 = 45
 *
 * Note: The official exam weights are approximate:
 *   platform: 10%, etl_ingestion: 30%, data_processing: 31%,
 *   productionizing: 18%, governance: 11%
 * The weights below are adjusted to sum to 1.0 for scoring.
 */
export const DOMAIN_CONFIG: Record<DomainKey, DomainMeta> = {
  platform: {
    displayName: 'Databricks Intelligence Platform',
    weight: 0.15,
    count: 7,
  },
  etl_ingestion: {
    displayName: 'ETL & Data Ingestion',
    weight: 0.20,
    count: 9,
  },
  data_processing: {
    displayName: 'Data Processing & Transformations',
    weight: 0.35,
    count: 15,
  },
  productionizing: {
    displayName: 'Productionizing Data Pipelines',
    weight: 0.20,
    count: 9,
  },
  governance: {
    displayName: 'Data Governance & Quality',
    weight: 0.10,
    count: 5,
  },
};

export const TOTAL_QUESTIONS = Object.values(DOMAIN_CONFIG)
  .reduce((sum, d) => sum + d.count, 0); // Must equal 45
