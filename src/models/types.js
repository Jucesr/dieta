/**
 * @typedef {'Sencillas' | 'Elaborada' | 'No casera'} Difficulty
 * 
 * @typedef {'breakfast' | 'lunch' | 'dinner' | 'snack'} MealTime
 * 
 * @typedef {Object} Meal
 * @property {string} id - Unique identifier
 * @property {string} code - Meal code (e.g., C01, D01)
 * @property {string} name - Meal name
 * @property {Difficulty} difficulty - How difficult to prepare
 * @property {string[]} labels - Tags/categories (Comida, Desayuno, Cena, etc.)
 * @property {MealSide[]} [sides] - Up to 2 ingredient sides, stored apart from meal ingredients
 * @property {string} preparation - Preparation instructions
 * @property {string[]} preferTime - Preferred meal times (breakfast, lunch, dinner)
 * @property {string} variations - Possible variations
 * @property {string} preference - Who prefers this meal
 * @property {number} useCount - How many times used
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * 
 * @typedef {Object} NutritionPer100g
 * @property {number|null} protein - Grams of protein per 100 g
 * @property {number|null} carbs - Grams of carbohydrate per 100 g (includes sugar)
 * @property {number|null} fat - Grams of fat per 100 g
 * @property {number|null} sugar - Grams of sugar per 100 g (already included in carbs)
 *
 * @typedef {Object} Ingredient
 * @property {string} id - Unique identifier
 * @property {string} name - Ingredient name
 * @property {string} [categoryId] - Ingredient category id (see INGREDIENT_CATEGORIES)
 * @property {NutritionPer100g} [nutritionPer100g] - Macros per 100 g; kcal is derived
 * @property {Object.<string, number>} [unitWeights] - Grams in 1 of each non-gram unit (pieza, cucharada, ...)
 * @property {Date} createdAt
 * 
 * @typedef {Object} MealIngredient
 * @property {string} id
 * @property {string} mealId - Reference to meal
 * @property {string} ingredientId - Reference to ingredient
 * @property {string} ingredientName - Ingredient name (denormalized)
 * @property {string} unit - Unit of measurement (gramos, pieza, cucharada, etc.)
 * @property {number} quantity - Quantity needed
 * 
 * @typedef {Object} MealSide
 * @property {string} ingredientId - Reference to ingredient
 * @property {string} ingredientName - Ingredient name (denormalized)
 * @property {string} unit - Unit of measurement
 * @property {number} quantity - Quantity for this side
 * 
 * @typedef {Object} ScheduledMeal
 * @property {string} id
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {MealTime} mealTime - Which meal of the day
 * @property {string} mealId - Reference to meal
 * @property {string} mealName - Meal name (denormalized)
 * @property {number} servings - Number of servings (portion multiplier)
 * @property {boolean} isDelivery - Whether this is delivery food
 * @property {Date} createdAt
 * 
 * @typedef {Object} DeliveryRule
 * @property {string} id
 * @property {number} dayOfWeek - 0 = Sunday, 6 = Saturday
 * @property {MealTime} mealTime - Which meal should be delivery
 * @property {boolean} enabled
 */

export const DIFFICULTY_OPTIONS = [
  { value: 'Sencillas', label: 'Sencillas', color: 'success' },
  { value: 'Elaborada', label: 'Elaborada', color: 'warning' },
  { value: 'No casera', label: 'No casera (Delivery)', color: 'info' }
];

export const MEAL_TIME_OPTIONS = [
  { value: 'breakfast', label: 'Desayuno', icon: '🌅', color: '#ffc947' },
  { value: 'lunch', label: 'Comida', icon: '☀️', color: '#ff6b6b' },
  { value: 'dinner', label: 'Cena', icon: '🌙', color: '#38bdf8' },
  { value: 'snack', label: 'Snack', icon: '🍎', color: '#4ade80' }
];

export const LABEL_OPTIONS = [
  'Desayuno',
  'Comida', 
  'Cena',
  'Snack'
];

export const MAX_MEAL_SIDES = 2;

/** Keeps only named sides, capped at MAX_MEAL_SIDES. */
export function normalizeMealSides(sides) {
  return (Array.isArray(sides) ? sides : [])
    .filter((side) => side?.ingredientName?.trim())
    .slice(0, MAX_MEAL_SIDES)
    .map((side) => ({
      ingredientId: side.ingredientId || '',
      ingredientName: side.ingredientName.trim(),
      unit: side.unit || 'gramos',
      quantity: Number(side.quantity) || 0,
    }));
}

function sameTextList(left, right) {
  const a = Array.isArray(left) ? left : [];
  const b = Array.isArray(right) ? right : [];
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function ingredientSnapshot(ingredient) {
  return {
    ingredientId: ingredient?.ingredientId || '',
    ingredientName: (ingredient?.ingredientName || '').trim(),
    unit: ingredient?.unit || 'gramos',
    quantity: Number(ingredient?.quantity) || 0,
  };
}

/** True when the saved ingredient rows differ from the ones loaded into the form. */
export function mealIngredientsChanged(previous, next) {
  const before = previous || [];
  const after = next || [];
  if (before.length !== after.length) return true;
  return before.some((ingredient, index) => {
    const left = ingredientSnapshot(ingredient);
    const right = ingredientSnapshot(after[index]);
    return left.ingredientId !== right.ingredientId
      || left.ingredientName !== right.ingredientName
      || left.unit !== right.unit
      || left.quantity !== right.quantity;
  });
}

/** True when meal fields edited in the form differ from the loaded meal. */
export function mealDetailsChanged(previous, next) {
  const beforeSides = normalizeMealSides(previous?.sides);
  const afterSides = normalizeMealSides(next?.sides);
  return (previous?.code || '') !== (next?.code || '')
    || (previous?.name || '') !== (next?.name || '')
    || (previous?.difficulty || '') !== (next?.difficulty || '')
    || (previous?.preparation || '') !== (next?.preparation || '')
    || (previous?.variations || '') !== (next?.variations || '')
    || (previous?.preference || '') !== (next?.preference || '')
    || !sameTextList(previous?.labels, next?.labels)
    || mealIngredientsChanged(beforeSides, afterSides);
}

export const UNIT_OPTIONS = [
  'gramos',
  'pieza',
  'cucharada',
  'cucharadita',
  'taza',
  'ml',
  'tiras',
  'rebanada'
];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' }
];

export const DEFAULT_MEAL_TIMES = ['breakfast', 'lunch', 'dinner'];

export const SERVING_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x' },
  { value: 2.5, label: '2.5x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' }
];
