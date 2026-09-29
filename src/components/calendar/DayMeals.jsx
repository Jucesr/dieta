import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MealCard from './MealCard';
import { useApp } from '../../context/AppContext';
import { MEAL_TIME_OPTIONS } from '../../models/types';
import { addMacros, formatMacroGrams, macrosFromLines } from '../../models/nutrition';
import './DayMeals.css';

const SECOND_MEAL_LABEL = {
  breakfast: 'Segundo desayuno',
  lunch: 'Segunda comida',
  dinner: 'Segunda cena',
  snack: 'Segundo snack',
};

const DayMeals = ({ 
  date, 
  scheduledMeals, 
  onEditMeal,
  onQuickChangeMeal, 
  onDeleteMeal, 
  onAddMeal,
  onRandomMeal,
  mealTimes 
}) => {
  const { meals, mealIngredients, ingredients } = useApp();
  const [showNutrition, setShowNutrition] = useState(false);
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayMeals = scheduledMeals.filter(m => m.date === dateStr);
  
  const mealsByTime = mealTimes.map(mealTime => {
    const mealTimeConfig = MEAL_TIME_OPTIONS.find(opt => opt.value === mealTime);
    const slotMeals = dayMeals.filter(m => m.mealTime === mealTime);
    return { mealTime, config: mealTimeConfig, slotMeals };
  });

  const nutritionRows = useMemo(() => {
    return mealsByTime.flatMap(({ slotMeals }) => slotMeals.map((scheduled) => {
      const meal = meals.find((item) => item.id === scheduled.mealId);
      const lines = [
        ...(mealIngredients[scheduled.mealId] || []),
        ...(meal?.sides || []),
      ];
      const macros = macrosFromLines(lines, ingredients, scheduled.servings || 1);
      return {
        id: scheduled.id,
        name: scheduled.mealName || meal?.name || 'Comida',
        ...macros,
      };
    }));
  }, [mealsByTime, meals, mealIngredients, ingredients]);

  const nutritionTotals = useMemo(() => addMacros(nutritionRows), [nutritionRows]);
  const nutritionIncomplete = nutritionRows.some((row) => row.incomplete);

  return (
    <div className="day-meals">
      <div className="day-meals-header">
        <h2 className="day-meals-date">
          {format(date, "EEEE, d 'de' MMMM", { locale: es })}
        </h2>
        <div className="day-meals-header-actions">
          <button
            type="button"
            className={`chip ${showNutrition ? 'selected' : ''}`}
            onClick={() => setShowNutrition((open) => !open)}
            aria-pressed={showNutrition}
          >
            Nutrición
          </button>
          <span className="day-meals-count">
            {dayMeals.length} comida{dayMeals.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {showNutrition && (
        <div className="day-nutrition">
          {nutritionRows.length === 0 ? (
            <p className="day-nutrition-empty">No hay comidas para calcular.</p>
          ) : (
            <div className="day-nutrition-scroll">
              <table className="day-nutrition-table">
                <thead>
                  <tr>
                    <th>Comida</th>
                    <th>Proteína</th>
                    <th>Carbohidratos</th>
                    <th>Grasa</th>
                  </tr>
                </thead>
                <tbody>
                  {nutritionRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{formatMacroGrams(row.protein)}</td>
                      <td>{formatMacroGrams(row.carbs)}</td>
                      <td>{formatMacroGrams(row.fat)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total</th>
                    <th>{formatMacroGrams(nutritionTotals.protein)}</th>
                    <th>{formatMacroGrams(nutritionTotals.carbs)}</th>
                    <th>{formatMacroGrams(nutritionTotals.fat)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {nutritionIncomplete && (
            <p className="day-nutrition-note">
              Algunos ingredientes no tienen datos por 100 g o peso por unidad, así que no entran en la suma.
            </p>
          )}
        </div>
      )}
      
      <div className="day-meals-list">
        {mealsByTime.map(({ mealTime, config, slotMeals }) => (
          <div key={mealTime} className="meal-time-group">
            {slotMeals.length === 0 ? (
              <div className="meal-placeholder">
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
            ) : (
              <>
                {slotMeals.map((meal, index) => (
                  <MealCard
                    key={meal.id}
                    scheduledMeal={meal}
                    slotIndex={index}
                    onEdit={() => onEditMeal(meal)}
                    onQuickChange={() => onQuickChangeMeal?.(meal)}
                    onDelete={() => onDeleteMeal(meal)}
                  />
                ))}
                {slotMeals.length < 2 && (
                  <div className="meal-second-add">
                    <span className="meal-second-add-label">
                      + {SECOND_MEAL_LABEL[mealTime] || 'Segunda comida'}
                    </span>
                    <div className="meal-placeholder-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onAddMeal?.(mealTime)}
                      >
                        📝 Elegir
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onRandomMeal?.(mealTime)}
                      >
                        🎲 Aleatorio
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayMeals;
