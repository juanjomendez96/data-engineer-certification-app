import questionsRaw from '../data/questions.json';
import { DOMAIN_CONFIG, DomainKey } from './domainConfig';
import { Question } from './types';
import { validateBank } from './validateBank';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const bank = questionsRaw as unknown as Question[];

validateBank(bank);

export function sampleExam(): Question[] {
  const sampled: Question[] = [];
  for (const [domain, { count }] of Object.entries(DOMAIN_CONFIG)) {
    const pool = bank.filter(q => q.domain === (domain as DomainKey));
    sampled.push(...shuffle(pool).slice(0, count));
  }
  return shuffle(sampled);
}
