const { supabaseAnon: supabase } = require("../config/supabaseClient");

/* ============ Quizzes ============ */

async function getQuizzesByCourse(courseId) {
  console.log("getQuizzesByCourse called with courseId:", courseId);
  const { data, error } = await supabase
    .from("quizzes")
    .select(`*, questions(*, question_options(*), question_true_false(*), matching_pairs(*))`)
    .eq("course_id", courseId);
  if (error) {
    console.error("Error fetching quizzes by course:", error);
    throw error;
  }
  return data;
}

async function getQuizById(id) {
  const { data, error } = await supabase
    .from("quizzes")
    .select(`*, questions(*, question_options(*), question_true_false(*), matching_pairs(*))`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function createQuiz(payload) {
  const { title, minutes, courseId, questions = [] } = payload;
console.log("createQuiz called with payload:", payload);
  const { data: quiz, error: quizErr } = await supabase
    .from("quizzes")
    .insert({ title, minutes, course_id:courseId })
    .select()
    .single();
  if (quizErr) throw quizErr;

  for (const [i, q] of questions.entries()) {
    const { data: question, error: qErr } = await supabase
      .from("questions")
      .insert({ quiz_id: quiz.id, type: q.type, text: q.text, order_index: i })
      .select()
      .single();
    if (qErr) throw qErr;

    if (q.type === "qcm") {
      const opts = q.options.map((opt, idx) => ({
        question_id: question.id,
        option_text: opt,
        is_correct: q.correctOptionIndexes.includes(idx),
        order_index: idx,
      }));
      const { error } = await supabase.from("question_options").insert(opts);
      if (error) throw error;
    }

    if (q.type === "true_false") {
      const { error } = await supabase
        .from("question_true_false")
        .insert({ question_id: question.id, correct_boolean: q.correctBoolean });
      if (error) throw error;
    }

    if (q.type === "matching") {
      const pairs = q.pairs.map((p) => ({
        question_id: question.id,
        left_text: p.left,
        right_text: p.right,
      }));
      const { error } = await supabase.from("matching_pairs").insert(pairs);
      if (error) throw error;
    }
  }

  return getQuizById(quiz.id);
}

async function updateQuiz(id, payload) {
  const { title, minutes } = payload;
  const { data, error } = await supabase
    .from("quizzes")
    .update({ title, minutes })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
  // ملاحظة: تحديث الأسئلة يتم عبر endpoints الخاصة بالأسئلة (addQuestion/updateQuestion/removeQuestion)
}

async function deleteQuiz(id) {
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/* ============ Attempts ============ */

async function saveAttempt(quizId, studentId, { score, total, answers }) {
  const { data: attempt, error: attErr } = await supabase
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, student_id: studentId, score, total })
    .select()
    .single();
  if (attErr) throw attErr;

  const rows = Object.entries(answers).map(([questionId, answerData]) => ({
    attempt_id: attempt.id,
    question_id: questionId,
    answer_data: answerData,
  }));
  const { error: ansErr } = await supabase.from("quiz_answers").insert(rows);
  if (ansErr) throw ansErr;

  return attempt;
}

async function getAttemptsByStudent(studentId) {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(`*, quiz_answers(*)`)
    .eq("student_id", studentId);
  if (error) throw error;
  return data;
}

/* ============ Questions ============ */

async function getQuestionById(id) {
  const { data, error } = await supabase
    .from("questions")
    .select(`*, question_options(*), question_true_false(*), matching_pairs(*)`)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function addQuestion(quizId, payload) {
  const { type, text, options = [], correctOptionIndexes = [], correctBoolean, pairs = [] } = payload;

  const { data: existing, error: countErr } = await supabase
    .from("questions")
    .select("order_index")
    .eq("quiz_id", quizId)
    .order("order_index", { ascending: false })
    .limit(1);
  if (countErr) throw countErr;
  const nextOrder = existing?.length ? existing[0].order_index + 1 : 0;

  const { data: question, error: qErr } = await supabase
    .from("questions")
    .insert({ quiz_id: quizId, type, text, order_index: nextOrder })
    .select()
    .single();
  if (qErr) throw qErr;

  if (type === "qcm") {
    const opts = options.map((opt, idx) => ({
      question_id: question.id,
      option_text: opt,
      is_correct: correctOptionIndexes.includes(idx),
      order_index: idx,
    }));
    const { error } = await supabase.from("question_options").insert(opts);
    if (error) throw error;
  }

  if (type === "true_false") {
    const { error } = await supabase
      .from("question_true_false")
      .insert({ question_id: question.id, correct_boolean: correctBoolean });
    if (error) throw error;
  }

  if (type === "matching") {
    const rows = pairs.map((p) => ({
      question_id: question.id,
      left_text: p.left,
      right_text: p.right,
    }));
    const { error } = await supabase.from("matching_pairs").insert(rows);
    if (error) throw error;
  }

  return getQuestionById(question.id);
}

async function updateQuestion(quizId, questionId, payload) {
  const { type, text, options, correctOptionIndexes, correctBoolean, pairs } = payload;

  const { error: qErr } = await supabase
    .from("questions")
    .update({ type, text })
    .eq("id", questionId)
    .eq("quiz_id", quizId);
  if (qErr) throw qErr;

  await supabase.from("question_options").delete().eq("question_id", questionId);
  await supabase.from("question_true_false").delete().eq("question_id", questionId);
  await supabase.from("matching_pairs").delete().eq("question_id", questionId);

  if (type === "qcm" && options?.length) {
    const opts = options.map((opt, idx) => ({
      question_id: questionId,
      option_text: opt,
      is_correct: (correctOptionIndexes || []).includes(idx),
      order_index: idx,
    }));
    const { error } = await supabase.from("question_options").insert(opts);
    if (error) throw error;
  }

  if (type === "true_false") {
    const { error } = await supabase
      .from("question_true_false")
      .insert({ question_id: questionId, correct_boolean: correctBoolean });
    if (error) throw error;
  }

  if (type === "matching" && pairs?.length) {
    const rows = pairs.map((p) => ({
      question_id: questionId,
      left_text: p.left,
      right_text: p.right,
    }));
    const { error } = await supabase.from("matching_pairs").insert(rows);
    if (error) throw error;
  }

  return getQuestionById(questionId);
}

async function removeQuestion(quizId, questionId) {
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", questionId)
    .eq("quiz_id", quizId);
  if (error) throw error;
  return true;
}

module.exports = {
  getQuizzesByCourse,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  saveAttempt,
  getAttemptsByStudent,
  addQuestion,
  updateQuestion,
  removeQuestion,
};