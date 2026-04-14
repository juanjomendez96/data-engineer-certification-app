import { DOMAIN_CONFIG, DomainKey } from './domainConfig';
import { Question } from './types';

export function validateBank(bank: Question[]): void {
  const errors: string[] = [];
  const ids = bank.map(q => q.id);
  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    errors.push(`Duplicate question IDs detected.`);
  }

  for (const [domain, { count }] of Object.entries(DOMAIN_CONFIG)) {
    const pool = bank.filter(q => q.domain === (domain as DomainKey));
    if (pool.length < count) {
      errors.push(
        `Domain '${domain}' requires ${count} questions but only ${pool.length} are available.`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Question bank validation failed:\n${errors.join('\n')}`);
  }
}
