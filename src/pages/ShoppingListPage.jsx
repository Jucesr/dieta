import React, { useState, useMemo } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import { aggregateIngredients, getMealsUsingIngredient } from '../services/shoppingListService';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import './ShoppingListPage.css';

const ShoppingListPage = () => {
  const { 
    loading, 
    scheduledMeals, 
    mealIngredients, 
    sideIngredients,
    selectedDate 
  } = useApp();

  const [selectedDays, setSelectedDays] = useState(new Set([0, 1, 2, 3, 4, 5, 6]));
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'custom'
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [checkedItems, setCheckedItems] = useState(new Set());

  // Get week days
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
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
    return aggregateIngredients(filteredMeals, mealIngredients, sideIngredients);
  }, [filteredMeals, mealIngredients, sideIngredients]);

  // Get meals using selected ingredient
  const mealsUsingIngredient = useMemo(() => {
    if (!selectedIngredient) return [];
    return getMealsUsingIngredient(
      selectedIngredient.name,
      filteredMeals,
      mealIngredients,
      sideIngredients
    );
  }, [selectedIngredient, filteredMeals, mealIngredients, sideIngredients]);

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

  const handleSelectAll = () => {
    setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]));
    setViewMode('week');
  };

  const handleToggleItem = (itemName) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemName)) {
      newChecked.delete(itemName);
    } else {
      newChecked.add(itemName);
    }
    setCheckedItems(newChecked);
  };

  if (loading) {
    return <Loading text="Cargando lista de compras..." />;
  }

  const uncheckedItems = shoppingList.filter(item => !checkedItems.has(item.name));
  const checkedItemsList = shoppingList.filter(item => checkedItems.has(item.name));

  return (
    <div className="shopping-page">
      <header className="section-header">
        <h1 className="section-title">Lista de Compras</h1>
        <span className="shopping-count">
          {shoppingList.length} ingrediente{shoppingList.length !== 1 ? 's' : ''}
        </span>
      </header>

      <div className="shopping-filters">
        <div className="day-toggles">
          {weekDays.map((day, index) => (
            <button
              key={day.dateStr}
              className={`day-toggle ${selectedDays.has(index) ? 'active' : ''}`}
              onClick={() => handleDayToggle(index)}
            >
              <span className="day-toggle-name">{day.dayName}</span>
              <span className="day-toggle-number">{day.dayNumber}</span>
            </button>
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
              {uncheckedItems.map(item => (
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
          )}

          {checkedItemsList.length > 0 && (
            <div className="shopping-section checked">
              <h3 className="shopping-section-title">
                Completados ({checkedItemsList.length})
              </h3>
              {checkedItemsList.map(item => (
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
                  {format(new Date(meal.date), "EEE d", { locale: es })}
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
