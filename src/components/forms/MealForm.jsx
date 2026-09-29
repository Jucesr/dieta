import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DIFFICULTY_OPTIONS, LABEL_OPTIONS, MAX_MEAL_SIDES, UNIT_OPTIONS } from '../../models/types';
import Modal from '../ui/Modal';
import './MealForm.css';

const MealForm = ({
  formData,
  formIngredients,
  onFormDataChange,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  onLabelToggle,
  onSubmit,
  isEditing = false
}) => {
  const { ingredients, createIngredient } = useApp();

  // Ingredient search modal (same pattern as meals search)
  const [showIngredientSearchModal, setShowIngredientSearchModal] = useState(false);
  const [ingredientSearchTarget, setIngredientSearchTarget] = useState(null);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [isCreatingIngredient, setIsCreatingIngredient] = useState(false);

  const sides = formData.sides || [];

  const filteredIngredients = useMemo(() => {
    const sorted = ingredients.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (!ingredientSearchQuery.trim()) return sorted;
    const q = ingredientSearchQuery.toLowerCase();
    return sorted.filter(
      ing => (ing.name || '').toLowerCase().includes(q) || (ing.code || '').toLowerCase().includes(q)
    );
  }, [ingredients, ingredientSearchQuery]);

  const updateSides = (nextSides) => {
    onFormDataChange({ ...formData, sides: nextSides });
  };

  const handleAddSide = () => {
    if (sides.length >= MAX_MEAL_SIDES) return;
    updateSides([
      ...sides,
      { ingredientId: '', ingredientName: '', unit: 'gramos', quantity: 0 }
    ]);
  };

  const handleRemoveSide = (index) => {
    updateSides(sides.filter((_, i) => i !== index));
  };

  const handleSideChange = (index, field, value) => {
    updateSides(sides.map((side, i) => (
      i === index ? { ...side, [field]: value } : side
    )));
  };

  const openIngredientSearch = (target) => {
    setIngredientSearchTarget(target);
    setIngredientSearchQuery('');
    setShowIngredientSearchModal(true);
  };

  const closeIngredientSearch = () => {
    setShowIngredientSearchModal(false);
    setIngredientSearchTarget(null);
    setIngredientSearchQuery('');
  };

  const handleIngredientSelectFromModal = (ingredient) => {
    if (!ingredientSearchTarget) return;
    const { type, index } = ingredientSearchTarget;
    if (type === 'side') {
      updateSides(sides.map((side, i) => {
        if (i !== index) return side;
        return ingredient
          ? { ...side, ingredientId: ingredient.id, ingredientName: ingredient.name }
          : { ...side, ingredientId: '', ingredientName: '' };
      }));
    } else if (ingredient) {
      onIngredientChange(index, 'ingredientId', ingredient.id);
      onIngredientChange(index, 'ingredientName', ingredient.name);
    } else {
      onIngredientChange(index, 'ingredientId', '');
      onIngredientChange(index, 'ingredientName', '');
    }
    closeIngredientSearch();
  };

  const handleCreateNewIngredient = async () => {
    const name = ingredientSearchQuery.trim();
    if (!name || !ingredientSearchTarget) return;
    setIsCreatingIngredient(true);
    try {
      const created = await createIngredient({ name });
      handleIngredientSelectFromModal(created);
    } catch (err) {
      // Toast already shown by createIngredient
    } finally {
      setIsCreatingIngredient(false);
    }
  };

  return (
    <>
    <form onSubmit={onSubmit} className="meal-form">
      <div className="form-row">
        <div className="form-group" style={{ flex: '0 0 100px' }}>
          <label className="form-label">Código</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => onFormDataChange({ ...formData, code: e.target.value })}
            placeholder="C01"
            readOnly={!isEditing}
            title={!isEditing ? 'Código generado automáticamente' : 'Editar código'}
            style={!isEditing ? { backgroundColor: '#e9ecef', cursor: 'not-allowed', color: '#495057' } : {}}
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
        <div className="form-label-row">
          <label className="form-label">Guarniciones</label>
          {sides.length < MAX_MEAL_SIDES && (
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleAddSide}
            >
              + Agregar
            </button>
          )}
        </div>
        <p className="form-hint">
          Hasta {MAX_MEAL_SIDES}. Se agregan a la compra y no modifican los ingredientes de la comida.
        </p>
        <div className="ingredients-list">
          {sides.map((side, index) => (
            <div key={index} className="ingredient-row">
              <button
                type="button"
                className="ingredient-search-trigger"
                onClick={() => openIngredientSearch({ type: 'side', index })}
              >
                {side.ingredientName || 'Buscar ingrediente...'}
              </button>
              <input
                type="number"
                placeholder="Cant"
                value={side.quantity || ''}
                onChange={(e) => handleSideChange(index, 'quantity', Number(e.target.value))}
                style={{ width: '70px' }}
              />
              <select
                value={side.unit}
                onChange={(e) => handleSideChange(index, 'unit', e.target.value)}
                style={{ width: '100px' }}
              >
                {UNIT_OPTIONS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-icon btn-outline"
                onClick={() => handleRemoveSide(index)}
              >
                ×
              </button>
            </div>
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
              <button
                type="button"
                className="ingredient-search-trigger"
                onClick={() => openIngredientSearch({ type: 'ingredient', index })}
              >
                {ing.ingredientName || 'Buscar ingrediente...'}
              </button>
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

    {/* Modales fuera del form para evitar envío accidental */}
    <Modal
      isOpen={showIngredientSearchModal}
      onClose={closeIngredientSearch}
      title="Buscar ingrediente"
      footer={
        <button type="button" className="btn btn-primary" onClick={closeIngredientSearch}>
          Cerrar
        </button>
      }
    >
      <input
        type="text"
        placeholder="Buscar por nombre..."
        value={ingredientSearchQuery}
        onChange={(e) => setIngredientSearchQuery(e.target.value)}
        className="ingredient-search-input"
        autoFocus
      />
      <div className="ingredient-search-list">
        <button
          type="button"
          className="ingredient-search-item"
          onClick={() => handleIngredientSelectFromModal(null)}
        >
          — Ninguno / Limpiar —
        </button>
        {ingredientSearchQuery.trim() && !ingredients.some(
          ing => (ing.name || '').toLowerCase() === ingredientSearchQuery.trim().toLowerCase()
        ) && (
          <button
            type="button"
            className="ingredient-search-item ingredient-search-item-new"
            onClick={handleCreateNewIngredient}
            disabled={isCreatingIngredient}
          >
            {isCreatingIngredient ? 'Creando...' : `+ Agregar «${ingredientSearchQuery.trim()}» como nuevo ingrediente`}
          </button>
        )}
        {filteredIngredients.length === 0 && !ingredientSearchQuery.trim() ? null : filteredIngredients.length === 0 ? (
          <p className="form-hint">No hay ingredientes que coincidan.</p>
        ) : (
          filteredIngredients.map(ingredient => (
            <button
              key={ingredient.id}
              type="button"
              className="ingredient-search-item"
              onClick={() => handleIngredientSelectFromModal(ingredient)}
            >
              {ingredient.code ? `${ingredient.code} – ` : ''}{ingredient.name}
            </button>
          ))
        )}
      </div>
    </Modal>
    </>
  );
};

export default MealForm;
