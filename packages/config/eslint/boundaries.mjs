import boundaries from "eslint-plugin-boundaries";

/**
 * FSD-слои от внешнего к внутреннему: слой может зависеть только от себя
 * и от слоёв ниже. Глубокие импорты внутрь слайса по-прежнему запрещает
 * `no-restricted-imports` — он не требует резолва и работает быстрее.
 */
const LAYERS = ["app", "views", "widgets", "features", "entities", "shared"];

/**
 * Плагин матчит паттерн по суффиксу пути, поэтому префикс `src/` обязателен:
 * иначе папка `src/app/shared` превращается в элемент слоя `shared`.
 * `app` и `shared` — целые папки, остальные слои состоят из слайсов.
 */
const elementOf = (layer) => ({
  type: layer,
  pattern: layer === "app" || layer === "shared" ? `src/${layer}` : `src/${layer}/*`,
});

const layerPolicies = LAYERS.map((layer, index) => ({
  from: { element: { type: layer } },
  allow: { to: { element: { types: LAYERS.slice(index) } } },
  message: `${layer} может зависеть только от слоёв ${LAYERS.slice(index).join(", ")}.`,
}));

const deepLayerPatterns = LAYERS.flatMap((layer) => [`@${layer}/*/*`, `@${layer}/*/*/*`]);

export const fsdBoundaries = [
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": LAYERS.map(elementOf),
      /** Тестовые утилиты и декларации типов живут вне слоёв — это не архитектура. */
      "boundaries/ignore": ["src/test/**", "**/*.d.ts"],
      /** Плагин резолвит импорты сам — алиасы слоёв берём из tsconfig. */
      "import/resolver": {
        typescript: { project: ["./tsconfig.json"], alwaysTryTypes: true },
      },
    },
    rules: {
      /** Ловит файлы, выпавшие из FSD-структуры: без него они молча не линтуются. */
      "boundaries/no-unknown-files": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [...deepLayerPatterns, "!@shared/api/mocks"],
              message:
                "Импорт только через публичный API слайса: `@shared/ui`, `@entities/file`, `@features/upload-files`.",
            },
            {
              group: ["@/*/*", "@/components/*", "@/lib/*", "@/hooks/*"],
              message: "Легаси-алиас `@/*` разрешён только для файлов вне FSD-слоёв.",
            },
            {
              group: ["../../../*", "../../../../*", "../../../../../*"],
              message: "Глубокие относительные импорты запрещены — используйте алиасы слоёв.",
            },
          ],
        },
      ],
      /**
       * Порядок важен: побеждает последняя подходящая политика, поэтому
       * исключение для файлов вне слоёв (`src/test/**` и игнорируемые файлы)
       * объявлено после матрицы.
       */
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            ...layerPolicies,
            {
              from: { element: { isUnknown: true } },
              allow: {
                to: [{ element: { types: LAYERS } }, { element: { isUnknown: true } }],
              },
              message: "Файлы вне FSD-слоёв могут импортировать что угодно.",
            },
          ],
        },
      ],
    },
  },
];
