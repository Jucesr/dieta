/**
 * Shopping List Service
 * 
 * Aggregates ingredients from scheduled meals for shopping lists
 */

/**
 * Aggregates ingredients from meals and sides
 * @param {Array} scheduledMeals - Scheduled meals for the period
 * @param {Object} mealIngredients - Map of mealId to ingredients array
 * @param {Object} sideIngredients - Map of sideId to ingredients array
 * @returns {Array} Aggregated shopping list
 */
export const aggregateIngredients = (
  scheduledMeals,
  mealIngredients,
  sideIngredients
) => {
  const ingredientMap = new Map();
  
  for (const scheduled of scheduledMeals) {
    const { mealId, selectedSideId, servings = 1 } = scheduled;
    
    // Add meal ingredients
    const mealIngs = mealIngredients[mealId] || [];
    for (const ing of mealIngs) {
      const key = `${ing.ingredientName}-${ing.unit}`;
      const existing = ingredientMap.get(key);
      
      if (existing) {
        existing.quantity += (ing.quantity || 0) * servings;
        existing.meals.push({
          mealId,
          mealName: scheduled.mealName,
          date: scheduled.date,
          mealTime: scheduled.mealTime
        });
      } else {
        ingredientMap.set(key, {
          name: ing.ingredientName,
          unit: ing.unit,
          quantity: (ing.quantity || 0) * servings,
          meals: [{
            mealId,
            mealName: scheduled.mealName,
            date: scheduled.date,
            mealTime: scheduled.mealTime
          }]
        });
      }
    }
    
    // Add side ingredients
    if (selectedSideId) {
      const sideIngs = sideIngredients[selectedSideId] || [];
      for (const ing of sideIngs) {
        const key = `${ing.ingredientName}-${ing.unit}`;
        const existing = ingredientMap.get(key);
        
        if (existing) {
          existing.quantity += (ing.quantity || 0) * servings;
          existing.meals.push({
            mealId,
            mealName: scheduled.mealName,
            date: scheduled.date,
            mealTime: scheduled.mealTime,
            isSide: true
          });
        } else {
          ingredientMap.set(key, {
            name: ing.ingredientName,
            unit: ing.unit,
            quantity: (ing.quantity || 0) * servings,
            meals: [{
              mealId,
              mealName: scheduled.mealName,
              date: scheduled.date,
              mealTime: scheduled.mealTime,
              isSide: true
            }]
          });
        }
      }
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
  // For now, just return a single group
  // This can be enhanced later with ingredient categories
  return {
    'Todos los ingredientes': ingredients
  };
};

/**
 * Filters shopping list by selected dates
 * @param {Array} scheduledMeals - All scheduled meals
 * @param {Array} selectedDates - Dates to include
 * @param {Object} mealIngredients - Map of mealId to ingredients
 * @param {Object} sideIngredients - Map of sideId to ingredients
 * @returns {Array} Filtered and aggregated shopping list
 */
export const getShoppingListForDates = (
  scheduledMeals,
  selectedDates,
  mealIngredients,
  sideIngredients
) => {
  const filteredMeals = scheduledMeals.filter(meal => 
    selectedDates.includes(meal.date)
  );
  
  return aggregateIngredients(filteredMeals, mealIngredients, sideIngredients);
};

/**
 * Gets meals that use a specific ingredient
 * @param {string} ingredientName - Name of the ingredient
 * @param {Array} scheduledMeals - Scheduled meals to search
 * @param {Object} mealIngredients - Map of mealId to ingredients
 * @param {Object} sideIngredients - Map of sideId to ingredients
 * @returns {Array} Meals using this ingredient
 */
export const getMealsUsingIngredient = (
  ingredientName,
  scheduledMeals,
  mealIngredients,
  sideIngredients
) => {
  const mealsWithIngredient = [];
  
  for (const scheduled of scheduledMeals) {
    const { mealId, selectedSideId } = scheduled;
    
    // Check meal ingredients
    const mealIngs = mealIngredients[mealId] || [];
    const foundInMeal = mealIngs.some(ing => 
      ing.ingredientName.toLowerCase() === ingredientName.toLowerCase()
    );
    
    // Check side ingredients
    let foundInSide = false;
    if (selectedSideId) {
      const sideIngs = sideIngredients[selectedSideId] || [];
      foundInSide = sideIngs.some(ing => 
        ing.ingredientName.toLowerCase() === ingredientName.toLowerCase()
      );
    }
    
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
