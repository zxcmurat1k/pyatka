PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    is_blocked INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS mods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    game_title TEXT NOT NULL,
    game_version TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    install_instructions TEXT NOT NULL,
    source_url TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '/assets/images/default-mod.webp',
    file_size_mb REAL NOT NULL DEFAULT 10.0,
    downloads_count INTEGER NOT NULL DEFAULT 0,
    is_available INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS modpacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_game_version TEXT NOT NULL,
    install_method TEXT NOT NULL DEFAULT 'manual',
    notes TEXT,
    total_size_mb REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modpack_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modpack_id INTEGER NOT NULL,
    mod_id INTEGER NOT NULL,
    load_order INTEGER NOT NULL DEFAULT 1,
    size_at_save REAL NOT NULL,
    FOREIGN KEY (modpack_id) REFERENCES modpacks(id) ON DELETE CASCADE,
    FOREIGN KEY (mod_id) REFERENCES mods(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mod_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    is_approved INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mod_id) REFERENCES mods(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'processed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    mod_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, mod_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mod_id) REFERENCES mods(id) ON DELETE CASCADE
);

-- Тестовые категории
INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES
(1, 'Графика и текстуры', 'graphics', 'HD-текстуры, шейдеры, освещение и погодные моды'),
(2, 'Геймплей и механики', 'gameplay', 'Новые механики, ребаланс, ИИ и боевая система'),
(3, 'Интерфейс (UI/HUD)', 'ui-hud', 'Улучшение инвентаря, карты, меню и шрифтов'),
(4, 'Оптимизация и фиксы', 'optimization', 'Патчи производительности, исправление багов движка'),
(5, 'Квесты и локации', 'quests', 'Новые сюжетные линии, персонажи и игровые зоны');

