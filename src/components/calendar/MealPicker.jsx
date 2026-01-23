import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { MEAL_TIME_OPTIONS, DIFFICULTY_OPTIONS } from '../../models/types';
import './MealPicker.css';

const MealPicker = ({ isOpen, onClose, onSelect, mealTime, currentMealId }) => {
  const { meals } = useApp();
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  const mealTimeConfig = MEAL_TIME_OPTIONS.find(opt => opt.value === mealTime);

  const filteredMeals = useMemo(() => {
    let filtered = meals;

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(meal =>
        meal.name?.toLowerCase().includes(searchLower) ||
        meal.code?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by difficulty
    if (filterDifficulty) {
      filtered = filtered.filter(meal => meal.difficulty === filterDifficulty);
    }

    // Sort: current meal first, then by name
    return filtered.sort((a, b) => {
      if (a.id === currentMealId) return -1;
      if (b.id === currentMealId) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [meals, search, filterDifficulty, currentMealId]);

  const handleSelect = (meal) => {
    onSelect(meal);
    onClose();
    setSearch('');
    setFilterDifficulty('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Elegir ${mealTimeConfig?.label || 'Comida'}`}
    >
      <div className="meal-picker">
        <div className="meal-picker-search">
          <input
            type="text"
            placeholder="Buscar comida..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="meal-picker-filters">
          <button
            className={`chip ${filterDifficulty === '' ? 'selected' : ''}`}
            onClick={() => setFilterDifficulty('')}
          >
            Todas
          </button>
          {DIFFICULTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`chip ${filterDifficulty === opt.value ? 'selected' : ''}`}
              onClick={() => setFilterDifficulty(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="meal-picker-list">
          {filteredMeals.length === 0 ? (
            <div className="meal-picker-empty">
              No se encontraron comidas
            </div>
          ) : (
            filteredMeals.map(meal => (
              <button
                key={meal.id}
                className={`meal-picker-item ${meal.id === currentMealId ? 'current' : ''}`}
                onClick={() => handleSelect(meal)}
              >
                <div className="meal-picker-item-info">
                  <span className="meal-picker-item-code">{meal.code}</span>
                  <span className="meal-picker-item-name">{meal.name}</span>
                </div>
                <div className="meal-picker-item-meta">
                  {meal.difficulty && (
                    <span className={`badge badge-${
                      DIFFICULTY_OPTIONS.find(d => d.value === meal.difficulty)?.color || 'default'
                    }`}>
                      {meal.difficulty}
                    </span>
                  )}
                  {meal.id === currentMealId && (
                    <span className="badge badge-primary">Actual</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MealPicker;
