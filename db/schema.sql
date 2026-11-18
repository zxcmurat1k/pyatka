CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_blocked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
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
    image_url TEXT,
    file_size_mb REAL NOT NULL,
    downloads_count INTEGER DEFAULT 0,
    is_nsfw INTEGER NOT NULL DEFAULT 0,
    is_available INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS modpacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target_game_version TEXT NOT NULL,
    install_method TEXT NOT NULL,
    notes TEXT,
    total_size_mb REAL NOT NULL,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS modpack_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modpack_id INTEGER NOT NULL,
    mod_id INTEGER NOT NULL,
    load_order INTEGER NOT NULL,
    size_at_save REAL NOT NULL,
    FOREIGN KEY(modpack_id) REFERENCES modpacks(id),
    FOREIGN KEY(mod_id) REFERENCES mods(id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mod_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(mod_id) REFERENCES mods(id)
);

CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    mod_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, mod_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(mod_id) REFERENCES mods(id)
);

INSERT OR IGNORE INTO categories (id, name, slug) VALUES 
(1, 'Скины и модели', 'skins'),
(2, 'Технические и механизмы', 'tech'),
(3, 'Интерфейс (HUD)', 'ui-hud'),
(4, 'Оптимизация и фиксы', 'optimization'),
(5, '18+ Контент', 'nsfw-18');

