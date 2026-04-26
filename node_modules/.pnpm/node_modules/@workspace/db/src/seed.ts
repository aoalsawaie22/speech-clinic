import { db } from "./index.js";
import {
  usersTable,
  specialistsTable,
  childrenTable,
  appointmentsTable,
  sessionsTable,
  exercisesTable,
  achievementsTable,
  childAchievementsTable,
  notificationsTable,
  messagesTable,
  progressTable,
} from "./schema/index.js";

const achievements = [
  { code: "first_session", title: "أول جلسة", titleEn: "First Session", description: "أكملت أول جلسة لك!", descriptionEn: "Completed your first session!", emoji: "🎉", points: 10, threshold: 1, category: "sessions" as const },
  { code: "five_sessions", title: "متابع نشيط", titleEn: "Active Learner", description: "أكملت 5 جلسات", descriptionEn: "Completed 5 sessions", emoji: "🌟", points: 25, threshold: 5, category: "sessions" as const },
  { code: "ten_sessions", title: "بطل الجلسات", titleEn: "Session Champion", description: "أكملت 10 جلسات", descriptionEn: "Completed 10 sessions", emoji: "🏆", points: 50, threshold: 10, category: "sessions" as const },
  { code: "twenty_sessions", title: "أسطورة الجلسات", titleEn: "Session Legend", description: "أكملت 20 جلسة", descriptionEn: "Completed 20 sessions", emoji: "👑", points: 100, threshold: 20, category: "sessions" as const },
  { code: "first_exercise", title: "أول تمرين", titleEn: "First Exercise", description: "أكملت أول تمرين", descriptionEn: "Completed your first exercise", emoji: "✨", points: 5, threshold: 1, category: "exercises" as const },
  { code: "ten_exercises", title: "نشاط مستمر", titleEn: "Consistent Practice", description: "أكملت 10 تمارين", descriptionEn: "Completed 10 exercises", emoji: "💪", points: 30, threshold: 10, category: "exercises" as const },
  { code: "fifty_exercises", title: "خبير التمارين", titleEn: "Exercise Expert", description: "أكملت 50 تمرين", descriptionEn: "Completed 50 exercises", emoji: "🎓", points: 75, threshold: 50, category: "exercises" as const },
  { code: "hundred_exercises", title: "محترف", titleEn: "Pro Trainer", description: "أكملت 100 تمرين", descriptionEn: "Completed 100 exercises", emoji: "🥇", points: 150, threshold: 100, category: "exercises" as const },
  { code: "perfect_score", title: "علامة كاملة", titleEn: "Perfect Score", description: "حصلت على 100% في تمرين", descriptionEn: "Got 100% on an exercise", emoji: "💯", points: 40, threshold: 100, category: "score" as const },
  { code: "high_scorer", title: "نجم الدرجات", titleEn: "Top Scorer", description: "حصلت على 90+ في تمرين", descriptionEn: "Got 90+ on an exercise", emoji: "⭐", points: 20, threshold: 90, category: "score" as const },
  { code: "speech_star", title: "نجم النطق", titleEn: "Speech Star", description: "إنجاز خاص بالنطق", descriptionEn: "Special speech achievement", emoji: "🎤", points: 50, threshold: 1, category: "special" as const },
  { code: "breath_master", title: "سيد التنفس", titleEn: "Breath Master", description: "أتقنت تمارين التنفس", descriptionEn: "Mastered breathing exercises", emoji: "💨", points: 30, threshold: 1, category: "special" as const },
];