-- 20 тестовых модов (обязательный минимум по п. 4.2 ТЗ)
INSERT OR IGNORE INTO mods (id, title, game_title, game_version, category_id, description, install_instructions, source_url, file_size_mb, downloads_count) VALUES
(1, 'Sodium Performance Engine', 'Minecraft', '1.21.4', 4, 'Глубокая оптимизация движка рендеринга для прироста FPS в 2–3 раза.', '1. Установите Fabric Loader.\n2. Поместите .jar файл в папку .minecraft/mods.\n3. Запустите профиль Fabric.', 'https://modrinth.com/mod/sodium', 1.4, 1540),
(2, 'Complementary Shaders Reimagined', 'Minecraft', '1.21.4', 1, 'Реалистичные тени, отражения на воде и объемные облака без сильной потери FPS.', '1. Установите Iris Shaders.\n2. Скопируйте архив в папку shaderpacks.\n3. Выберите шейдер в настройках графики.', 'https://modrinth.com/shader/complementary-reimagined', 14.2, 1280),
(3, 'SkyUI Modern Inventory', 'The Elder Scrolls V: Skyrim', '1.6.1170', 3, 'Полная переработка громоздкого консольного инвентаря под управление мышью и клавиатурой.', '1. Установите SKSE64.\n2. Установите архив через Mod Organizer 2.\n3. Активируйте SkyUI.esp в списке плагинов.', 'https://www.nexusmods.com/skyrimspecialedition/mods/12604', 28.5, 2100),
(4, 'Unofficial Skyrim Special Edition Patch', 'The Elder Scrolls V: Skyrim', '1.6.1170', 4, 'Масштабный неофициальный патч, исправляющий тысячи квестовых и скриптовых багов.', '1. Скачайте архив под вашу версию игры.\n2. Установите через Vortex или MO2 сразу после официальных DLC.', 'https://www.nexusmods.com/skyrimspecialedition/mods/266', 145.0, 1950),
(5, 'Cyber Engine Tweaks', 'Cyberpunk 2077', '2.12', 4, 'Фреймворк для запуска скриптов, консоль разработчика и исправление утечек памяти.', '1. Распакуйте содержимое архива в корневую папку Cyberpunk 2077.\n2. Запустите игру и назначьте клавишу оверлея.', 'https://www.nexusmods.com/cyberpunk2077/mods/107', 12.8, 1720),
(6, 'Limited HUD Minimalist', 'Cyberpunk 2077', '2.12', 3, 'Динамическое скрытие элементов интерфейса вне боя для полного погружения.', '1. Установите RED4ext и Codeware.\n2. Распакуйте архив в папку игры.\n3. Настройте фильтры в меню модов.', 'https://www.nexusmods.com/cyberpunk2077/mods/2592', 3.6, 890),
(7, 'HD Reworked Project NextGen', 'The Witcher 3: Wild Hunt', '4.04', 1, 'Переработка тысяч текстур окружения, камней, воды и архитектуры в 4K.', '1. Создайте папку mods в корне игры.\n2. Скопируйте папку modHDReworkedProject в mods.', 'https://www.nexusmods.com/witcher3/mods/1021', 4200.0, 1640),
(8, 'Brothers in Arms Bug Fix Collection', 'The Witcher 3: Wild Hunt', '4.04', 4, 'Восстановление вырезанных диалогов и исправление более 5000 ошибок в квестах.', '1. Распакуйте архив в папку mods.\n2. Запустите Script Merger при наличии конфликтов.', 'https://www.nexusmods.com/witcher3/mods/5752', 310.0, 740),
(9, 'Calamity Content Expansion', 'Terraria', '1.4.4.9', 5, 'Глобальный контентный мод: десятки новых боссов, биомов, классов и усложненный режим.', '1. Запустите tModLoader в Steam.\n2. Откройте Мастерскую модов, найдите Calamity Mod и включите его.', 'https://steamcommunity.com/sharedfiles/filedetails/?id=2824688072', 240.5, 2300),
(10, 'Recipe Browser In-Game Wiki', 'Terraria', '1.4.4.9', 3, 'Удобное окно поиска всех рецептов крафта и дропа с мобов прямо в игре.', '1. Установите через tModLoader.\n2. Назначьте горячую клавишу открытия окна в настройках управления.', 'https://steamcommunity.com/sharedfiles/filedetails/?id=2619954303', 4.1, 1410),
(11, 'NaturalVision Evolved Graphics', 'Grand Theft Auto V', '1.0.3258', 1, 'Фотореалистичная система освещения, отражений и погодных эффектов.', '1. Установите OpenIV и ScriptHookV.\n2. Установите NVE.oiv через Package Installer в папку mods.', 'https://www.razedmods.com/gta-v', 3850.0, 1880),
(12, 'LSPDFR Police Career Mod', 'Grand Theft Auto V', '1.0.3258', 2, 'Полноценный симулятор службы в полиции Лос-Сантоса с напарниками и вызовами.', '1. Запустите автоматический установщик LSPDFR в папку с GTA V.\n2. Запускайте игру через RAGEPluginHook.exe.', 'https://www.lcpdfr.com/downloads/gta5mods/g17media/7792-lspd-first-response/', 185.0, 1510),
(13, 'Stardew Valley Expanded', 'Stardew Valley', '1.6.8', 5, 'Масштабное расширение мира: 27 новых NPC, 50 локаций, новые события и фермы.', '1. Установите SMAPI.\n2. Распакуйте Content Patcher и папку SVE в директорию Mods.', 'https://www.nexusmods.com/stardewvalley/mods/3753', 520.0, 1390),
(14, 'NPC Map Locations Tracker', 'Stardew Valley', '1.6.8', 3, 'Отображение иконок всех жителей города на карте в реальном времени.', '1. Установите SMAPI.\n2. Переместите папку NPCMapLocations в папку Mods.', 'https://www.nexusmods.com/stardewvalley/mods/239', 1.8, 1120),
(15, 'AtmosFear 3 Weather Overhaul', 'S.T.A.L.K.E.R.: Call of Pripyat', '1.6.02', 1, 'Динамические выбросы, пси-штормы, кислотные осадки и реалистичное небо Зоны.', '1. Запустите инсталлятор AtmosFear 3.\n2. Укажите корневую директорию игры и выберите пресет текстур.', 'https://www.moddb.com/mods/atmosfear-for-call-of-pripyat', 680.0, 960),
(16, 'Gunslinger Weapon Pack', 'S.T.A.L.K.E.R.: Call of Pripyat', '1.6.02', 2, 'Полная замена оружейного пака, анимаций лечения, апгрейдов и поведения контролера.', '1. Установите мод в отдельную пустую папку.\n2. Укажите путь к оригинальной игре в конфигураторе.', 'https://www.moddb.com/mods/gunslinger-mod', 2950.0, 1470),
(17, 'Improved Camera & UI Tweaks', 'Baldur''s Gate 3', '4.1.1.5009956', 3, 'Свободное управление углом наклона камеры и компактные панели заклинаний.', '1. Установите BG3 Mod Manager.\n2. Импортируйте .pak файл и перенесите его в активный порядок загрузки.', 'https://www.nexusmods.com/baldursgate3/mods/945', 6.4, 1050),
(18, '5e Spells Expansion Pack', 'Baldur''s Gate 3', '4.1.1.5009956', 2, 'Добавляет более 60 классических заклинаний из настольной редакции D&D 5e.', '1. Установите Script Extender.\n2. Активируйте 5eSpells.pak в BG3 Mod Manager и нажмите Export Order to Game.', 'https://www.nexusmods.com/baldursgate3/mods/125', 18.9, 980),
(19, 'Traffic Manager: President Edition', 'Cities: Skylines', '1.17.1', 2, 'Детальная настройка светофоров, полос движения, парковок и приоритетов проезда.', '1. Подпишитесь на мод в Steam Workshop.\n2. Включите TM:PE в меню «Диспетчер содержимого» в игре.', 'https://steamcommunity.com/sharedfiles/filedetails/?id=1637663252', 22.0, 1610),
(20, 'FPS Booster Cities Patch', 'Cities: Skylines', '1.17.1', 4, 'Отключение лишней перерисовки скрытых элементов интерфейса для повышения кадровой частоты.', '1. Установите Patch Loader Mod.\n2. Включите FPS Booster в настройках модификаций и перезапустите игру.', 'https://steamcommunity.com/sharedfiles/filedetails/?id=2105755179', 2.3, 830);