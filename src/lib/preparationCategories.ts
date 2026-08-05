const HIDDEN_CATEGORY_NAMES = ['neet'];

export function filterVisiblePreparationCategories<T extends { name?: string | null }>(categories: T[]): T[] {
  return categories.filter(
    (category) => !HIDDEN_CATEGORY_NAMES.includes(category.name?.trim().toLowerCase() || ''),
  );
}
