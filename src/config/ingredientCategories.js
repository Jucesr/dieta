/**
 * Available ingredient categories for classification.
 * Each category has an id (for storage/classification) and a label (for display).
 */
export const INGREDIENT_CATEGORIES = [
  { id: 'proteinas', label: 'Proteínas' },
  { id: 'lacteos', label: 'Lácteos' },
  { id: 'frutas_verduras', label: 'Frutas y verduras' },
  { id: 'granos_cereales_leguminosas', label: 'Granos, cereales y leguminosas' },
  { id: 'panaderia_tortillas_pastas', label: 'Panadería, tortillas y pastas' },
  { id: 'enlatados', label: 'Enlatados' },
  { id: 'salsas_aderezos_condimentos', label: 'Salsas, aderezos y condimentos' },
  { id: 'aceites_semillas_nueces_untables', label: 'Aceites, semillas, nueces y untables' }
];

/** @type {string[]} Valid category ids for validation */
export const INGREDIENT_CATEGORY_IDS = INGREDIENT_CATEGORIES.map(c => c.id);

/**
 * @param {string} id - Category id
 * @returns {string|undefined} Label for the category or undefined if not found
 */
export function getCategoryLabel(id) {
  const cat = INGREDIENT_CATEGORIES.find(c => c.id === id);
  return cat?.label;
}
