import React, { useState } from 'react';
import { MEAL_TIME_OPTIONS, SERVING_OPTIONS } from '../../models/types';
import { useApp } from '../../context/AppContext';
import NumberStepper from '../ui/NumberStepper';
import './MealCard.css';

const MealCard = ({ scheduledMeal, onEdit, onDelete }) => {
  const { sides, meals, updateScheduledMeal } = useApp();
  const [expanded, setExpanded] = useState(false);
  
  const mealTimeConfig = MEAL_TIME_OPTIONS.find(
    opt => opt.value === scheduledMeal.mealTime
  );
  
  const meal = meals.find(m => m.id === scheduledMeal.mealId);
  const selectedSide = sides.find(s => s.id === scheduledMeal.selectedSideId);
  const availableSides = meal?.sideIds?.map(
    sideId => sides.find(s => s.id === sideId || s.code === sideId)
  ).filter(Boolean) || [];

  const handleServingsChange = async (newServings) => {
    await updateScheduledMeal(scheduledMeal.id, { servings: newServings });
  };

  const handleSideChange = async (sideId) => {
    await updateScheduledMeal(scheduledMeal.id, { selectedSideId: sideId });
  };

  return (
    <div 
      className={`meal-card ${scheduledMeal.isDelivery ? 'delivery' : ''}`}
      style={{ '--meal-color': mealTimeConfig?.color }}
    >
      <div className="meal-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="meal-card-time">
          <span className="meal-card-icon">{mealTimeConfig?.icon}</span>
          <span className="meal-card-label">{mealTimeConfig?.label}</span>
        </div>
        <div className="meal-card-name">
          {scheduledMeal.mealName}
          {scheduledMeal.isDelivery && (
            <span className="delivery-badge">🛵 Delivery</span>
          )}
        </div>
        <button 
          className="meal-card-expand"
          aria-label="Expandir"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      
      {expanded && (
        <div className="meal-card-details">
          <div className="meal-card-row">
            <span className="meal-card-row-label">Porciones:</span>
            <NumberStepper
              value={scheduledMeal.servings || 1}
              onChange={handleServingsChange}
              min={0.5}
              max={4}
              step={0.5}
            />
          </div>
          
          {availableSides.length > 0 && (
            <div className="meal-card-row">
              <span className="meal-card-row-label">Guarnición:</span>
              <div className="meal-card-sides">
                {availableSides.map(side => (
                  <button
                    key={side.id}
                    className={`chip ${scheduledMeal.selectedSideId === side.id ? 'selected' : ''}`}
                    onClick={() => handleSideChange(side.id)}
                  >
                    {side.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="meal-card-actions">
            <button className="btn btn-secondary btn-sm" onClick={onEdit}>
              ✏️ Cambiar
            </button>
            <button className="btn btn-outline btn-sm" onClick={onDelete}>
              🗑️ Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealCard;
