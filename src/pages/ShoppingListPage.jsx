import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import { aggregateIngredients, getMealsUsingIngredient } from '../services/shoppingListService';
import { settingsService } from '../services/firebaseService';
import { INGREDIENT_CATEGORIES, getCategoryLabel } from '../config/ingredientCategories';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import './ShoppingListPage.css';

const SHOPPING_CHECKED_KEY = 'shoppingChecked';
const SHOPPING_CHECKED_STORAGE_KEY = 'dieta_shoppingChecked';

async function loadShoppingChecked() {
  try {
    const value = await settingsService.get(SHOPPING_CHECKED_KEY);
    return value && typeof value === 'object' ? value : {};
  } catch {
    try {
      const raw = localStorage.getItem(SHOPPING_CHECKED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}

async function saveShoppingChecked(data) {
  const payload = { ...data };
  try {
    await settingsService.set(SHOPPING_CHECKED_KEY, payload);
  } catch {
    try {
      localStorage.setItem(SHOPPING_CHECKED_STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }
}

const NO_CATEGORY_KEY = '__sin_categoria__';

/** Groups shopping items by category using ingredient name -> categoryId lookup. Returns array of { categoryId, label, items }. */
function groupItemsByCategory(items, nameToCategoryId) {
  const groups = new Map();
  for (const item of items) {
    const categoryId = nameToCategoryId.get(item.name?.toLowerCase?.() ?? '') ?? null;
    const key = categoryId ?? NO_CATEGORY_KEY;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const order = [...INGREDIENT_CATEGORIES.map(c => c.id), NO_CATEGORY_KEY];
  return order
    .filter(k => groups.has(k))
    .map(key => ({
      categoryId: key === NO_CATEGORY_KEY ? null : key,
      label: key === NO_CATEGORY_KEY ? 'Sin categoría' : getCategoryLabel(key),
      items: groups.get(key)
    }));
}

const ShoppingListPage = () => {
  const { 
    loading, 
    ingredients,
    meals,
    scheduledMeals, 
    mealIngredients,
    selectedDate,
    setSelectedDate,
    loadScheduledMeals
  } = useApp();
  
  const [localSelectedDate, setLocalSelectedDate] = useState(selectedDate);

  const [selectedDays, setSelectedDays] = useState(new Set([0, 1, 2, 3, 4, 5, 6]));
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'custom'
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  // Store checked items per week (keyed by week start date string)
  const [checkedItemsByWeek, setCheckedItemsByWeek] = useState({});

  // Get week days using local selected date
  const weekStart = startOfWeek(localSelectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(localSelectedDate, { weekStartsOn: 1 });
  
  // Memoize the formatted date strings to avoid infinite loops
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  // Load scheduled meals when week changes
  useEffect(() => {
    loadScheduledMeals(weekStartStr, weekEndStr);
  }, [weekStartStr, weekEndStr, loadScheduledMeals]);

  // Load persisted checked state on mount
  useEffect(() => {
    let cancelled = false;
    loadShoppingChecked()
      .then((saved) => {
        if (cancelled) return;
        const byWeek = {};
        for (const [week, arr] of Object.entries(saved)) {
          byWeek[week] = new Set(Array.isArray(arr) ? arr : []);
        }
        setCheckedItemsByWeek(byWeek);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Week navigation handlers
  const handlePrevWeek = () => {
    setLocalSelectedDate(subWeeks(localSelectedDate, 1));
  };

  const handleNextWeek = () => {
    setLocalSelectedDate(addWeeks(localSelectedDate, 1));
  };

  const handleToday = () => {
    setLocalSelectedDate(new Date());
  };
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE', { locale: es }),
      dayNumber: format(date, 'd')
    };
  });

  // Filter meals by selected days
  const selectedDates = useMemo(() => {
    return weekDays
      .filter((_, index) => selectedDays.has(index))
      .map(d => d.dateStr);
  }, [weekDays, selectedDays]);

  const filteredMeals = useMemo(() => {
    return scheduledMeals.filter(m => selectedDates.includes(m.date));
  }, [scheduledMeals, selectedDates]);

  // Generate shopping list
  const shoppingList = useMemo(() => {
    return aggregateIngredients(filteredMeals, mealIngredients, meals);
  }, [filteredMeals, mealIngredients, meals]);

  // Get meals using selected ingredient
  const mealsUsingIngredient = useMemo(() => {
    if (!selectedIngredient) return [];
    return getMealsUsingIngredient(
      selectedIngredient.name,
      filteredMeals,
      mealIngredients,
      meals
    );
  }, [selectedIngredient, filteredMeals, mealIngredients, meals]);

  const handleDayToggle = (index) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedDays(newSelected);
    setViewMode('custom');
  };

  const handleSelectOnlyDay = (index) => {
    setSelectedDays(new Set([index]));
    setViewMode('custom');
  };

  const handleSelectAll = () => {
    setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]));
    setViewMode('week');
  };

  // Get checked items for the current week
  const checkedItems = checkedItemsByWeek[weekStartStr] || new Set();

  const handleToggleItem = useCallback((itemName) => {
    setCheckedItemsByWeek(prev => {
      const currentWeekChecked = prev[weekStartStr] || new Set();
      const newChecked = new Set(currentWeekChecked);
      if (newChecked.has(itemName)) {
        newChecked.delete(itemName);
      } else {
        newChecked.add(itemName);
      }
      const next = { ...prev, [weekStartStr]: newChecked };
      const toSave = {};
      for (const [week, setVal] of Object.entries(next)) {
        toSave[week] = Array.from(setVal);
      }
      saveShoppingChecked(toSave);
      return next;
    });
  }, [weekStartStr]);

  const uncheckedItems = shoppingList.filter(item => !checkedItems.has(item.name));
  const checkedItemsList = shoppingList.filter(item => checkedItems.has(item.name));

  // Map ingredient name -> categoryId for grouping (must run before any early return)
  const nameToCategoryId = useMemo(() => {
    const map = new Map();
    ingredients.forEach(ing => {
      if (ing.name && ing.categoryId) map.set(ing.name.toLowerCase(), ing.categoryId);
    });
    return map;
  }, [ingredients]);

  const groupedUnchecked = useMemo(
    () => groupItemsByCategory(uncheckedItems, nameToCategoryId),
    [uncheckedItems, nameToCategoryId]
  );
  const groupedChecked = useMemo(
    () => groupItemsByCategory(checkedItemsList, nameToCategoryId),
    [checkedItemsList, nameToCategoryId]
  );

  if (loading) {
    return <Loading text="Cargando lista de compras..." />;
  }

  return (
    <div className="shopping-page">
      <header className="section-header">
        <h1 className="section-title">Lista de Compras</h1>
        <span className="shopping-count">
          {shoppingList.length} ingrediente{shoppingList.length !== 1 ? 's' : ''}
        </span>
      </header>

      <div className="shopping-week-nav">
        <div className="shopping-nav-buttons">
          <button className="btn btn-icon btn-secondary" onClick={handlePrevWeek}>
            ←
          </button>
          <button className="btn btn-sm btn-secondary" onClick={handleToday}>
            Hoy
          </button>
          <button className="btn btn-icon btn-secondary" onClick={handleNextWeek}>
            →
          </button>
        </div>
        <div className="shopping-week-label">
          {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
        </div>
      </div>

      <div className="shopping-filters">
        <div className="day-toggles">
          {weekDays.map((day, index) => (
            <div key={day.dateStr} className="day-toggle-wrapper">
              <button
                className={`day-toggle ${selectedDays.has(index) ? 'active' : ''} ${selectedDays.size === 1 && selectedDays.has(index) ? 'only' : ''}`}
                onClick={() => handleDayToggle(index)}
                onDoubleClick={() => handleSelectOnlyDay(index)}
                title="Click: activar/desactivar | Doble click: solo este día"
              >
                <span className="day-toggle-name">{day.dayName}</span>
                <span className="day-toggle-number">{day.dayNumber}</span>
              </button>
              <button
                className="day-toggle-only"
                onClick={() => handleSelectOnlyDay(index)}
                title="Solo este día"
              >
                Solo
              </button>
            </div>
          ))}
        </div>
        <button 
          className="btn btn-sm btn-secondary"
          onClick={handleSelectAll}
        >
          Toda la semana
        </button>
      </div>

      {shoppingList.length === 0 ? (
        <EmptyState
          icon="🛒"
          text="No hay ingredientes para los días seleccionados"
        />
      ) : (
        <div className="shopping-list">
          {uncheckedItems.length > 0 && (
            <div className="shopping-section">
              <h3 className="shopping-section-title">Por comprar</h3>
              {groupedUnchecked.map(group => (
                <div key={group.categoryId ?? NO_CATEGORY_KEY} className="shopping-category-group">
                  <h4 className="shopping-category-title">{group.label}</h4>
                  {group.items.map(item => (
                    <div 
                      key={`${item.name}-${item.unit}`}
                      className="shopping-item"
                    >
                      <button 
                        className="shopping-checkbox"
                        onClick={() => handleToggleItem(item.name)}
                      >
                        <span className="checkbox-inner"></span>
                      </button>
                      <div 
                        className="shopping-item-info"
                        onClick={() => setSelectedIngredient(item)}
                      >
                        <span className="shopping-item-name">{item.name}</span>
                        <span className="shopping-item-quantity">
                          {item.quantity > 0 ? `${item.quantity} ${item.unit}` : item.unit || '-'}
                        </span>
                      </div>
                      <button 
                        className="shopping-item-meals"
                        onClick={() => setSelectedIngredient(item)}
                      >
                        {item.meals.length} 🍽️
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {checkedItemsList.length > 0 && (
            <div className="shopping-section checked">
              <h3 className="shopping-section-title">
                Completados ({checkedItemsList.length})
              </h3>
              {groupedChecked.map(group => (
                <div key={group.categoryId ?? NO_CATEGORY_KEY} className="shopping-category-group">
                  <h4 className="shopping-category-title">{group.label}</h4>
                  {group.items.map(item => (
                    <div 
                      key={`${item.name}-${item.unit}`}
                      className="shopping-item checked"
                    >
                      <button 
                        className="shopping-checkbox checked"
                        onClick={() => handleToggleItem(item.name)}
                      >
                        <span className="checkbox-inner">✓</span>
                      </button>
                      <div className="shopping-item-info">
                        <span className="shopping-item-name">{item.name}</span>
                        <span className="shopping-item-quantity">
                          {item.quantity > 0 ? `${item.quantity} ${item.unit}` : item.unit || '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
        title={`Comidas con ${selectedIngredient?.name}`}
      >
        {mealsUsingIngredient.length === 0 ? (
          <p>No se encontraron comidas</p>
        ) : (
          <div className="ingredient-meals-list">
            {mealsUsingIngredient.map(meal => (
              <div key={`${meal.id}-${meal.date}`} className="ingredient-meal-item">
                <span className="ingredient-meal-date">
                  {format(parseISO(meal.date), "EEE d", { locale: es })}
                </span>
                <span className="ingredient-meal-time">{meal.mealTime}</span>
                <span className="ingredient-meal-name">{meal.mealName}</span>
                {meal.foundIn === 'side' && (
                  <span className="badge">Guarnición</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ShoppingListPage;
