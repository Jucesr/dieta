import { UNIT_OPTIONS } from './types';

/** Macros stored per 100 g. Sugar is part of carbs and is not added again for kcal. */
export const NUTRITION_FIELDS = [
  { key: 'protein', label: 'Proteína', short: 'P' },
  { key: 'carbs', label: 'Carbohidratos', short: 'C' },
  { key: 'fat', label: 'Grasa', short: 'G' },
  { key: 'sugar', label: 'Azúcar', short: 'Az' },
];

export const EMPTY_NUTRITION_FORM = {
  protein: '',
  carbs: '',
  fat: '',
  sugar: '',
};

/** Units other than gramos. Each ingredient stores how many grams one of these weighs. */
export const WEIGHT_UNIT_OPTIONS = UNIT_OPTIONS.filter((unit) => unit !== 'gramos');

function toNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatNutritionAmount(value) {
  const n = toNumber(value);
  if (n == null) return null;
  return String(Math.round(n * 10) / 10);
}

/** kcal from protein, carbs, and fat. Sugar is already inside carbs. */
export function kcalFromMacros(nutrition) {
  if (!nutrition) return null;
  const protein = toNumber(nutrition.protein);
  const carbs = toNumber(nutrition.carbs);
  const fat = toNumber(nutrition.fat);
  if (protein == null || carbs == null || fat == null) return null;
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

export function nutritionToForm(nutrition) {
  return {
    protein: nutrition?.protein ?? '',
    carbs: nutrition?.carbs ?? '',
    fat: nutrition?.fat ?? '',
    sugar: nutrition?.sugar ?? '',
  };
}

export function formToNutrition(form) {
  const nutritionPer100g = {};
  for (const { key } of NUTRITION_FIELDS) {
    nutritionPer100g[key] = toNumber(form?.[key]);
  }
  return nutritionPer100g;
}

export function sugarExceedsCarbs(nutrition) {
  const sugar = toNumber(nutrition?.sugar);
  const carbs = toNumber(nutrition?.carbs);
  if (sugar == null || carbs == null) return false;
  return sugar > carbs;
}

export function hasNutritionValues(nutrition) {
  if (!nutrition) return false;
  return NUTRITION_FIELDS.some(({ key }) => toNumber(nutrition[key]) != null);
}

export function nutritionSummary(nutrition) {
  if (!hasNutritionValues(nutrition)) return null;
  const parts = [];
  const kcal = kcalFromMacros(nutrition);
  if (kcal != null) parts.push(`${kcal} kcal`);
  for (const { key, short } of NUTRITION_FIELDS) {
    const amount = formatNutritionAmount(nutrition[key]);
    if (amount != null) parts.push(`${short} ${amount}`);
  }
  return `${parts.join(' · ')} / 100 g`;
}

export function unitWeightsToRows(unitWeights) {
  if (!unitWeights) return [];
  return Object.entries(unitWeights).map(([unit, grams]) => ({
    id: crypto.randomUUID(),
    unit,
    grams: grams ?? '',
  }));
}

export function rowsToUnitWeights(rows) {
  const unitWeights = {};
  for (const row of rows || []) {
    const grams = toNumber(row.grams);
    if (!row.unit || grams == null) continue;
    unitWeights[row.unit] = grams;
  }
  return unitWeights;
}

export function formatUnitWeight(unit, grams) {
  const amount = formatNutritionAmount(grams);
  if (!unit || amount == null) return null;
  return `1 ${unit} = ${amount} g`;
}

function findIngredient(ingredients, line) {
  if (line?.ingredientId) {
    const byId = ingredients.find((ingredient) => ingredient.id === line.ingredientId);
    if (byId) return byId;
  }
  const name = line?.ingredientName?.toLowerCase();
  if (!name) return null;
  return ingredients.find((ingredient) => ingredient.name?.toLowerCase() === name) || null;
}

function gramsForLine(ingredient, line) {
  const quantity = toNumber(line?.quantity);
  if (quantity == null) return null;
  if (!line.unit || line.unit === 'gramos') return quantity;
  const gramsPerUnit = toNumber(ingredient?.unitWeights?.[line.unit]);
  if (gramsPerUnit == null) return null;
  return quantity * gramsPerUnit;
}

const MACRO_KEYS = ['protein', 'carbs', 'fat'];

/**
 * Protein, carbs, and fat for ingredient lines, scaled by servings.
 * A macro stays null when none of the lines could be counted.
 * incomplete is true when a line was skipped for missing nutrition or unit weight.
 */
export function macrosFromLines(lines, ingredients, servings = 1) {
  const totals = { protein: null, carbs: null, fat: null };
  let incomplete = false;
  const scale = toNumber(servings) ?? 1;

  for (const line of lines || []) {
    if (!line?.ingredientName && !line?.ingredientId) continue;
    const ingredient = findIngredient(ingredients, line);
    const grams = gramsForLine(ingredient, line);
    const nutrition = ingredient?.nutritionPer100g;
    if (!ingredient || grams == null || !nutrition) {
      incomplete = true;
      continue;
    }
    const factor = (grams / 100) * scale;
    let counted = false;
    for (const key of MACRO_KEYS) {
      const per100 = toNumber(nutrition[key]);
      if (per100 == null) continue;
      totals[key] = (totals[key] ?? 0) + per100 * factor;
      counted = true;
    }
    if (!counted) incomplete = true;
  }

  return { ...totals, incomplete };
}

export function addMacros(rows) {
  const totals = { protein: null, carbs: null, fat: null };
  for (const row of rows) {
    for (const key of MACRO_KEYS) {
      if (row[key] == null) continue;
      totals[key] = (totals[key] ?? 0) + row[key];
    }
  }
  return totals;
}

export function formatMacroGrams(value) {
  const amount = formatNutritionAmount(value);
  return amount == null ? '—' : `${amount} g`;
}
