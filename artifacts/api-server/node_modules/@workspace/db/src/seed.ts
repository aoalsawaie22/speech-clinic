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
  { title: "حرف الباء 🐦", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "بعدي: بطة\nباب\nبيت\nبقرة\nبرتقال\nبطة بطة باب", duration: 8, emoji: "🐦" },
  { title: "حرف التاء 🍅", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "بعدي: تفاحة\nتين\nتمر\nتمساح\nتلفاز", duration: 8, emoji: "🍅" },
  { title: "حرف الجيم 🦒", description: "", category: "pronunciation", difficulty: "easy", minAge: 3, maxAge: 5, instructions: "بعدي: جمل\nجبل\nجزرة\nجسر\nجرو", duration: 8, emoji: "🦒" },
  { title: "حرف الدال 🐬", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "بعدي: دب\nدجاجة\nدلفين\nديك\nدراجة", duration: 8, emoji: "🐬" },
  { title: "حرف الراء 🐇", description: "", category: "pronunciation", difficulty: "hard", minAge: 4, maxAge: 6, instructions: "بعدي: رأس\nرمان\nأرنب\nبحر\nروضة", duration: 15, emoji: "🐇" },
  { title: "حرف الراء — جمل 🎯", description: "", category: "pronunciation", difficulty: "hard", minAge: 4, maxAge: 6, instructions: "بعدي: الأرنب يركض\nالورد أحمر\nرياح الربيع باردة\nركب الولد الدراجة\nالراعي يرعى الغنم", duration: 15, emoji: "🎯" },
  { title: "حرف السين 🌟", description: "", category: "pronunciation", difficulty: "medium", minAge: 3, maxAge: 5, instructions: "بعدي: سمكة\nسيارة\nسماء\nسلم\nسحابة", duration: 10, emoji: "🌟" },
  { title: "حرف الشين 🌞", description: "", category: "pronunciation", difficulty: "medium", minAge: 3, maxAge: 5, instructions: "بعدي: شمس\nشجرة\nشاطئ\nشباك\nشهد", duration: 10, emoji: "🌞" },
  { title: "حرف الصاد 🌿", description: "", category: "pronunciation", difficulty: "hard", minAge: 4, maxAge: 6, instructions: "بعدي: صابون\nصاروخ\nصحن\nصقر\nصندوق", duration: 12, emoji: "🌿" },
  { title: "حرف الضاد 🌊", description: "", category: "pronunciation", difficulty: "hard", minAge: 4, maxAge: 6, instructions: "بعدي: ضفدع\nضوء\nضيف\nضرب\nضباب", duration: 12, emoji: "🌊" },
  { title: "حرف الطاء ✈️", description: "", category: "pronunciation", difficulty: "hard", minAge: 4, maxAge: 6, instructions: "بعدي: طائرة\nطاولة\nطفل\nطبل\nطبيب", duration: 12, emoji: "✈️" },
  { title: "حرف العين 👁️", description: "", category: "pronunciation", difficulty: "hard", minAge: 4, maxAge: 6, instructions: "بعدي: عين\nعصفور\nعنب\nعسل\nعمر", duration: 12, emoji: "👁️" },
  { title: "حرف الغين 🌙", description: "", category: "pronunciation", difficulty: "hard", minAge: 4, maxAge: 6, instructions: "بعدي: غيمة\nغابة\nغراب\nغزال\nغطاء", duration: 12, emoji: "🌙" },
  { title: "حرف الفاء 🦋", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "بعدي: فراشة\nفيل\nفاكهة\nفنجان\nفرشاة", duration: 8, emoji: "🦋" },
  { title: "حرف القاف 🦜", description: "", category: "pronunciation", difficulty: "hard", minAge: 4, maxAge: 6, instructions: "بعدي: قطة\nقلم\nقمر\nقرد\nقوس", duration: 12, emoji: "🦜" },
  { title: "حرف الكاف 🎈", description: "", category: "pronunciation", difficulty: "medium", minAge: 3, maxAge: 5, instructions: "بعدي: كلب\nكتاب\nكرة\nكنغر\nكعكة", duration: 8, emoji: "🎈" },
  { title: "حرف اللام 🦁", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "بعدي: ليمون\nلسان\nلبن\nلعبة\nلوح", duration: 8, emoji: "🦁" },
  { title: "حرف الميم 🐒", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "بعدي: موز\nمدرسة\nماء\nمطرقة\nمروحة", duration: 8, emoji: "🐒" },
  { title: "حرف النون 🌈", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "بعدي: نخلة\nنجمة\nنمر\nنور\nنهر", duration: 8, emoji: "🌈" },
  { title: "حرف الهاء 🌬️", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "بعدي: هرة\nهاتف\nهلال\nهدهد\nهواء", duration: 8, emoji: "🌬️" },
  { title: "حرف الواو 🌹", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "بعدي: وردة\nوزة\nوطواط\nوسادة\nوداع", duration: 8, emoji: "🌹" },
  { title: "حرف الياء 🎀", description: "", category: "pronunciation", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "بعدي: يد\nيوم\nيمامة\nينبوع\nياسمين", duration: 8, emoji: "🎀" },
  { title: "السين والشين 🌊", description: "", category: "pronunciation", difficulty: "medium", minAge: 3, maxAge: 5, instructions: "بعدي: السمك يسبح\nالشمس تشرق\nسحابة في السماء\nشجرة كبيرة\nسأشرب الشاي", duration: 12, emoji: "🌊" },
  { title: "حروف صعبة معاً 🏋️", description: "", category: "pronunciation", difficulty: "hard", minAge: 5, maxAge: 7, instructions: "بعدي: الطفل يعزف\nالغراب على الغصن\nالقرد يقفز\nالضفدع في الضفة\nالصاروخ في الصحراء", duration: 15, emoji: "🏋️" },
  { title: "التنفس العميق 🌬️", description: "", category: "breathing", difficulty: "easy", minAge: 2, maxAge: 6, instructions: "بعدي: شهيق من الأنف ببطء\nاحبس 3 ثوانٍ\nزفير من الفم ببطء\nكرر 5 مرات", duration: 6, emoji: "🌬️" },
  { title: "نفخ الشموع 🕯️", description: "", category: "breathing", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "بعدي: انفخ الشمعة الأولى بقوة\nانفخ الثانية ببطء\nانفخ الثالثة من بعيد\nانفخ الرابعة بنفس طويل\nانفخ الخامسة بكل ما عندك", duration: 6, emoji: "🕯️" },
  { title: "نفخ الريشة 🪶", description: "", category: "breathing", difficulty: "easy", minAge: 3, maxAge: 5, instructions: "بعدي: انفخ بلطف\nانفخ أقوى قليلاً\nانفخ بلطف جداً\nحاول تبقيها في الهواء\nكرر 5 مرات", duration: 6, emoji: "🪶" },
  { title: "نفس الأفعى 🐍", description: "", category: "breathing", difficulty: "medium", minAge: 3, maxAge: 5, instructions: "بعدي: خذ نفساً عميقاً\nأخرجه ببطء مع صوت سسسسسس\nاطوّل الصوت قدر الإمكان\nكرر 3 مرات", duration: 7, emoji: "🐍" },
  { title: "حركات اللسان 👅", description: "", category: "oral_muscle", difficulty: "easy", minAge: 3, maxAge: 6, instructions: "بعدي: أخرج لسانك للأعلى\nأخرجه للأسفل\nأخرجه لليمين\nأخرجه لليسار\ndوّره دائرة كاملة\nكرر 5 مرات", duration: 7, emoji: "👅" },
  { title: "نفخ الخدود 🤪", description: "", category: "oral_muscle", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "بعدي: انفخ الخدين معاً وعدّ 5\nاضغط عليهما بيديك\nانفخ الخد الأيمن فقط\nانفخ الخد الأيسر فقط\nكرر 5 مرات", duration: 6, emoji: "🤪" },
  { title: "الشفاه المرنة 💋", description: "", category: "oral_muscle", difficulty: "easy", minAge: 3, maxAge: 5, instructions: "بعدي: ابتسم بأعرض ما تستطيع\nدوّر شفتيك للأمام\nابتسم مجدداً\nدوّر مجدداً\nكرر 5 مرات", duration: 6, emoji: "💋" },
  { title: "تمرين المضغ 🍬", description: "", category: "oral_muscle", difficulty: "easy", minAge: 3, maxAge: 5, instructions: "بعدي: امضغ ببطء وبقوة\nامضغ بسرعة\nامضغ بلطف\nافتح فمك كبيراً وأغلقه\nكرر 10 مرات", duration: 6, emoji: "🍬" },
  { title: "أصوات الحيوانات 🐾", description: "", category: "listening", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "بعدي: الكلب يقول واو واو\nالقطة تقول مياو\nالبقرة تقول موو\nالخروف يقول بع بع\nالديك يقول كوكو", duration: 10, emoji: "🐾" },
  { title: "فرق الأصوات 👂", description: "", category: "listening", difficulty: "medium", minAge: 3, maxAge: 5, instructions: "بعدي: سمك\nشمك — الصحيح سمك\nسيف\nشيف — الصحيح سيف\nصابون\nسابون — الصحيح صابون", duration: 12, emoji: "👂" },
  { title: "نفّذ التعليمات 🎮", description: "", category: "listening", difficulty: "medium", minAge: 3, maxAge: 5, instructions: "بعدي: ارفع يدك اليمنى\nاضرب كفيك معاً\nاقفز مرة واحدة\nارسم دائرة في الهواء\nضع يدك على رأسك وابتسم", duration: 10, emoji: "🎮" },
  { title: "ألوان الطيف 🌈", description: "", category: "vocabulary", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "بعدي: أحمر\nبرتقالي\nأصفر\nأخضر\nأزرق\nبنفسجي", duration: 10, emoji: "🌈" },
  { title: "فواكه شهية 🍓", description: "", category: "vocabulary", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "بعدي: تفاحة\nموزة\nبرتقالة\nعنب\nفراولة\nبطيخ\nمانجو", duration: 10, emoji: "🍓" },
  { title: "أعضاء جسمي 🙋", description: "", category: "vocabulary", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "بعدي: رأس\nعين\nأنف\nفم\nأذن\nيد\nرجل\nبطن", duration: 12, emoji: "🙋" },
  { title: "الأرقام ١ إلى ١٠ 🔢", description: "", category: "vocabulary", difficulty: "easy", minAge: 2, maxAge: 5, instructions: "بعدي: واحد\naثنان\nثلاثة\nأربعة\nخمسة\nستة\nسبعة\nثمانية\nتسعة\nعشرة", duration: 10, emoji: "🔢" },
  { title: "حيوانات المزرعة 🐄", description: "", category: "vocabulary", difficulty: "easy", minAge: 2, maxAge: 4, instructions: "بعدي: بقرة\nدجاجة\nخروف\nحصان\nحمار\nديك\nأرنب", duration: 10, emoji: "🐄" },
  { title: "صِف ما تراه 🖼️", description: "", category: "fluency", difficulty: "medium", minAge: 4, maxAge: 6, instructions: "بعدي: أرى طاولة بنية\nأرى نافذة كبيرة\nأرى كتاباً ملوناً\nأرى كرسياً مريحاً\nجرّب أنت الآن", duration: 12, emoji: "🖼️" },
  { title: "أكمل الجملة ✏️", description: "", category: "fluency", difficulty: "medium", minAge: 4, maxAge: 6, instructions: "بعدي: أنا أحب أن آكل...\nاللون المفضل عندي هو...\nأفضل لعبة عندي هي...\nعندما أكبر سأكون...", duration: 12, emoji: "✏️" },
  { title: "قصة قصيرة 📖", description: "", category: "fluency", difficulty: "hard", minAge: 5, maxAge: 7, instructions: "بعدي: ذهب الأرنب إلى الغابة\nوجد تفاحة حمراء لذيذة\nأكلها وشكر ربه\nالآن احكِ أنت قصة قصيرة", duration: 15, emoji: "📖" },
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

  const [admin] = await db.insert(usersTable).values({ email: "admin@clinic.com", password: "admin123", name: "مدير النظام", role: "admin" }).returning();
  const [specialistUser] = await db.insert(usersTable).values({ email: "dr.sara@clinic.com", password: "specialist123", name: "د. سارة أحمد", role: "specialist" }).returning();
  const [parentUser] = await db.insert(usersTable).values({ email: "parent@clinic.com", password: "parent123", name: "محمد علي", role: "parent" }).returning();

  const [specialist] = await db.insert(specialistsTable).values({ userId: specialistUser.id, specialty: "أخصائية نطق ولغة", bio: "خبرة 10 سنوات في علاج اضطرابات النطق عند الأطفال", experience: 10, rating: 4.8 }).returning();

  const [child] = await db.insert(childrenTable).values({ parentId: parentUser.id, specialistId: specialist.id, name: "أحمد محمد", age: 4, gender: "male", diagnosis: "تأخر بسيط في نطق حرف الراء", notes: "يستجيب جيداً للتمارين التفاعلية" }).returning();

  const [childUser] = await db.insert(usersTable).values({ email: "child@clinic.com", password: "child123", name: child.name, role: "child" }).returning();

  const insertedExercises = await db.insert(exercisesTable).values(exercises).returning();
  await db.insert(achievementsTable).values(achievements);

  const [firstAch] = await db.select().from(achievementsTable);
  if (firstAch) await db.insert(childAchievementsTable).values({ childId: child.id, achievementId: firstAch.id });

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];

  await db.insert(progressTable).values([
    { childId: child.id, exerciseId: insertedExercises[0].id, score: 85, completed: true, date: today, notes: "أداء جيد" },
    { childId: child.id, exerciseId: insertedExercises[4].id, score: 70, completed: true, date: yesterday, notes: "يحتاج تدريب أكثر على الراء" },
    { childId: child.id, exerciseId: insertedExercises[6].id, score: 95, completed: true, date: twoDaysAgo, notes: "ممتاز في السين" },
  ]);

  await db.insert(sessionsTable).values([
    { childId: child.id, specialistId: specialist.id, date: yesterday, duration: 45, score: 85, exercisesCompleted: 3, mood: "happy", notes: "جلسة ممتازة" },
    { childId: child.id, specialistId: specialist.id, date: twoDaysAgo, duration: 45, score: 78, exercisesCompleted: 2, mood: "happy", notes: "تقدم ملحوظ" },
  ]);

  await db.insert(notificationsTable).values([
    { userId: parentUser.id, title: "مرحباً بك في عيادة النطق", titleEn: "Welcome to Speech Clinic", message: "تم تسجيل ابنك بنجاح. يمكنك متابعة تقدمه من خلال لوحة التحكم.", messageEn: "Your child has been registered. Track progress from the dashboard.", type: "info" },
    { userId: parentUser.id, title: "موعد قادم", titleEn: "Upcoming Appointment", message: `لديك موعد جديد لـ ${child.name} غداً الساعة 10:00`, messageEn: `New appointment for ${child.name} tomorrow at 10:00`, type: "appointment" },
    { userId: specialistUser.id, title: "طفل جديد", titleEn: "New Child Assigned", message: `تم تعيين ${child.name} لك`, messageEn: `${child.name} has been assigned to you`, type: "info" },
    { userId: childUser.id, title: "إنجاز جديد!", titleEn: "New Achievement!", message: "حصلت على شارة أول جلسة 🎉", messageEn: "You earned the First Session badge 🎉", type: "achievement" },
  ]);

  await db.insert(messagesTable).values([
    { fromUserId: parentUser.id, toUserId: specialistUser.id, content: "مرحبا دكتورة، كيف تقدم أحمد في الجلسات؟" },
    { fromUserId: specialistUser.id, toUserId: parentUser.id, content: "أهلاً بكم. أحمد يتقدم بشكل ممتاز ويتعاون كثيراً. سأرسل تقريراً مفصلاً قريباً." },
  ]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  await db.insert(appointmentsTable).values([{ childId: child.id, specialistId: specialist.id, date: dateStr, time: "10:00", duration: 45, status: "scheduled", notes: "جلسة متابعة دورية" }]);

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