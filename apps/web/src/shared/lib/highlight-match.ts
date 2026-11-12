export type HighlightPart = {
  text: string;
  /** Кусок совпал с запросом — рендерится как `<mark>`. */
  match: boolean;
};

/**
 * Делит строку на куски по вхождению `query` без учёта регистра.
 *
 * Сравнение идёт по `toLowerCase()` обеих строк: для кириллицы регистр меняет
 * длину только в экзотических случаях (`İ`), поэтому индексы берутся из
 * исходной строки и подсветка не «съезжает» на обычных именах файлов.
 * Пустой запрос возвращает строку одним куском — вызывающему не нужна ветка.
 */
export const highlightMatch = (text: string, query: string): HighlightPart[] => {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return [{ text, match: false }];
  }

  const haystack = text.toLowerCase();
  const parts: HighlightPart[] = [];
  let index = 0;

  while (index < text.length) {
    const found = haystack.indexOf(needle, index);

    if (found === -1) {
      break;
    }

    if (found > index) {
      parts.push({ text: text.slice(index, found), match: false });
    }

    parts.push({ text: text.slice(found, found + needle.length), match: true });
    index = found + needle.length;
  }

  if (index < text.length) {
    parts.push({ text: text.slice(index), match: false });
  }

  return parts;
};
