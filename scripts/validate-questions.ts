import questionsRaw from '../data/questions.json';
import { QuestionBankSchema } from '../lib/questionSchema';
import { validateBank } from '../lib/validateBank';

function main() {
  console.log('Validating question bank...\n');

  const result = QuestionBankSchema.safeParse(questionsRaw);
  if (!result.success) {
    console.error('Schema validation failed:');
    result.error.issues.forEach(issue => {
      console.error(`  [${issue.path.join('.')}] ${issue.message}`);
    });
    process.exit(1);
  }

  try {
    validateBank(result.data as Parameters<typeof validateBank>[0]);
  } catch (err) {
    console.error(String(err));
    process.exit(1);
  }

  console.log(`✓ ${result.data.length} questions valid`);
  const counts: Record<string, number> = {};
  result.data.forEach(q => { counts[q.domain] = (counts[q.domain] ?? 0) + 1; });
  console.table(counts);
  process.exit(0);
}

main();
