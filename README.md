# Mermaid Race 🧜‍♀️🌊

Многопользовательская игра-гонка, где игроки трясут телефоны, чтобы их русалки плыли быстрее!

## Как играть

1. **Хост (телевизор/большой экран):** Открой `mermaid.ilyamedve.dev/host`
2. **Игроки (телефоны):** Отсканируйте QR-код или зайдите на `mermaid.ilyamedve.dev/play`
3. Введите имя и нажмите "Войти в море"
4. Хост нажимает "СТАРТ ЗАПЛЫВА"
5. Трясите телефоны! 📱💨
6. Первый, кто достигнет 100% — победитель! 🏆

## Технологии

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Socket.io
- **Deployment:** Docker + Caddy (reverse proxy)

## Локальная разработка

### Требования
- Node.js 20+
- npm

### Запуск

```bash
# Установка зависимостей сервера
cd server && npm install

# Установка зависимостей клиента
cd ../client && npm install

# Сборка клиента
npm run build

# Запуск сервера
cd ../server && npm start
```

Приложение будет доступно на `http://localhost:3000`

## Docker деплой

```bash
docker compose up -d --build
```

## Структура проекта

```
mermaid/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── hooks/       # Custom hooks (useShake)
│   │   └── socket.js    # Socket.io клиент
│   └── ...
├── server/              # Node.js backend
│   └── index.js         # Express + Socket.io сервер
├── Dockerfile           # Multi-stage build
└── docker-compose.yml   # Docker конфигурация
```

## API (Socket.io events)

### Client → Server
- `register_host` — Регистрация хоста
- `join_game(name)` — Присоединение игрока
- `shake(intensity)` — Отправка данных тряски
- `start_race` — Старт гонки
- `reset_game` — Сброс игры

### Server → Client
- `update_players(players)` — Обновление списка игроков
- `race_started` — Гонка началась
- `game_over(winner)` — Игра окончена
- `game_reset` — Игра сброшена