INSERT OR IGNORE INTO mods (id, title, game_title, game_version, category_id, description, install_instructions, source_url, file_size_mb, downloads_count, is_nsfw) VALUES
(1, 'Custom Hero Skins Pack', 'Deadlock', 'Latest', 1, 'Пак кастомных скинов и реколоров героев Deadlock.', '1. Скачайте .vpk архив по ссылке.\n2. Поместите файл в папку Deadlock/game/citadel/addons/.\n3. Пропишите путь к addons в файле gameinfo.gi.', 'https://gamebanana.com/mods/cats/32645', 15.5, 2450, 0),
(2, 'Minimalist Competitive HUD', 'Deadlock', 'Latest', 3, 'Минималистичный боевой интерфейс и кастомный прицел.', '1. Скачайте файл интерфейса.\n2. Скопируйте .vpk в citadel/addons/.\n3. Перезапустите игру.', 'https://gamebanana.com/mods/cats/32646', 2.1, 1890, 0),
(3, 'Deadlock FPS & No-Fog Config', 'Deadlock', 'Latest', 4, 'Оптимизированный конфиг для повышения FPS и отключения тумана.', '1. Скачайте autoexec.cfg.\n2. Поместите в Deadlock/game/citadel/cfg/.\n3. Добавьте +exec autoexec.cfg в параметры запуска Steam.', 'https://gamebanana.com/tools/cats/19847', 0.1, 3120, 0),
(4, 'Deadlock Stylized Pin-Up Skins [18+]', 'Deadlock', 'Latest', 5, 'Откровенные пин-ап ретекстуры персонажей Deadlock (18+).', '1. Подтвердите возраст 18+.\n2. Скачайте .vpk ретекстур.\n3. Поместите в citadel/addons/ и перезапустите клиент.', 'https://gamebanana.com/games/20948', 45.0, 4100, 1),
(5, 'Create', 'Minecraft', '1.20.1', 2, 'Инженерный мод: шестерёнки, кинетическая энергия, поезда и автоматизация.', '1. Установите Forge или NeoForge 1.20.1.\n2. Скачайте Create и библиотеку Flywheel.\n3. Поместите оба .jar файла в папку .minecraft/mods/.', 'https://modrinth.com/mod/create', 12.4, 5200, 0),
(6, 'Create: Aeronautics (Valkyrien Skies)', 'Minecraft', '1.20.1', 2, 'Физика реальных летающих кораблей, самолётов и дирижаблей.', '1. Установите Forge/Fabric 1.20.1.\n2. Скачайте Valkyrien Skies и аддон дирижаблей.\n3. Поместите .jar файлы в .minecraft/mods/.', 'https://modrinth.com/mod/valkyrien-skies', 8.2, 2940, 0),
(7, 'Jenny Mod (SchnurriTV''s Mod) [18+]', 'Minecraft', '1.12.2', 5, 'Взрослый интерактивный контент и NPC-компаньоны (18+).', '1. Установите Minecraft 1.12.2 и Forge 1.12.2.\n2. Скачайте .jar файл мода и библиотеку Geckolib.\n3. Поместите оба файла в .minecraft/mods/ и запустите игру.', 'https://github.com/topics/jenny-mod', 30.0, 6800, 1),
(8, 'Sodium Performance Engine', 'Minecraft', '1.21.4', 4, 'Глубокая переработка движка рендеринга для двукратного роста FPS.', '1. Установите Fabric Loader.\n2. Поместите sodium-*.jar в .minecraft/mods/.\n3. Запустите профиль Fabric.', 'https://modrinth.com/mod/sodium', 1.5, 4900, 0),
(9, 'SkyUI Modern Inventory', 'The Elder Scrolls V: Skyrim SE', '1.6.1170', 3, 'Удобный ПК-интерфейс инвентаря, магии и торговли.', '1. Установите SKSE64.\n2. Установите архив через Mod Organizer 2.\n3. Активируйте SkyUI.esp.', 'https://www.nexusmods.com/skyrimspecialedition/mods/12604', 3.4, 4300, 0),
(10, 'Unofficial Skyrim SE Patch (USSEP)', 'The Elder Scrolls V: Skyrim SE', '1.6.1170', 4, 'Масштабный патч, исправляющий тысячи квестовых и графических багов.', '1. Скачайте архив под вашу версию игры.\n2. Установите через Vortex или MO2 сразу после официальных DLC.', 'https://www.nexusmods.com/skyrimspecialedition/mods/266', 150.0, 3850, 0),
(11, 'SKSE64 Script Extender', 'The Elder Scrolls V: Skyrim SE', '1.6.1170', 2, 'Базовый расширитель скриптов для работы сложных модов Skyrim SE.', '1. Распакуйте все .dll и .exe файлы в корневую папку Skyrim SE.\n2. Запускайте игру строго через skse64_loader.exe.', 'https://skse.silverlock.org/', 2.0, 5100, 0),
(12, 'CBBE Body & Mature Skins [18+]', 'The Elder Scrolls V: Skyrim SE', '1.6.1170', 5, 'Детализированный реплейсер тел и текстур персонажей (18+).', '1. Установите через Mod Organizer 2.\n2. Запустите BodySlide для генерации мешей.\n3. Активируйте плагин в списке загрузки.', 'https://www.nexusmods.com/skyrimspecialedition/mods/198', 210.0, 5600, 1),
(13, 'Cyber Engine Tweaks', 'Cyberpunk 2077', '2.12', 2, 'Технический фреймворк, консоль разработчика и фиксы производительности.', '1. Распакуйте архив в корневую папку Cyberpunk 2077.\n2. Запустите игру и назначьте горячую клавишу оверлея.', 'https://www.nexusmods.com/cyberpunk2077/mods/107', 5.6, 3700, 0),
(14, 'Appearance Menu Mod', 'Cyberpunk 2077', '2.12', 1, 'Смена внешности, спавн персонажей и настройка сцен в реальном времени.', '1. Установите Cyber Engine Tweaks.\n2. Распакуйте AMM в папку bin/x64/plugins/cyber_engine_tweaks/mods/.', 'https://www.nexusmods.com/cyberpunk2077/mods/790', 12.0, 2800, 0),
(15, 'Limited HUD Minimalist', 'Cyberpunk 2077', '2.12', 3, 'Динамическое скрытие элементов HUD вне боя.', '1. Установите RED4ext и Codeware.\n2. Распакуйте архив в корневую папку игры.', 'https://www.nexusmods.com/cyberpunk2077/mods/2592', 1.1, 1650, 0),
(16, 'High-Res Mature Body Overhaul [18+]', 'Cyberpunk 2077', '2.12', 5, 'NSFW-реплейсер тел и текстур высокого разрешения для Найт-Сити (18+).', '1. Скачайте основной архив текстур.\n2. Поместите .archive файл в папку archive/pc/mod/.', 'https://www.nexusmods.com/cyberpunk2077/mods/1424', 500.0, 3950, 1),
(17, 'Calamity Content Expansion', 'Terraria', '1.4.4.9', 2, 'Глобальный контентный аддон: десятки новых боссов, биомов и оружия.', '1. Запустите tModLoader в Steam.\n2. Найдите Calamity Mod в Мастерской и включите его.', 'https://steamcommunity.com/sharedfiles/filedetails/?id=2824688072', 140.0, 4400, 0),
(18, 'Recipe Browser In-Game Wiki', 'Terraria', '1.4.4.9', 3, 'Удобный внутриигровой справочник всех рецептов крафта и дропа.', '1. Подпишитесь в Мастерской tModLoader.\n2. Назначьте горячую клавишу открытия окна в настройках.', 'https://steamcommunity.com/sharedfiles/filedetails/?id=2619954303', 2.3, 3300, 0),
(19, 'Magic Storage System', 'Terraria', '1.4.4.9', 2, 'Единая цифровая сеть хранения предметов с поиском и автокрафтом.', '1. Установите через tModLoader.\n2. Скрафтьте Storage Heart для объединения сундуков.', 'https://steamcommunity.com/sharedfiles/filedetails/?id=2563309347', 4.1, 3600, 0),
(20, 'Fargo''s Mutant Mod', 'Terraria', '1.4.4.9', 4, 'Ускорение рутины, призыв боссов и удобные улучшения геймплея.', '1. Установите через tModLoader.\n2. Перезагрузите список модов в главном меню.', 'https://steamcommunity.com/sharedfiles/filedetails/?id=2570931073', 8.5, 2500, 0);
