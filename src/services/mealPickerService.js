/**
 * Meal Picker Service
 * 
 * This module contains the isolated logic for picking meals.
 * It can be enhanced later with more sophisticated algorithms.
 */

import { format, getDay } from 'date-fns';

/**
 * Configuration for meal picking
 * @typedef {Object} MealPickerConfig
 * @property {boolean} avoidRepetition - Avoid picking the same meal recently
 * @property {number} repetitionWindow - Days to look back for repetition check
 * @property {boolean} respectPreferences - Consider meal time preferences
 * @property {boolean} balanceDifficulty - Mix easy and hard meals
 */

const DEFAULT_CONFIG = {
  avoidRepetition: true,
  repetitionWindow: 7,
  respectPreferences: true,
  balanceDifficulty: true
};

/**
 * Maps meal time to label keywords used in the meals
 */
const MEAL_TIME_TO_LABELS = {
  breakfast: ['Desayuno'],
  lunch: ['Comida'],
  dinner: ['Cena', 'Comida'],
  snack: ['Snack', 'Desayuno']
};

/**
 * Filters meals that are appropriate for a given meal time
 * @param {Array} meals - All available meals
 * @param {string} mealTime - The meal time (breakfast, lunch, dinner, snack)
 * @returns {Array} Filtered meals
 */
export const filterMealsByTime = (meals, mealTime) => {
  const validLabels = MEAL_TIME_TO_LABELS[mealTime] || [];
  
  return meals.filter(meal => {
    if (!meal.labels || meal.labels.length === 0) return true;
    return meal.labels.some(label => 
      validLabels.some(valid => 
        label.toLowerCase().includes(valid.toLowerCase())
      )
    );
  });
};

/**
 * Filters out meals that have been used recently
 * @param {Array} meals - Candidate meals
 * @param {Array} recentMeals - Recently scheduled meals
 * @param {number} windowDays - Days to look back
 * @returns {Array} Filtered meals
 */
export const filterRecentlyUsed = (meals, recentMeals, windowDays = 7) => {
  const recentMealIds = new Set(recentMeals.map(m => m.mealId));
  
  // If all meals have been used recently, return all of them
  const filtered = meals.filter(meal => !recentMealIds.has(meal.id));
  return filtered.length > 0 ? filtered : meals;
};

/**
 * Filters meals by delivery/non-delivery requirement
 * @param {Array} meals - Candidate meals
 * @param {boolean} requireDelivery - Whether delivery is required
 * @returns {Array} Filtered meals
 */
export const filterByDeliveryRequirement = (meals, requireDelivery) => {
  if (requireDelivery) {
    const deliveryMeals = meals.filter(meal => 
      meal.difficulty === 'No casera' || 
      (meal.labels && meal.labels.some(l => l.toLowerCase().includes('delivery')))
    );
    return deliveryMeals.length > 0 ? deliveryMeals : meals;
  }
  return meals;
};

/**
 * Scores meals based on various factors
 * @param {Array} meals - Candidate meals
 * @param {Object} context - Context for scoring
 * @returns {Array} Meals with scores
 */
export const scoreMeals = (meals, context = {}) => {
  const { preferLessUsed = true, recentMeals = [] } = context;
  const recentMealIds = new Set(recentMeals.map(m => m.mealId));
  
  return meals.map(meal => {
    let score = 100; // Base score
    
    // Penalize recently used meals
    if (recentMealIds.has(meal.id)) {
      score -= 30;
    }
    
    // Prefer less frequently used meals
    if (preferLessUsed) {
      score -= (meal.useCount || 0) * 2;
    }
    
    // Add some randomness to prevent predictability
    score += Math.random() * 20;
    
    return { ...meal, score };
  });
};

/**
 * Selects a random meal with weighted probability based on scores
 * @param {Array} scoredMeals - Meals with scores
 * @returns {Object|null} Selected meal
 */
export const selectWeightedRandom = (scoredMeals) => {
  if (scoredMeals.length === 0) return null;
  if (scoredMeals.length === 1) return scoredMeals[0];
  
  // Normalize scores to positive values
  const minScore = Math.min(...scoredMeals.map(m => m.score));
  const normalizedMeals = scoredMeals.map(m => ({
    ...m,
    normalizedScore: m.score - minScore + 1
  }));
  
  const totalScore = normalizedMeals.reduce((sum, m) => sum + m.normalizedScore, 0);
  let random = Math.random() * totalScore;
  
  for (const meal of normalizedMeals) {
    random -= meal.normalizedScore;
    if (random <= 0) {
      return meal;
    }
  }
  
  return normalizedMeals[normalizedMeals.length - 1];
};

