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
 * @property {string[]} sideIds - IDs of available sides
 * @property {string} preparation - Preparation instructions
 * @property {string[]} preferTime - Preferred meal times (breakfast, lunch, dinner)
 * @property {string} variations - Possible variations
 * @property {string} preference - Who prefers this meal
 * @property {number} useCount - How many times used
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * 
 * @typedef {Object} Ingredient
 * @property {string} id - Unique identifier
 * @property {string} name - Ingredient name
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
 * @typedef {Object} Side
 * @property {string} id - Unique identifier
 * @property {string} code - Side code (e.g., S01)
 * @property {string} name - Side name
 * @property {string[]} labels - Tags/categories
 * @property {string} preference - Who prefers this side
 * @property {Date} createdAt
 * 
 * @typedef {Object} SideIngredient
 * @property {string} id
 * @property {string} sideId - Reference to side
 * @property {string} ingredientName - Ingredient name
 * @property {string} unit - Unit of measurement
 * @property {number} quantity - Quantity needed
 * 
 * @typedef {Object} ScheduledMeal
 * @property {string} id
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {MealTime} mealTime - Which meal of the day
 * @property {string} mealId - Reference to meal
 * @property {string} mealName - Meal name (denormalized)
 * @property {string} selectedSideId - Selected side for this meal
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
