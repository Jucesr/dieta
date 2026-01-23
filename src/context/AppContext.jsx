import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  mealsService as firebaseMealsService,
  ingredientsService as firebaseIngredientsService,
  mealIngredientsService as firebaseMealIngredientsService,
  sidesService as firebaseSidesService,
  sideIngredientsService as firebaseSideIngredientsService,
  scheduledMealsService as firebaseScheduledMealsService,
  deliveryRulesService as firebaseDeliveryRulesService
} from '../services/firebaseService';
import {
  mockMealsService,
  mockIngredientsService,
  mockMealIngredientsService,
  mockSidesService,
  mockSideIngredientsService,
  mockScheduledMealsService,
  mockDeliveryRulesService
} from '../services/mockDataService';
import { generateDayPlan, generateWeekPlan } from '../services/mealPickerService';
import { DEFAULT_MEAL_TIMES } from '../models/types';

// Toggle this to use mock data instead of Firebase
const USE_MOCK_DATA = true;

// Select services based on mode
const mealsService = USE_MOCK_DATA ? mockMealsService : firebaseMealsService;
const ingredientsService = USE_MOCK_DATA ? mockIngredientsService : firebaseIngredientsService;
const mealIngredientsService = USE_MOCK_DATA ? mockMealIngredientsService : firebaseMealIngredientsService;
const sidesService = USE_MOCK_DATA ? mockSidesService : firebaseSidesService;
const sideIngredientsService = USE_MOCK_DATA ? mockSideIngredientsService : firebaseSideIngredientsService;
const scheduledMealsService = USE_MOCK_DATA ? mockScheduledMealsService : firebaseScheduledMealsService;
const deliveryRulesService = USE_MOCK_DATA ? mockDeliveryRulesService : firebaseDeliveryRulesService;

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Data state
  const [meals, setMeals] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [mealIngredients, setMealIngredients] = useState({});
  const [sides, setSides] = useState([]);
  const [sideIngredients, setSideIngredients] = useState({});
  const [scheduledMeals, setScheduledMeals] = useState([]);
  const [deliveryRules, setDeliveryRules] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealTimes, setMealTimes] = useState(DEFAULT_MEAL_TIMES);
  const [toasts, setToasts] = useState([]);

  // Toast notifications
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        mealsData,
        ingredientsData,
        sidesData,
        rulesData
      ] = await Promise.all([
        mealsService.getAll(),
        ingredientsService.getAll(),
        sidesService.getAll(),
        deliveryRulesService.getAll()
      ]);
      
      setMeals(mealsData);
      setIngredients(ingredientsData);
      setSides(sidesData);
      setDeliveryRules(rulesData);
      
      // Load ingredients for each meal
      const mealIngsMap = {};
      for (const meal of mealsData) {
        mealIngsMap[meal.id] = await mealIngredientsService.getByMealId(meal.id);
      }
      setMealIngredients(mealIngsMap);
      
      // Load ingredients for each side
      const sideIngsMap = {};
      for (const side of sidesData) {
        sideIngsMap[side.id] = await sideIngredientsService.getBySideId(side.id);
      }
      setSideIngredients(sideIngsMap);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load scheduled meals for a date range
  const loadScheduledMeals = useCallback(async (startDate, endDate) => {
    try {
      const data = await scheduledMealsService.getByDateRange(startDate, endDate);
      setScheduledMeals(data);
    } catch (err) {
      console.error('Error loading scheduled meals:', err);
      showToast('Error loading meal plan', 'error');
    }
  }, [showToast]);

  // Generate meal plan for a day
  const generateDayMealPlan = useCallback(async (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Get existing meals for this day
      const existingDayMeals = scheduledMeals.filter(m => m.date === dateStr);
      
      // Keep completed meals, only delete non-completed ones
      const completedMeals = existingDayMeals.filter(m => m.completed);
      const completedMealTimes = completedMeals.map(m => m.mealTime);
      
      // Delete only non-completed meals for this day
      const mealsToDelete = existingDayMeals.filter(m => !m.completed);
      for (const meal of mealsToDelete) {
        await scheduledMealsService.delete(meal.id);
      }
      
      // Generate only for meal times that don't have completed meals
      const mealTimesToGenerate = mealTimes.filter(mt => !completedMealTimes.includes(mt));
      
      const dayPlan = generateDayPlan({
        meals,
        date: dateStr,
        mealTimes: mealTimesToGenerate,
        recentMeals: scheduledMeals,
        deliveryRules,
        config: {
          avoidRepetition: true,
          repetitionWindow: 7,
          respectPreferences: true,
          balanceDifficulty: true
        }
      });
      
      const created = await scheduledMealsService.batchCreate(dayPlan);
      
      setScheduledMeals(prev => [
        ...prev.filter(m => m.date !== dateStr || m.completed),
        ...created
      ]);
      
      showToast('Día generado exitosamente');
      return created;
    } catch (err) {
      console.error('Error generating day plan:', err);
      showToast('Error al generar el plan', 'error');
      throw err;
    }
  }, [meals, mealTimes, scheduledMeals, deliveryRules, showToast]);

  // Generate meal plan for a week
  const generateWeekMealPlan = useCallback(async (startDate) => {
    try {
      const start = startOfWeek(startDate, { weekStartsOn: 1 });
      
      // Get week dates
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        weekDates.push(format(addDays(start, i), 'yyyy-MM-dd'));
      }
      
      // Get existing meals for the week
      const existingWeekMeals = scheduledMeals.filter(m => weekDates.includes(m.date));
      
      // Keep completed meals
      const completedMeals = existingWeekMeals.filter(m => m.completed);
      
      // Delete only non-completed meals for the week
      const mealsToDelete = existingWeekMeals.filter(m => !m.completed);
      for (const meal of mealsToDelete) {
        await scheduledMealsService.delete(meal.id);
      }
      
      // Build a map of completed meal times by date
      const completedByDate = {};
      completedMeals.forEach(m => {
        if (!completedByDate[m.date]) {
          completedByDate[m.date] = new Set();
        }
        completedByDate[m.date].add(m.mealTime);
      });
      
      // Generate plan excluding completed slots
      const weekPlan = [];
      const allScheduled = [...completedMeals];
      
      for (let i = 0; i < 7; i++) {
        const date = addDays(start, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const completedTimes = completedByDate[dateStr] || new Set();
        const timesToGenerate = mealTimes.filter(mt => !completedTimes.has(mt));
        
        if (timesToGenerate.length > 0) {
          const dayPlan = generateDayPlan({
            meals,
            date: dateStr,
            mealTimes: timesToGenerate,
            recentMeals: allScheduled,
            deliveryRules,
            config: {
              avoidRepetition: true,
              repetitionWindow: 7,
              respectPreferences: true,
              balanceDifficulty: true
            }
          });
          
          weekPlan.push(...dayPlan);
          allScheduled.push(...dayPlan);
        }
      }
      
      const created = await scheduledMealsService.batchCreate(weekPlan);
      
      setScheduledMeals(prev => [
        ...prev.filter(m => !weekDates.includes(m.date) || m.completed),
        ...created
      ]);
      
      showToast('Semana generada exitosamente');
      return created;
    } catch (err) {
      console.error('Error generating week plan:', err);
      showToast('Error al generar el plan semanal', 'error');
      throw err;
    }
  }, [meals, mealTimes, scheduledMeals, deliveryRules, showToast]);

  // Update a scheduled meal
  const updateScheduledMeal = useCallback(async (id, updates) => {
    try {
      await scheduledMealsService.update(id, updates);
      setScheduledMeals(prev => 
        prev.map(m => m.id === id ? { ...m, ...updates } : m)
      );
      showToast('Comida actualizada');
    } catch (err) {
      console.error('Error updating scheduled meal:', err);
      showToast('Error al actualizar', 'error');
      throw err;
    }
  }, [showToast]);

  // Delete a scheduled meal
  const deleteScheduledMeal = useCallback(async (id) => {
    try {
      await scheduledMealsService.delete(id);
      setScheduledMeals(prev => prev.filter(m => m.id !== id));
      showToast('Comida eliminada');
    } catch (err) {
      console.error('Error deleting scheduled meal:', err);
      showToast('Error al eliminar', 'error');
      throw err;
    }
  }, [showToast]);

  // Create a single scheduled meal
  const createScheduledMeal = useCallback(async (mealData) => {
    try {
      const created = await scheduledMealsService.create(mealData);
      setScheduledMeals(prev => [...prev, created]);
      showToast('Comida programada');
      return created;
    } catch (err) {
      console.error('Error creating scheduled meal:', err);
      showToast('Error al crear comida', 'error');
      throw err;
    }
  }, [showToast]);

  // CRUD for meals
  const createMeal = useCallback(async (data, ingredientsList = []) => {
    try {
      const meal = await mealsService.create(data);
      if (ingredientsList.length > 0) {
        await mealIngredientsService.batchUpdate(meal.id, ingredientsList);
        setMealIngredients(prev => ({ ...prev, [meal.id]: ingredientsList }));
      }
      setMeals(prev => [...prev, meal]);
      showToast('Comida creada');
      return meal;
    } catch (err) {
      console.error('Error creating meal:', err);
      showToast('Error al crear comida', 'error');
      throw err;
    }
  }, [showToast]);

  const updateMeal = useCallback(async (id, data, ingredientsList = null) => {
    try {
      await mealsService.update(id, data);
      if (ingredientsList !== null) {
        await mealIngredientsService.batchUpdate(id, ingredientsList);
        setMealIngredients(prev => ({ ...prev, [id]: ingredientsList }));
      }
      setMeals(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
      showToast('Comida actualizada');
    } catch (err) {
      console.error('Error updating meal:', err);
      showToast('Error al actualizar', 'error');
      throw err;
    }
  }, [showToast]);

  const deleteMeal = useCallback(async (id) => {
    try {
      await mealsService.delete(id);
      setMeals(prev => prev.filter(m => m.id !== id));
      setMealIngredients(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      showToast('Comida eliminada');
    } catch (err) {
      console.error('Error deleting meal:', err);
      showToast('Error al eliminar', 'error');
      throw err;
    }
  }, [showToast]);

  // CRUD for ingredients
  const createIngredient = useCallback(async (data) => {
    try {
      const ingredient = await ingredientsService.create(data);
      setIngredients(prev => [...prev, ingredient]);
      showToast('Ingrediente creado');
      return ingredient;
    } catch (err) {
      console.error('Error creating ingredient:', err);
      showToast('Error al crear ingrediente', 'error');
      throw err;
    }
  }, [showToast]);

  const updateIngredient = useCallback(async (id, data) => {
    try {
      await ingredientsService.update(id, data);
      setIngredients(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
      showToast('Ingrediente actualizado');
    } catch (err) {
      console.error('Error updating ingredient:', err);
      showToast('Error al actualizar', 'error');
      throw err;
    }
  }, [showToast]);

  const deleteIngredient = useCallback(async (id) => {
    try {
      await ingredientsService.delete(id);
      setIngredients(prev => prev.filter(i => i.id !== id));
      showToast('Ingrediente eliminado');
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      showToast('Error al eliminar', 'error');
      throw err;
    }
  }, [showToast]);

  // CRUD for sides
  const createSide = useCallback(async (data, ingredientsList = []) => {
    try {
      const side = await sidesService.create(data);
      if (ingredientsList.length > 0) {
        await sideIngredientsService.batchUpdate(side.id, ingredientsList);
        setSideIngredients(prev => ({ ...prev, [side.id]: ingredientsList }));
      }
      setSides(prev => [...prev, side]);
      showToast('Guarnición creada');
      return side;
    } catch (err) {
      console.error('Error creating side:', err);
      showToast('Error al crear guarnición', 'error');
      throw err;
    }
  }, [showToast]);

  const updateSide = useCallback(async (id, data, ingredientsList = null) => {
    try {
      await sidesService.update(id, data);
      if (ingredientsList !== null) {
        await sideIngredientsService.batchUpdate(id, ingredientsList);
        setSideIngredients(prev => ({ ...prev, [id]: ingredientsList }));
      }
      setSides(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      showToast('Guarnición actualizada');
    } catch (err) {
      console.error('Error updating side:', err);
      showToast('Error al actualizar', 'error');
      throw err;
    }
  }, [showToast]);

  const deleteSide = useCallback(async (id) => {
    try {
      await sidesService.delete(id);
      setSides(prev => prev.filter(s => s.id !== id));
      setSideIngredients(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      showToast('Guarnición eliminada');
    } catch (err) {
      console.error('Error deleting side:', err);
      showToast('Error al eliminar', 'error');
      throw err;
    }
  }, [showToast]);

  // CRUD for delivery rules
  const createDeliveryRule = useCallback(async (data) => {
    try {
      const rule = await deliveryRulesService.create(data);
      setDeliveryRules(prev => [...prev, rule]);
      showToast('Regla de delivery creada');
      return rule;
    } catch (err) {
      console.error('Error creating delivery rule:', err);
      showToast('Error al crear regla', 'error');
      throw err;
    }
  }, [showToast]);

  const updateDeliveryRule = useCallback(async (id, data) => {
    try {
      await deliveryRulesService.update(id, data);
      setDeliveryRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
      showToast('Regla actualizada');
    } catch (err) {
      console.error('Error updating delivery rule:', err);
      showToast('Error al actualizar', 'error');
      throw err;
    }
  }, [showToast]);

  const deleteDeliveryRule = useCallback(async (id) => {
    try {
      await deliveryRulesService.delete(id);
      setDeliveryRules(prev => prev.filter(r => r.id !== id));
      showToast('Regla eliminada');
    } catch (err) {
      console.error('Error deleting delivery rule:', err);
      showToast('Error al eliminar', 'error');
      throw err;
    }
  }, [showToast]);

  // Add/remove meal times
  const addMealTime = useCallback((mealTime) => {
    if (!mealTimes.includes(mealTime)) {
      setMealTimes(prev => [...prev, mealTime]);
    }
  }, [mealTimes]);

  const removeMealTime = useCallback((mealTime) => {
    setMealTimes(prev => prev.filter(t => t !== mealTime));
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  const value = {
    // Data
    meals,
    ingredients,
    mealIngredients,
    sides,
    sideIngredients,
    scheduledMeals,
    deliveryRules,
    mealTimes,
    
    // UI state
    loading,
    error,
    selectedDate,
    setSelectedDate,
    toasts,
    showToast,
    
    // Actions
    loadData,
    loadScheduledMeals,
    
    // Meal plan generation
    generateDayMealPlan,
    generateWeekMealPlan,
    
    // Scheduled meals
    createScheduledMeal,
    updateScheduledMeal,
    deleteScheduledMeal,
    
    // Meals CRUD
    createMeal,
    updateMeal,
    deleteMeal,
    
    // Ingredients CRUD
    createIngredient,
    updateIngredient,
    deleteIngredient,
    
    // Sides CRUD
    createSide,
    updateSide,
    deleteSide,
    
    // Delivery rules
    createDeliveryRule,
    updateDeliveryRule,
    deleteDeliveryRule,
    
    // Meal times
    addMealTime,
    removeMealTime,
    setMealTimes
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