/**
 * Main function to pick a meal for a specific slot
 * @param {Object} params - Parameters for meal picking
 * @param {Array} params.meals - All available meals
 * @param {string} params.mealTime - The meal time slot
 * @param {string} params.date - The date (ISO string)
 * @param {Array} params.recentMeals - Recently scheduled meals
 * @param {Array} params.deliveryRules - Delivery rules configuration
 * @param {Object} params.config - Additional configuration
 * @returns {Object|null} Selected meal
 */
export const pickMeal = ({
  meals,
  mealTime,
  date,
  recentMeals = [],
  deliveryRules = [],
  config = DEFAULT_CONFIG
}) => {
  if (!meals || meals.length === 0) return null;
  
  // Check if this slot requires delivery
  const dayOfWeek = getDay(new Date(date));
  const requiresDelivery = deliveryRules.some(
    rule => rule.dayOfWeek === dayOfWeek && 
            rule.mealTime === mealTime && 
            rule.enabled
  );
  
  // Step 1: Filter by meal time preference
  let candidates = config.respectPreferences 
    ? filterMealsByTime(meals, mealTime)
    : meals;
  
  // Step 2: Filter by delivery requirement
  candidates = filterByDeliveryRequirement(candidates, requiresDelivery);
  
  // Step 3: Filter recently used (if config allows)
  if (config.avoidRepetition) {
    candidates = filterRecentlyUsed(candidates, recentMeals, config.repetitionWindow);
  }
  
  // Step 4: Score remaining candidates
  const scored = scoreMeals(candidates, { 
    preferLessUsed: true, 
    recentMeals 
  });
  
  // Step 5: Select using weighted random
  const selected = selectWeightedRandom(scored);
  
  if (selected) {
    return {
      ...selected,
      isDelivery: requiresDelivery
    };
  }
  
  return null;
};

/**
 * Generates a meal plan for a single day
 * @param {Object} params - Parameters
 * @param {Array} params.meals - All available meals
 * @param {string} params.date - The date (ISO string)
 * @param {Array} params.mealTimes - Meal times to fill
 * @param {Array} params.recentMeals - Recently scheduled meals
 * @param {Array} params.deliveryRules - Delivery rules
 * @param {Object} params.config - Configuration
 * @returns {Array} Array of scheduled meals for the day
 */
export const generateDayPlan = ({
  meals,
  date,
  mealTimes = ['breakfast', 'lunch', 'dinner'],
  recentMeals = [],
  deliveryRules = [],
  config = DEFAULT_CONFIG
}) => {
  const dayPlan = [];
  const usedInDay = new Set();
  
  for (const mealTime of mealTimes) {
    // Filter out meals already used today
    const availableMeals = meals.filter(m => !usedInDay.has(m.id));
    
    const picked = pickMeal({
      meals: availableMeals,
      mealTime,
      date,
      recentMeals: [...recentMeals, ...dayPlan],
      deliveryRules,
      config
    });
    
    if (picked) {
      usedInDay.add(picked.id);
      dayPlan.push({
        date,
        mealTime,
        mealId: picked.id,
        mealName: picked.name,
        selectedSideId: picked.sideIds?.[0] || null,
        servings: 1,
        isDelivery: picked.isDelivery || false
      });
    }
  }
  
  return dayPlan;
};

/**
 * Generates a meal plan for a week
 * @param {Object} params - Parameters
 * @param {Array} params.meals - All available meals
 * @param {Date} params.startDate - First day of the week
 * @param {Array} params.mealTimes - Meal times to fill
 * @param {Array} params.existingMeals - Already scheduled meals
 * @param {Array} params.deliveryRules - Delivery rules
 * @param {Object} params.config - Configuration
 * @returns {Array} Array of scheduled meals for the week
 */
export const generateWeekPlan = ({
  meals,
  startDate,
  mealTimes = ['breakfast', 'lunch', 'dinner'],
  existingMeals = [],
  deliveryRules = [],
  config = DEFAULT_CONFIG
}) => {
  const weekPlan = [];
  const allScheduled = [...existingMeals];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const dayPlan = generateDayPlan({
      meals,
      date: dateStr,
      mealTimes,
      recentMeals: allScheduled,
      deliveryRules,
      config
    });
    
    weekPlan.push(...dayPlan);
    allScheduled.push(...dayPlan);
  }
  
  return weekPlan;
};

export default {
  pickMeal,
  generateDayPlan,
  generateWeekPlan,
  filterMealsByTime,
  filterRecentlyUsed,
  filterByDeliveryRequirement,
  scoreMeals,
  selectWeightedRandom
};
