// scripts/sync_all_to_supabase.cjs
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://swehdtrqjyklmsefkjdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30.dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function chunkArray(array, size = 50) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function syncExams() {
  console.log('🚀 Syncing 10 Predicted Exams to Supabase `thpt_exams`...');
  const examsPath = path.resolve('public/data/thpt_exams.json');
  const allExams = JSON.parse(fs.readFileSync(examsPath, 'utf8'));
  const devExams = allExams.filter(e => e.id.startsWith('thpt-exam-dev-'));

  for (const ex of devExams) {
    const { error } = await supabase
      .from('thpt_exams')
      .update({
        sections: ex.sections,
        questions: ex.questions,
        total_questions: ex.total_questions || 40,
        updated_at: new Date().toISOString()
      })
      .eq('id', ex.id);

    if (error) {
      console.error(`❌ Error updating exam ${ex.id}:`, error.message);
    } else {
      console.log(`✅ Exam ${ex.id} updated with ${ex.sections.length} sections and ${ex.questions.length} questions.`);
    }
  }
}

async function syncExerciseQuestions() {
  console.log('🚀 Syncing 29 Chuyên đề Questions (1.004 questions) to Supabase `exercise_questions`...');
  const qsPath = path.resolve('public/data/hivocab_29_chuyen_de_questions.json');
  const questions = JSON.parse(fs.readFileSync(qsPath, 'utf8'));

  const batches = chunkArray(questions, 50);
  let updatedCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const payload = batch.map(q => ({
      id: q.id,
      exercise_id: q.exercise_id,
      question_type: q.question_type || 'multiple_choice',
      prompt: q.prompt,
      passage: q.passage || null,
      is_arrangement: Boolean(q.is_arrangement),
      arrangement_sentences: q.arrangement_sentences || null,
      options: q.options,
      answer: q.answer,
      hint: q.hint,
      order_index: q.order_index
    }));

    const { error } = await supabase
      .from('exercise_questions')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Batch ${i + 1}/${batches.length} failed:`, error.message);
    } else {
      updatedCount += batch.length;
      process.stdout.write(`✅ Synced ${updatedCount}/${questions.length} questions...\r`);
    }
  }
  console.log(`\n🎉 All ${updatedCount} exercise questions synced successfully!`);
}

async function main() {
  try {
    await syncExams();
    await syncExerciseQuestions();
    console.log('🌟 All data synchronized to Supabase successfully!');
  } catch (err) {
    console.error('Fatal error during sync:', err);
    process.exit(1);
  }
}

main();