const exercises = [
  // نطق الحروف (3)
  { title: "تمرين حرف الباء", description: "نطق حرف الباء بوضوح في كلمات مختلفة", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "كرر بعدي: بطة، باب، بيت، بقرة. ضع شفتيك معاً ثم افتحهما بسرعة.", duration: 8, emoji: "🅱️" },
  { title: "تمرين حرف الراء", description: "تدريب على نطق حرف الراء الصعب", category: "pronunciation", difficulty: "hard", minAge: 4, maxAge: 5, instructions: "كرر: راس، رمان، أرنب، بحر. اجعل لسانك يهتز خلف أسنانك العلوية.", duration: 12, emoji: "🐰" },
  { title: "أغنية الحروف الأبجدية", description: "تعلم نطق جميع الحروف من خلال أغنية", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "غنِّ معي: ألف، باء، تاء، ثاء، جيم، حاء، خاء... كرر مع الإيقاع.", duration: 15, emoji: "🎵" },
  // التنفس (2)
  { title: "تمرين التنفس العميق", description: "تعلم التنفس الصحيح للمساعدة في النطق", category: "breathing", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "خذ نفساً عميقاً من أنفك ببطء، ثم أخرجه من فمك ببطء. كرر 5 مرات.", duration: 5, emoji: "💨" },
  { title: "نفخ الشموع", description: "تقوية عضلات النفخ", category: "breathing", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "تخيل أن أمامك 5 شموع، انفخ على كل شمعة بقوة لإطفائها.", duration: 5, emoji: "🕯️" },
  // عضلات الفم (2)
  { title: "حركات اللسان", description: "تقوية عضلات اللسان", category: "oral_muscle", difficulty: "easy", minAge: 3, maxAge: 5, instructions: "أخرج لسانك للأعلى، للأسفل، لليمين، لليسار. كرر 5 مرات.", duration: 6, emoji: "👅" },
  { title: "نفخ الخدود", description: "تقوية عضلات الخدين", category: "oral_muscle", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "انفخ خدودك مثل البالون، ثم اضغط عليها بيديك بلطف لإخراج الهواء.", duration: 5, emoji: "🤪" },
  // الاستماع (2)
  { title: "أصوات الحيوانات", description: "التعرف على الأصوات وتقليدها", category: "listening", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "استمع لصوت الحيوان ثم خمن: الكلب يقول واف، القطة تقول مياو.", duration: 8, emoji: "🐶" },
  { title: "اتبع التعليمات", description: "تنفيذ تعليمات بسيطة بعد الاستماع", category: "listening", difficulty: "medium", minAge: 3, maxAge: 5, instructions: "نفذ ما أقوله: ارفع يدك، اقفز مرتين، ثم اجلس.", duration: 10, emoji: "🦻" },
  // المفردات (3)
  { title: "تعلم الألوان", description: "تعرف على أسماء الألوان الأساسية", category: "vocabulary", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "أشر إلى اللون وقل اسمه: أحمر، أزرق، أخضر، أصفر، أبيض، أسود.", duration: 10, emoji: "🎨" },
  { title: "أسماء الفواكه", description: "تعلم أسماء الفواكه الشائعة", category: "vocabulary", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "كرر بعدي: تفاحة، موزة، برتقال، عنب، فراولة، بطيخ.", duration: 10, emoji: "🍎" },
  { title: "أعضاء الجسم", description: "تعلم أسماء أجزاء الجسم", category: "vocabulary", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "أشر إلى العضو وقل اسمه: رأس، يد، رجل، عين، أنف، فم، أذن.", duration: 12, emoji: "👤" },
  // الطلاقة (2)
  { title: "وصف الصور", description: "تنمية مهارة الوصف", category: "fluency", difficulty: "medium", minAge: 3, maxAge: 5, instructions: "انظر إلى الصورة وصفها بجملة كاملة. مثال: الولد يلعب بالكرة.", duration: 12, emoji: "🖼️" },
  { title: "إكمال الجمل", description: "بناء جمل كاملة", category: "fluency", difficulty: "medium", minAge: 4, maxAge: 5, instructions: "أكمل الجملة: أنا أحب أن آكل... ، اللون المفضل عندي هو...", duration: 10, emoji: "✏️" },
  // الإيقاع (1)
  { title: "الأناشيد المتحركة", description: "غناء مع الحركات", category: "rhythm", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "غنِّ نشيد بابا جابلي بلون مع التصفيق والحركة.", duration: 12, emoji: "🎤" },
];

