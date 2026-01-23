import React, { useState } from 'react';
import { MEAL_TIME_OPTIONS, SERVING_OPTIONS, UNIT_OPTIONS } from '../../models/types';
import { useApp } from '../../context/AppContext';
import NumberStepper from '../ui/NumberStepper';
import Modal from '../ui/Modal';
import './MealCard.css';

const MealCard = ({ scheduledMeal, onEdit, onDelete }) => {
  const { sides, meals, mealIngredients, sideIngredients, ingredients, updateScheduledMeal } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [customIngredients, setCustomIngredients] = useState([]);
  
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

  const handleOpenComplete = () => {
    // Initialize custom ingredients from meal and side ingredients
    const mealIngs = mealIngredients[scheduledMeal.mealId] || [];
    const sideIngs = scheduledMeal.selectedSideId 
      ? (sideIngredients[scheduledMeal.selectedSideId] || [])
      : [];
    
    // Combine and adjust quantities based on servings
    const servings = scheduledMeal.servings || 1;
    const combined = [
      ...mealIngs.map(ing => ({
        ingredientName: ing.ingredientName,
        quantity: (ing.quantity || 0) * servings,
        unit: ing.unit || 'gramos',
        source: 'meal'
      })),
      ...sideIngs.map(ing => ({
        ingredientName: ing.ingredientName,
        quantity: (ing.quantity || 0) * servings,
        unit: ing.unit || 'gramos',
        source: 'side'
      }))
    ];
    
    // Use existing custom ingredients if saved, otherwise use combined
    setCustomIngredients(scheduledMeal.customIngredients || combined);
    setShowCompleteModal(true);
  };

  const handleCompleteConfirm = async () => {
    await updateScheduledMeal(scheduledMeal.id, { 
      completed: true,
      customIngredients 
    });
    setShowCompleteModal(false);
  };

  const handleUncomplete = async () => {
    await updateScheduledMeal(scheduledMeal.id, { completed: false });
  };

  const handleIngredientChange = (index, field, value) => {
    setCustomIngredients(prev => prev.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  const handleAddIngredient = () => {
    setCustomIngredients(prev => [
      ...prev,
      { ingredientName: '', unit: 'gramos', quantity: 0, source: 'custom' }
    ]);
  };

  const handleRemoveIngredient = (index) => {
    setCustomIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Build display name: meal name + side name if exists
  const displayName = selectedSide 
    ? `${scheduledMeal.mealName} + ${selectedSide.name}`
    : scheduledMeal.mealName;

  return (
    <>
      <div 
        className={`meal-card ${scheduledMeal.isDelivery ? 'delivery' : ''} ${scheduledMeal.completed ? 'completed' : ''}`}
        style={{ '--meal-color': mealTimeConfig?.color }}
      >
        <div className="meal-card-header" onClick={() => setExpanded(!expanded)}>
          <div className="meal-card-time">
            <span className="meal-card-icon">{mealTimeConfig?.icon}</span>
            <span className="meal-card-label">{mealTimeConfig?.label}</span>
          </div>
          <div className="meal-card-name">
            {displayName}
            {scheduledMeal.isDelivery && (
              <span className="delivery-badge">🛵 Delivery</span>
            )}
            {scheduledMeal.completed && (
              <span className="completed-badge">✓ Completado</span>
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
              {scheduledMeal.completed ? (
                <button className="btn btn-secondary btn-sm" onClick={handleUncomplete}>
                  ↩️ Desmarcar
                </button>
              ) : (
                <button className="btn btn-success btn-sm" onClick={handleOpenComplete}>
                  ✓ Completar
                </button>
              )}
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

      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Completar comida - Ajustar ingredientes"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCompleteModal(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleCompleteConfirm}>
              ✓ Completar
            </button>
          </>
        }
      >
        <div className="complete-modal-content">
          <p className="complete-modal-info">
            Ajusta las cantidades de ingredientes usados para {displayName}
          </p>
          
          <div className="complete-ingredients-list">
            {customIngredients.map((ing, index) => (
              <div key={index} className="complete-ingredient-row">
                <input
                  type="text"
                  placeholder="Ingrediente"
                  value={ing.ingredientName}
                  onChange={(e) => handleIngredientChange(index, 'ingredientName', e.target.value)}
                  list="complete-ingredients-datalist"
                />
                <input
                  type="number"
                  placeholder="Cant"
                  value={ing.quantity || ''}
                  onChange={(e) => handleIngredientChange(index, 'quantity', Number(e.target.value))}
                  style={{ width: '70px' }}
                />
                <select
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  style={{ width: '100px' }}
                >
                  {UNIT_OPTIONS.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-icon btn-outline"
                  onClick={() => handleRemoveIngredient(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <button 
            type="button" 
            className="btn btn-sm btn-secondary"
            onClick={handleAddIngredient}
          >
            + Agregar ingrediente
          </button>
          
          <datalist id="complete-ingredients-datalist">
            {ingredients.map(ing => (
              <option key={ing.id} value={ing.name} />
            ))}
          </datalist>
        </div>
      </Modal>
    </>
  );
};

export default MealCard;
