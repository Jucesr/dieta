import React from 'react';
import { useApp } from '../../context/AppContext';
import { DIFFICULTY_OPTIONS, LABEL_OPTIONS, UNIT_OPTIONS } from '../../models/types';
import './MealForm.css';

const MealForm = ({
  formData,
  formIngredients,
  onFormDataChange,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  onLabelToggle,
  onSideToggle,
  onSubmit
}) => {
  const { sides, ingredients } = useApp();

  // Handle ingredient selection from dropdown
  const handleIngredientSelect = (index, ingredientId) => {
    if (ingredientId) {
      const selectedIngredient = ingredients.find(ing => ing.id === ingredientId);
      if (selectedIngredient) {
        onIngredientChange(index, 'ingredientId', ingredientId);
        onIngredientChange(index, 'ingredientName', selectedIngredient.name);
      }
    } else {
      onIngredientChange(index, 'ingredientId', '');
      onIngredientChange(index, 'ingredientName', '');
    }
  };

  return (
    <form onSubmit={onSubmit} className="meal-form">
      <div className="form-row">
        <div className="form-group" style={{ flex: '0 0 100px' }}>
          <label className="form-label">Código</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => onFormDataChange({ ...formData, code: e.target.value })}
            placeholder="C01"
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Nombre *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            placeholder="Enchiladas suizas"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Dificultad</label>
        <div className="form-chips">
          {DIFFICULTY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`chip ${formData.difficulty === opt.value ? 'selected' : ''}`}
              onClick={() => onFormDataChange({ ...formData, difficulty: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Etiquetas</label>
        <div className="form-chips">
          {LABEL_OPTIONS.map(label => (
            <button
              key={label}
              type="button"
              className={`chip ${formData.labels.includes(label) ? 'selected' : ''}`}
              onClick={() => onLabelToggle(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Guarniciones disponibles</label>
        <div className="form-chips">
          {sides.map(side => (
            <button
              key={side.id}
              type="button"
              className={`chip ${formData.sideIds.includes(side.id) ? 'selected' : ''}`}
              onClick={() => onSideToggle(side.id)}
            >
              {side.name}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label">Ingredientes</label>
          <button 
            type="button" 
            className="btn btn-sm btn-secondary"
            onClick={onAddIngredient}
          >
            + Agregar
          </button>
        </div>
        <div className="ingredients-list">
          {formIngredients.map((ing, index) => (
            <div key={index} className="ingredient-row">
              <select
                value={ing.ingredientId || ''}
                onChange={(e) => handleIngredientSelect(index, e.target.value)}
                className="ingredient-select"
              >
                <option value="">Seleccionar ingrediente...</option>
                {ingredients
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(ingredient => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                placeholder="Cant"
                value={ing.quantity || ''}
                onChange={(e) => onIngredientChange(index, 'quantity', Number(e.target.value))}
                style={{ width: '70px' }}
              />
              <select
                value={ing.unit}
                onChange={(e) => onIngredientChange(index, 'unit', e.target.value)}
                style={{ width: '100px' }}
              >
                {UNIT_OPTIONS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-icon btn-outline"
                onClick={() => onRemoveIngredient(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Preparación</label>
        <textarea
          value={formData.preparation}
          onChange={(e) => onFormDataChange({ ...formData, preparation: e.target.value })}
          placeholder="Instrucciones de preparación..."
          rows={4}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Variaciones</label>
        <input
          type="text"
          value={formData.variations}
          onChange={(e) => onFormDataChange({ ...formData, variations: e.target.value })}
          placeholder="Con pollo, con carne de res..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Preferencia</label>
        <input
          type="text"
          value={formData.preference}
          onChange={(e) => onFormDataChange({ ...formData, preference: e.target.value })}
          placeholder="Julio, Ericka..."
        />
      </div>
    </form>
  );
};

export default MealForm;
