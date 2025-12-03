import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const regions = [
  "Москва",
  "Санкт-Петербург",
  "Казань",
  "Екатеринбург",
  "Новосибирск",
  "Краснодар",
  "Нижний Новгород",
  "Челябинск",
];

const comments = [
  "Нужна замена стеклопакетов",
  "Остекление балкона с отделкой",
  "Установка пластиковых окон",
  "Ремонт фурнитуры",
  "Остекление коттеджа",
  "Коммерческое остекление офиса",
  "Установка от 3 конструкций",
  "Самовывоз без монтажа",
  "Остекление террасы",
  "Модернизация старых окон",
  "Установка на лоджию",
  "Ремонт и замена уплотнителей",
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhone(): string {
  const areaCode = ["495", "812", "843", "343", "383", "861", "831", "351"];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `+7${getRandomElement(areaCode)}${number}`;
}

async function main() {
  console.log("🌱 Начинаю заполнение тестовыми данными...");

  // Создаём тестового пользователя
  let user = await prisma.user.findFirst({
    where: { telegramId: "demo_user" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId: "demo_user",
        username: "demo_user",
        fullName: "Тестовый Пользователь",
        balance: 5000,
        role: "user",
      },
    });
    console.log("✅ Создан тестовый пользователь");
  } else {
    // Обновляем баланс если пользователь уже существует
    user = await prisma.user.update({
      where: { id: user.id },
      data: { balance: 5000 },
    });
    console.log("✅ Обновлён баланс тестового пользователя");
  }

  // Удаляем старые тестовые лиды (опционально)
  const oldLeadsCount = await prisma.lead.count({
    where: { status: "in_market" },
  });
  console.log(`📊 Найдено ${oldLeadsCount} лидов в маркетплейсе`);

  // Создаём тестовые лиды
  const leadsToCreate = 30;
  const leads = [];

  for (let i = 0; i < leadsToCreate; i++) {
    const lead = await prisma.lead.create({
      data: {
        phone: generatePhone(),
        comment: getRandomElement(comments),
        region: getRandomElement(regions),
        niche: "Окна",
        status: "in_market",
        ownerId: user.id,
        purchaseCount: 0,
        isArchived: false,
        ownerReward: 0,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
    leads.push(lead);
  }

  console.log(`✅ Создано ${leads.length} тестовых лидов`);

  // Создаём несколько транзакций для истории
  const transactionTypes = ["deposit", "purchase", "upload_reward"];
  
  for (let i = 0; i < 10; i++) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: getRandomElement([500, 1000, 1500, 2000, 2500]),
        type: transactionTypes[i % 3],
        description: i % 3 === 0 ? "Пополнение баланса" : i % 3 === 1 ? "Покупка лида" : "Награда за загрузку",
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("✅ Создано 10 тестовых транзакций");

  // Создаём несколько загруженных лидов (для вкладки "Мои лиды")
  for (let i = 0; i < 5; i++) {
    await prisma.lead.create({
      data: {
        phone: generatePhone(),
        comment: getRandomElement(comments),
        region: getRandomElement(regions),
        niche: "Окна",
        status: "uploaded",
        ownerId: user.id,
        purchaseCount: 0,
        isArchived: false,
        ownerReward: 0,
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("✅ Создано 5 загруженных лидов");

  console.log("🎉 Заполнение тестовыми данными завершено!");
}

main()
  .catch((e) => {
    console.error("❌ Ошибка при заполнении:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
