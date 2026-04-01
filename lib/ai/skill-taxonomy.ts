// Canonical skill normalization for matching accuracy
// Maps common variations to a single canonical skill name

const SKILL_ALIASES: Record<string, string[]> = {
    // Frontend
    "React": ["reactjs", "react.js", "react js", "reactjs"],
    "Vue.js": ["vue", "vuejs", "vue.js", "vue js", "vue3", "vue 3"],
    "Angular": ["angularjs", "angular.js", "angular js", "angular2", "angular 2"],
    "Next.js": ["nextjs", "next.js", "next js", "next"],
    "Nuxt.js": ["nuxtjs", "nuxt.js", "nuxt js", "nuxt"],
    "Svelte": ["sveltejs", "svelte.js", "sveltekit"],
    "HTML": ["html5", "html 5"],
    "CSS": ["css3", "css 3"],
    "Sass": ["scss", "sass/scss"],
    "Tailwind CSS": ["tailwindcss", "tailwind", "tailwind css"],
    "Bootstrap": ["bootstrap5", "bootstrap 5", "bootstrap4"],
    "jQuery": ["jquery", "j query"],

    // JavaScript / TypeScript
    "JavaScript": ["js", "javascript", "ecmascript", "es6", "es2015", "es2020"],
    "TypeScript": ["ts", "typescript"],
    "Node.js": ["nodejs", "node.js", "node js", "node"],

    // Backend Frameworks
    "Express.js": ["express", "expressjs", "express.js"],
    "NestJS": ["nestjs", "nest.js", "nest"],
    "Django": ["django", "django rest framework", "drf"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi", "fast api"],
    "Spring Boot": ["spring", "spring boot", "springboot", "spring framework"],
    "Ruby on Rails": ["rails", "ruby on rails", "ror"],
    "Laravel": ["laravel"],
    "ASP.NET": ["asp.net", "aspnet", ".net", "dotnet", "dot net"],

    // Programming Languages
    "Python": ["python3", "python 3", "py"],
    "Java": ["java"],
    "C#": ["csharp", "c sharp", "c#"],
    "C++": ["cpp", "c plus plus", "c++"],
    "C": ["c language", "c programming"],
    "Go": ["golang", "go lang"],
    "Rust": ["rust", "rust lang", "rustlang"],
    "PHP": ["php"],
    "Ruby": ["ruby"],
    "Swift": ["swift"],
    "Kotlin": ["kotlin"],
    "Dart": ["dart"],
    "R": ["r language", "r programming"],
    "Scala": ["scala"],

    // Mobile
    "React Native": ["react native", "reactnative", "react-native", "rn"],
    "Flutter": ["flutter"],
    "iOS Development": ["ios", "ios development", "ios dev"],
    "Android Development": ["android", "android development", "android dev"],

    // Databases
    "PostgreSQL": ["postgres", "postgresql", "pg"],
    "MySQL": ["mysql", "my sql"],
    "MongoDB": ["mongodb", "mongo", "mongo db"],
    "Redis": ["redis"],
    "SQLite": ["sqlite", "sqlite3"],
    "Firebase": ["firebase", "firebase/firestore", "firestore"],
    "Supabase": ["supabase"],
    "Prisma": ["prisma", "prisma orm"],
    "SQL": ["sql", "structured query language"],

    // Cloud & DevOps
    "AWS": ["amazon web services", "aws"],
    "Google Cloud": ["gcp", "google cloud platform", "google cloud"],
    "Azure": ["microsoft azure", "azure"],
    "Docker": ["docker"],
    "Kubernetes": ["k8s", "kubernetes"],
    "CI/CD": ["ci/cd", "cicd", "ci cd", "continuous integration", "continuous deployment"],
    "Linux": ["linux", "ubuntu", "debian"],
    "Git": ["git"],
    "GitHub": ["github"],
    "GitLab": ["gitlab"],
    "Vercel": ["vercel"],
    "Netlify": ["netlify"],
    "Heroku": ["heroku"],
    "Nginx": ["nginx"],

    // Data Science / AI
    "Machine Learning": ["ml", "machine learning"],
    "Deep Learning": ["dl", "deep learning"],
    "TensorFlow": ["tensorflow", "tf"],
    "PyTorch": ["pytorch"],
    "Data Analysis": ["data analysis", "data analytics"],
    "Data Science": ["data science"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Scikit-learn": ["sklearn", "scikit-learn", "scikit learn"],

    // Design
    "Figma": ["figma"],
    "Adobe Photoshop": ["photoshop", "adobe photoshop", "ps"],
    "Adobe Illustrator": ["illustrator", "adobe illustrator", "ai"],
    "UI/UX Design": ["ui/ux", "ux/ui", "ui ux", "ux ui", "ui design", "ux design", "user experience", "user interface"],
    "Canva": ["canva"],

    // Testing
    "Jest": ["jest"],
    "Cypress": ["cypress"],
    "Playwright": ["playwright"],
    "Unit Testing": ["unit testing", "unit tests"],
    "E2E Testing": ["e2e testing", "e2e tests", "end to end testing"],

    // Marketing / Business
    "SEO": ["seo", "search engine optimization"],
    "Google Analytics": ["google analytics", "ga4", "ga"],
    "Social Media Marketing": ["smm", "social media marketing", "social media"],
    "Content Marketing": ["content marketing"],
    "Copywriting": ["copywriting", "copy writing"],
    "Digital Marketing": ["digital marketing"],
    "Email Marketing": ["email marketing"],
    "Project Management": ["project management", "pm"],
    "Agile": ["agile", "scrum", "kanban"],

    // Soft Skills
    "Communication": ["communication", "communication skills"],
    "Teamwork": ["teamwork", "team work", "collaboration"],
    "Leadership": ["leadership"],
    "Problem Solving": ["problem solving", "problem-solving"],
    "Critical Thinking": ["critical thinking"],
    "Time Management": ["time management"],
    "Public Speaking": ["public speaking", "presentation skills"],

    // APIs & Tools
    "REST API": ["rest", "rest api", "restful", "restful api"],
    "GraphQL": ["graphql", "graph ql"],
    "WebSocket": ["websocket", "websockets", "ws"],
    "Postman": ["postman"],
    "Swagger": ["swagger", "openapi"],

    // Bulgarian market specifics
    "SAP": ["sap"],
    "Salesforce": ["salesforce", "sfdc"],
    "Excel": ["microsoft excel", "excel", "ms excel"],
    "PowerPoint": ["microsoft powerpoint", "powerpoint", "ms powerpoint", "ppt"],
    "Word": ["microsoft word", "ms word"],

    // ── Bulgarian language aliases ────────────────────────────────────────────
    // Soft & professional skills
    "Communication": ["комуникация", "комуникационни умения", "комуникативност"],
    "Teamwork": ["екипна работа", "работа в екип", "екипност", "сътрудничество"],
    "Leadership": ["лидерство", "лидерски умения", "ръководство"],
    "Problem Solving": ["решаване на проблеми", "проблемно мислене", "аналитично мислене"],
    "Critical Thinking": ["критично мислене"],
    "Time Management": ["управление на времето", "тайм мениджмънт"],
    "Project Management": ["управление на проекти", "проектен мениджмънт", "управление на проект"],
    "Public Speaking": ["публично говорене", "презентационни умения", "презентации"],
    "Discipline": ["дисциплина", "самодисциплина"],
    "Focus": ["концентрация", "фокус"],
    "Stress Management": ["управление на стреса", "стрес мениджмънт"],
    "Agile": ["гъвкава методология", "скръм", "kanban", "канбан", "скрум"],
    "Digital Marketing": ["дигитален маркетинг"],
    "Content Marketing": ["контент маркетинг", "съдържателен маркетинг"],
    "SEO": ["seo оптимизация", "търсачка оптимизация"],

    // Technical skills — Bulgarian names, including "разработка на X" verb-prefix forms
    "JavaScript": ["джаваскрипт"],
    "Python": ["питон", "пайтън"],
    "Machine Learning": ["машинно обучение", "мл", "машинно самообучение"],
    "Deep Learning": ["дълбоко обучение"],
    "Data Analysis": ["анализ на данни", "обработка на данни"],
    "Data Science": ["наука за данни"],
    "Embedded Systems": [
        "вградени системи", "embedded системи",
        "ems система", "ems system",
        "разработка на ems система", "разработка на ems",
        "изграждане на ems", "embedded system разработка",
        "системи за вградено управление",
    ],
    "Multi-Agent Systems": [
        "мултиагентни системи", "мулти агентна система",
        "мулти-агентна система", "multi agent система",
        "разработка на мулти агентна система",
        "мулти агентен", "многоагентни системи",
    ],
    "Systems Design": ["системна архитектура", "проектиране на системи", "дизайн на системи"],
    "Software Architecture": ["софтуерна архитектура", "архитектура на софтуер"],
    "C++": ["с++", "с плюс плюс", "c plus plus"],
    "SQL": ["структурирани заявки", "бази данни", "релационни бази данни"],
    "Git": ["версионен контрол", "контрол на версиите"],
    "Docker": ["докер", "контейнери", "docker контейнери"],
    "REST API": ["rest api интеграция", "api интеграция", "уеб услуги", "web api"],
    "UI/UX Design": ["потребителски интерфейс", "потребителско изживяване", "ui/ux дизайн", "дизайн на интерфейс"],
    "React": ["реакт"],
    "Node.js": ["нод", "nodejs"],
    "PostgreSQL": ["постгрес", "postgresql база"],
    "AWS": ["амазон облак", "облачни услуги"],
    "CI/CD": ["непрекъсната интеграция", "непрекъснато разгръщане"],
    "Linux": ["линукс"],
    "Figma": ["фигма"],
    "Hardware Integration": ["хардуерна интеграция", "интеграция с хардуер"],
    "Real-time Systems": ["системи в реално време", "real-time системи"],
    "API Design": ["дизайн на api", "проектиране на api"],
    "User Research": ["потребителско проучване", "изследване на потребители"],
    "Frontend Development": ["фронтенд разработка", "разработка на фронтенд"],
    "Backend Development": ["бекенд разработка", "разработка на бекенд"],
    "Web Development": ["уеб разработка", "разработване на уеб"],
    "Mobile Development": ["мобилна разработка", "разработка на мобилни"],
    "Database Design": ["дизайн на бази данни", "проектиране на бази данни"],
    "Testing": ["тестване", "тестване на софтуер"],
    "Cybersecurity": ["киберсигурност", "информационна сигурност"],
    "Networking": ["мрежи", "компютърни мрежи"],
    "Physical Coordination": ["физическа координация", "координация"],
}

// Build reverse lookup: lowercase alias -> canonical name
const aliasToCanonical = new Map<string, string>()

for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    // Map the canonical name itself (lowercase)
    aliasToCanonical.set(canonical.toLowerCase(), canonical)
    for (const alias of aliases) {
        aliasToCanonical.set(alias.toLowerCase(), canonical)
    }
}

/**
 * Normalize a single skill string to its canonical form.
 * Returns the canonical name if found, or the trimmed original string with title case.
 */
export function normalizeSkill(raw: string): string {
    const trimmed = raw.trim()
    if (!trimmed) return trimmed
    const canonical = aliasToCanonical.get(trimmed.toLowerCase())
    return canonical ?? trimmed
}

/**
 * Normalize an array of skills, deduplicating after normalization.
 */
export function normalizeSkills(skills: string[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []
    for (const skill of skills) {
        const normalized = normalizeSkill(skill)
        const key = normalized.toLowerCase()
        if (!seen.has(key)) {
            seen.add(key)
            result.push(normalized)
        }
    }
    return result
}

/**
 * Compute skill overlap between a student's skills and required skills.
 * Returns { matched, missing, overlapRatio } after normalization.
 */
export function computeSkillOverlap(
    studentSkills: string[],
    requiredSkills: string[]
): { matched: string[]; missing: string[]; overlapRatio: number } {
    const normalizedStudent = new Set(normalizeSkills(studentSkills).map(s => s.toLowerCase()))
    const normalizedRequired = normalizeSkills(requiredSkills)

    const matched: string[] = []
    const missing: string[] = []

    for (const skill of normalizedRequired) {
        if (normalizedStudent.has(skill.toLowerCase())) {
            matched.push(skill)
        } else {
            missing.push(skill)
        }
    }

    const overlapRatio = normalizedRequired.length > 0
        ? matched.length / normalizedRequired.length
        : 0

    return { matched, missing, overlapRatio }
}
