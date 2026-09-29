/**
 * Shopping List Service
 *
 * Aggregates ingredients from scheduled meals, including ingredient sides
 * stored on the meal itself.
 */

function mealsById(meals) {
  const map = {};
  for (const meal of meals || []) {
    map[meal.id] = meal;
  }
  return map;
}

function addShoppingLine(ingredientMap, ing, scheduled, isSide) {
  if (!ing?.ingredientName) return;
  const { mealId, servings = 1 } = scheduled;
  const key = `${ing.ingredientName}-${ing.unit}`;
  const mealRef = {
    mealId,
    mealName: scheduled.mealName,
    date: scheduled.date,
    mealTime: scheduled.mealTime,
    ...(isSide ? { isSide: true } : {}),
  };
  const existing = ingredientMap.get(key);

  if (existing) {
    existing.quantity += (ing.quantity || 0) * servings;
    existing.meals.push(mealRef);
  } else {
    ingredientMap.set(key, {
      name: ing.ingredientName,
      unit: ing.unit,
      quantity: (ing.quantity || 0) * servings,
      meals: [mealRef],
    });
  }
}

/**
 * Aggregates ingredients from meals and their ingredient sides.
 * @param {Array} scheduledMeals - Scheduled meals for the period
 * @param {Object} mealIngredients - Map of mealId to ingredients array
 * @param {Array} meals - Meal definitions, each with an optional sides array
 * @returns {Array} Aggregated shopping list
 */
export const aggregateIngredients = (
  scheduledMeals,
  mealIngredients,
  meals
) => {
  const ingredientMap = new Map();
  const mealLookup = mealsById(meals);

  for (const scheduled of scheduledMeals) {
    const mealIngs = mealIngredients[scheduled.mealId] || [];
    for (const ing of mealIngs) {
      addShoppingLine(ingredientMap, ing, scheduled, false);
    }

    const sideIngs = mealLookup[scheduled.mealId]?.sides || [];
    for (const ing of sideIngs) {
      addShoppingLine(ingredientMap, ing, scheduled, true);
    }
  }

  return Array.from(ingredientMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};

/**
 * Groups shopping list by ingredient category (future enhancement)
 * @param {Array} ingredients - Aggregated ingredients
 * @returns {Object} Grouped ingredients
 */
export const groupByCategory = (ingredients) => {
  return {
    'Todos los ingredientes': ingredients
  };
};

/**
 * Filters shopping list by selected dates
 * @param {Array} scheduledMeals - All scheduled meals
 * @param {Array} selectedDates - Dates to include
 * @param {Object} mealIngredients - Map of mealId to ingredients
 * @param {Array} meals - Meal definitions
 * @returns {Array} Filtered and aggregated shopping list
 */
export const getShoppingListForDates = (
  scheduledMeals,
  selectedDates,
  mealIngredients,
  meals
) => {
  const filteredMeals = scheduledMeals.filter(meal =>
    selectedDates.includes(meal.date)
  );

  return aggregateIngredients(filteredMeals, mealIngredients, meals);
};

/**
 * Gets meals that use a specific ingredient, including as a side.
 * @param {string} ingredientName - Name of the ingredient
 * @param {Array} scheduledMeals - Scheduled meals to search
 * @param {Object} mealIngredients - Map of mealId to ingredients
 * @param {Array} meals - Meal definitions
 * @returns {Array} Meals using this ingredient
 */
export const getMealsUsingIngredient = (
  ingredientName,
  scheduledMeals,
  mealIngredients,
  meals
) => {
  const mealsWithIngredient = [];
  const mealLookup = mealsById(meals);
  const target = ingredientName.toLowerCase();

  for (const scheduled of scheduledMeals) {
    const mealIngs = mealIngredients[scheduled.mealId] || [];
    const foundInMeal = mealIngs.some(ing =>
      ing.ingredientName?.toLowerCase() === target
    );
    const foundInSide = (mealLookup[scheduled.mealId]?.sides || []).some(ing =>
      ing.ingredientName?.toLowerCase() === target
    );

    if (foundInMeal || foundInSide) {
      mealsWithIngredient.push({
        ...scheduled,
        foundIn: foundInMeal ? 'meal' : 'side'
      });
    }
  }

  return mealsWithIngredient;
};

export default {
  aggregateIngredients,
  groupByCategory,
  getShoppingListForDates,
  getMealsUsingIngredient
};
