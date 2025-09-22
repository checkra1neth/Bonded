# Base Dating MVP

## 🎯 Концепция
Первое в мире приложение знакомств на основе крипто-активности и DeFi-интересов.

## 🏗️ Архитектура

### Frontend (Next.js + MiniKit)
- `/app` - Next.js 14 App Router
- `/components` - Переиспользуемые компоненты
- `/hooks` - Custom React hooks
- `/lib` - Утилиты и конфигурация
- `/types` - TypeScript типы

### Backend (Node.js + Express)
- `/api` - REST API endpoints
- `/services` - Бизнес-логика
- `/models` - Модели данных
- `/utils` - Вспомогательные функции

### Database (PostgreSQL)
- Пользователи и профили
- Матчи и лайки
- Сообщения
- Портфолио данные

## 🔧 Технологический стек

### Core
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: Base Account + SIWF

### Base Ecosystem
- **MiniKit SDK**: Для интеграции с Base App
- **OnchainKit**: UI компоненты и утилиты
- **Base Pay**: Платежи и премиум подписки
- **Base Account**: Аутентификация пользователей

### External APIs
- **Alchemy**: Анализ портфелей и транзакций
- **OpenSea API**: NFT коллекции и метаданные
- **CoinGecko API**: Цены токенов
- **OpenAI API**: Генерация ледоколов и контента

## 📱 MVP Функционал

### Фаза 1 (Core Features)
- [x] Регистрация через Base Account
- [x] Создание профиля с подключением кошелька
- [x] Анализ портфеля (топ-5 токенов)
- [x] Базовый алгоритм матчинга
- [x] Swipe интерфейс
- [x] Простой чат

### Фаза 2 (Social Features)
- [ ] Crypto personality тест
- [ ] AI-генерируемые ледоколы
- [ ] Групповые чаты по интересам
- [ ] Система лайков и суперлайков

### Фаза 3 (Viral Features)
- [ ] Compatibility reports для шеринга
- [ ] Crypto couple challenges
- [ ] Leaderboards и достижения
- [ ] Premium подписка

## 🚀 Быстрый старт

```bash
# Клонирование репозитория
git clone https://github.com/your-username/base-dating-mvp
cd base-dating-mvp

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local

# Запуск базы данных
docker-compose up -d postgres

# Миграции
npx prisma migrate dev

# Запуск в режиме разработки
npm run dev
```

## 📊 Метрики MVP

### Целевые показатели (первый месяц):
- **Регистрации**: 500+ пользователей
- **DAU**: 100+ активных пользователей
- **Matches**: 15%+ успешных матчей
- **Messages**: 60%+ матчей начинают общение
- **Retention**: 30%+ возвращаются через неделю

## 🔐 Безопасность

- Никаких точных сумм в портфеле (только ранги)
- Анонимизация адресов кошельков
- Модерация контента через AI
- Rate limiting для API
- HTTPS и шифрование данных

## 📈 Roadmap

### Q1 2024
- MVP запуск на Base Sepolia
- Первые 100 пользователей
- Базовый матчинг алгоритм

### Q2 2024
- Mainnet запуск
- Социальные фичи
- Первые вирусные кампании

### Q3 2024
- Premium подписка
- Мобильное приложение
- Партнерства с DeFi протоколами

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл.