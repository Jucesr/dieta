import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MealCard from './MealCard';
import EmptyState from '../ui/EmptyState';
import { MEAL_TIME_OPTIONS } from '../../models/types';
import { useApp } from '../../context/AppContext';
import './DayMeals.css';

const DayMeals = ({ 
  date, 
  scheduledMeals, 
  onEditMeal, 
  onDeleteMeal, 
  onAddMeal,
  onRandomMeal,
  mealTimes 
}) => {
  const { meals } = useApp();
  
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayMeals = scheduledMeals.filter(m => m.date === dateStr);
  
  // Group by meal time in order
  const mealsByTime = mealTimes.map(mealTime => {
    const mealTimeConfig = MEAL_TIME_OPTIONS.find(opt => opt.value === mealTime);
    const meal = dayMeals.find(m => m.mealTime === mealTime);
    return { mealTime, config: mealTimeConfig, meal };
  });

  if (dayMeals.length === 0) {
    return (
      <div className="day-meals">
        <div className="day-meals-header">
          <h2 className="day-meals-date">
            {format(date, "EEEE, d 'de' MMMM", { locale: es })}
          </h2>
        </div>
        <EmptyState 
          icon="🍽️"
          text="No hay comidas programadas para este día"
        />
      </div>
    );
  }

  return (
    <div className="day-meals">
      <div className="day-meals-header">
        <h2 className="day-meals-date">
          {format(date, "EEEE, d 'de' MMMM", { locale: es })}
        </h2>
        <span className="day-meals-count">
          {dayMeals.length} comida{dayMeals.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="day-meals-list">
        {mealsByTime.map(({ mealTime, config, meal }) => {
          if (meal) {
            return (
              <MealCard
                key={meal.id}
                scheduledMeal={meal}
                onEdit={() => onEditMeal(meal)}
                onDelete={() => onDeleteMeal(meal)}
              />
            );
          }
          // Show placeholder for missing meal time with options to add
          return (
            <div key={mealTime} className="meal-placeholder">
              <div className="meal-placeholder-info">
                <span className="meal-placeholder-icon">{config?.icon}</span>
                <span className="meal-placeholder-text">
                  Sin {config?.label.toLowerCase()}
                </span>
              </div>
              <div className="meal-placeholder-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => onAddMeal?.(mealTime)}
                  title="Elegir comida"
                >
                  📝 Elegir
                </button>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => onRandomMeal?.(mealTime)}
                  title="Generar aleatorio"
                >
                  🎲 Aleatorio
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayMeals;
