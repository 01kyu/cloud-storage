/**
 * FSD-слои: импорт только через публичные точки входа слайса.
 * Глубокие импорты запрещает `no-restricted-imports` — без внешних плагинов.
 */
const LAYERS = ["app", "views", "widgets", "features", "entities", "shared"];

const deepLayerPatterns = LAYERS.flatMap((layer) => [`@${layer}/*/*`, `@${layer}/*/*/*`]);

export const fsdBoundaries = [
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
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
    },
  },
];