async function seed() {
  console.log("🌱 بدء إدراج البيانات الأولية...");

  await db.delete(messagesTable);
  await db.delete(notificationsTable);
  await db.delete(childAchievementsTable);
  await db.delete(achievementsTable);
  await db.delete(progressTable);
  await db.delete(sessionsTable);
  await db.delete(appointmentsTable);
  await db.delete(exercisesTable);
  await db.delete(childrenTable);
  await db.delete(specialistsTable);
  await db.delete(usersTable);

  const [admin] = await db.insert(usersTable).values({
    email: "admin@clinic.com",
    password: "admin123",
    name: "مدير النظام",
    role: "admin",
  }).returning();

  const [specialistUser] = await db.insert(usersTable).values({
    email: "dr.sara@clinic.com",
    password: "specialist123",
    name: "د. سارة أحمد",
    role: "specialist",
  }).returning();

  const [parentUser] = await db.insert(usersTable).values({
    email: "parent@clinic.com",
    password: "parent123",
    name: "محمد علي",
    role: "parent",
  }).returning();

  const [specialist] = await db.insert(specialistsTable).values({
    userId: specialistUser.id,
    specialty: "أخصائية نطق ولغة",
    bio: "خبرة 10 سنوات في علاج اضطرابات النطق عند الأطفال",
    experience: 10,
    rating: 4.8,
  }).returning();

  const [child] = await db.insert(childrenTable).values({
    parentId: parentUser.id,
    specialistId: specialist.id,
    name: "أحمد محمد",
    age: 4,
    gender: "male",
    diagnosis: "تأخر بسيط في نطق حرف الراء",
    notes: "يستجيب جيداً للتمارين التفاعلية",
  }).returning();

  const [childUser] = await db.insert(usersTable).values({
    email: "child@clinic.com",
    password: "child123",
    name: child.name,
    role: "child",
  }).returning();

  const insertedExercises = await db.insert(exercisesTable).values(exercises).returning();
  await db.insert(achievementsTable).values(achievements);

  // Award the "first_session" + "first_exercise" achievement to demo child
  const [firstAch] = await db.select().from(achievementsTable);
  if (firstAch) {
    await db.insert(childAchievementsTable).values({ childId: child.id, achievementId: firstAch.id });
  }

  // Add some progress data
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
  await db.insert(progressTable).values([
    { childId: child.id, exerciseId: insertedExercises[0].id, score: 85, completed: true, date: today, notes: "أداء جيد" },
    { childId: child.id, exerciseId: insertedExercises[1].id, score: 70, completed: true, date: yesterday, notes: "يحتاج تدريب أكثر" },
    { childId: child.id, exerciseId: insertedExercises[12].id, score: 95, completed: true, date: twoDaysAgo, notes: "ممتاز" },
  ]);

  // Add some completed past sessions
  await db.insert(sessionsTable).values([
    { childId: child.id, specialistId: specialist.id, date: yesterday, duration: 45, score: 85, exercisesCompleted: 3, mood: "happy", notes: "جلسة ممتازة" },
    { childId: child.id, specialistId: specialist.id, date: twoDaysAgo, duration: 45, score: 78, exercisesCompleted: 2, mood: "happy", notes: "تقدم ملحوظ" },
  ]);

  // Welcome notifications
  await db.insert(notificationsTable).values([
    { userId: parentUser.id, title: "مرحباً بك في عيادة النطق", titleEn: "Welcome to Speech Clinic", message: "تم تسجيل ابنك بنجاح. يمكنك متابعة تقدمه من خلال لوحة التحكم.", messageEn: "Your child has been registered. Track progress from the dashboard.", type: "info" },
    { userId: parentUser.id, title: "موعد قادم", titleEn: "Upcoming Appointment", message: `لديك موعد جديد لـ ${child.name} غداً الساعة 10:00`, messageEn: `New appointment for ${child.name} tomorrow at 10:00`, type: "appointment" },
    { userId: specialistUser.id, title: "طفل جديد", titleEn: "New Child Assigned", message: `تم تعيين ${child.name} لك`, messageEn: `${child.name} has been assigned to you`, type: "info" },
    { userId: childUser.id, title: "إنجاز جديد!", titleEn: "New Achievement!", message: "حصلت على شارة أول جلسة 🎉", messageEn: "You earned the First Session badge 🎉", type: "achievement" },
  ]);

  // Sample messages between parent and specialist
  await db.insert(messagesTable).values([
    { fromUserId: parentUser.id, toUserId: specialistUser.id, content: "مرحبا دكتورة، كيف تقدم أحمد في الجلسات؟" },
    { fromUserId: specialistUser.id, toUserId: parentUser.id, content: "أهلاً بكم. أحمد يتقدم بشكل ممتاز ويتعاون كثيراً. سأرسل تقريراً مفصلاً قريباً." },
  ]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  await db.insert(appointmentsTable).values([
    {
      childId: child.id,
      specialistId: specialist.id,
      date: dateStr,
      time: "10:00",
      duration: 45,
      status: "scheduled",
      notes: "جلسة متابعة دورية",
    },
  ]);

  console.log(`✅ تم إدراج ${exercises.length} تمرين بنجاح`);
  console.log(`✅ تم إدراج ${achievements.length} إنجاز`);
  console.log("✅ تم إنشاء الحسابات التجريبية والإشعارات والرسائل");
  console.log("");
  console.log("بيانات تسجيل الدخول:");
  console.log("  المدير:    admin@clinic.com / admin123");
  console.log("  الأخصائية: dr.sara@clinic.com / specialist123");
  console.log("  ولي الأمر: parent@clinic.com / parent123");
  console.log("  الطفل:     child@clinic.com / child123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ فشل الإدراج:", err);
  process.exit(1);
});
