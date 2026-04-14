import { z } from 'zod';

const DomainKeySchema = z.enum([
  'platform', 'etl_ingestion', 'data_processing',
  'productionizing', 'governance'
]);

const LanguageSchema = z.enum(['python', 'sql', 'bash', 'scala']);

export const QuestionSchema = z.object({
  id: z.string().regex(/^q\d{3}$/, 'ID must match /^q\\d{3}$/'),
  domain: DomainKeySchema,
  subtopics: z.array(z.string()).min(1, 'At least one subtopic required'),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string().min(10, 'Question text too short'),
  code: z.object({
    snippet: z.string().min(1),
    language: LanguageSchema,
  }).optional(),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  answer: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  explanation: z.string().min(10, 'Explanation too short'),
  source: z.string().optional(),
});

export const QuestionBankSchema = z.array(QuestionSchema);
export type Question = z.infer<typeof QuestionSchema>;
