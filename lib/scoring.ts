import { DOMAIN_CONFIG, DomainKey } from './domainConfig';
import { ExamSession, ExamResult, DomainResult } from './types';
import questionsRaw from '../data/questions.json';
import { Question } from './types';

const bank = questionsRaw as unknown as Question[];
const bankMap = new Map(bank.map(q => [q.id, q]));

export function scoreSession(
  session: ExamSession,
  expiredByTimer = false
): ExamResult {
  const questions = session.questionIds.map(id => bankMap.get(id)!);

  const domainResults = {} as Record<DomainKey, DomainResult>;
  let totalCorrect = 0;

  for (const [domain, { weight }] of Object.entries(DOMAIN_CONFIG)) {
    const domainQs = questions.filter(q => q.domain === domain);
    const correct = domainQs.filter(
      q => session.answers[q.id] === q.answer
    ).length;
    totalCorrect += correct;
    domainResults[domain as DomainKey] = {
      correct,
      total: domainQs.length,
      percentage: domainQs.length > 0 ? (correct / domainQs.length) * 100 : 0,
      weight,
    };
  }

  const weightedScore = Object.entries(domainResults).reduce(
    (sum, [, r]) => sum + (r.total > 0 ? (r.correct / r.total) * r.weight : 0),
    0
  );

  const durationSeconds = Math.min(
    (Date.now() - session.startTimestamp) / 1000,
    5400
  );

  return {
    weightedScore,
    percentage: parseFloat((weightedScore * 100).toFixed(1)),
    passed: weightedScore >= 0.70,
    totalCorrect,
    totalQuestions: 45,
    domains: domainResults,
    questionIds: session.questionIds,
    answers: session.answers,
    durationSeconds,
    answeredAt: Date.now(),
    expired: expiredByTimer,
  };
}
