import React from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import './WeekView.css';

const WeekView = ({ selectedDate, onDateSelect, scheduledMeals, mealTimes }) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getMealsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduledMeals.filter(meal => meal.date === dateStr);
  };

  const getMealCountBadge = (date) => {
    const meals = getMealsForDate(date);
    const expected = mealTimes.length;
    const actual = meals.length;
    
    if (actual === 0) return null;
    if (actual >= expected) return { type: 'complete', count: actual };
    return { type: 'partial', count: actual };
  };

  return (
    <div className="week-view">
      {weekDays.map(day => {
        const isSelected = isSameDay(day, selectedDate);
        const today = isToday(day);
        const badge = getMealCountBadge(day);
        
        return (
          <button
            key={day.toISOString()}
            className={`week-day ${isSelected ? 'selected' : ''} ${today ? 'today' : ''}`}
            onClick={() => onDateSelect(day)}
          >
            <span className="week-day-name">
              {format(day, 'EEE', { locale: es })}
            </span>
            <span className="week-day-number">
              {format(day, 'd')}
            </span>
            {badge && (
              <span className={`week-day-badge ${badge.type}`}>
                {badge.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default WeekView;
