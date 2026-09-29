import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { INGREDIENT_CATEGORIES, getCategoryLabel } from '../config/ingredientCategories';
import {
  EMPTY_NUTRITION_FORM,
  NUTRITION_FIELDS,
  WEIGHT_UNIT_OPTIONS,
  formToNutrition,
  formatUnitWeight,
  kcalFromMacros,
  nutritionSummary,
  nutritionToForm,
  rowsToUnitWeights,
  sugarExceedsCarbs,
  unitWeightsToRows,
} from '../models/nutrition';
import './IngredientsPage.css';

const IngredientsPage = () => {
  const { 
    ingredients, 
    meals,
    mealIngredients,
    loading, 
    createIngredient, 
    updateIngredient, 
    deleteIngredient,
    showToast
  } = useApp();

  // Helper function to check if ingredient is used in any meal or side
  const getIngredientUsage = (ingredientName) => {
    const usedInMeals = [];
    const target = ingredientName?.toLowerCase();

    Object.entries(mealIngredients).forEach(([mealId, ings]) => {
      if (ings.some(ing => ing.ingredientName?.toLowerCase() === target)) {
        usedInMeals.push(mealId);
      }
    });

    meals.forEach(meal => {
      const usedAsSide = meal.sides?.some(side => side.ingredientName?.toLowerCase() === target);
      if (usedAsSide && !usedInMeals.includes(meal.id)) {
        usedInMeals.push(meal.id);
      }
    });
    
    return { usedInMeals, isUsed: usedInMeals.length > 0 };
  };

  const [showForm, setShowForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [search, setSearch] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formNutrition, setFormNutrition] = useState(EMPTY_NUTRITION_FORM);
  const [formUnitWeights, setFormUnitWeights] = useState([]);
  const [nutritionError, setNutritionError] = useState('');

  const formKcal = kcalFromMacros(formNutrition);

  const filteredIngredients = useMemo(() => {
    let filtered = ingredients;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(i => 
        i.name?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [ingredients, search]);

  const resetForm = () => {
    setFormName('');
    setFormCategoryId('');
    setFormNutrition(EMPTY_NUTRITION_FORM);
    setFormUnitWeights([]);
    setNutritionError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingIngredient(null);
    setShowForm(true);
  };

  const handleOpenEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormName(ingredient.name || '');
    setFormCategoryId(ingredient.categoryId || '');
    setFormNutrition(nutritionToForm(ingredient.nutritionPer100g));
    setFormUnitWeights(unitWeightsToRows(ingredient.unitWeights));
    setNutritionError('');
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingIngredient(null);
    resetForm();
  };

  const handleNutritionChange = (key, value) => {
    setFormNutrition((prev) => ({ ...prev, [key]: value }));
    setNutritionError('');
  };

  const handleAddUnitWeight = () => {
    const used = new Set(formUnitWeights.map((row) => row.unit));
    const unit = WEIGHT_UNIT_OPTIONS.find((option) => !used.has(option)) || WEIGHT_UNIT_OPTIONS[0];
    setFormUnitWeights((prev) => [
      ...prev,
      { id: crypto.randomUUID(), unit, grams: '' },
    ]);
  };

  const handleUnitWeightChange = (id, field, value) => {
    setFormUnitWeights((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveUnitWeight = (id) => {
    setFormUnitWeights((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formName.trim()) return;

    const nutritionPer100g = formToNutrition(formNutrition);
    if (sugarExceedsCarbs(nutritionPer100g)) {
      setNutritionError('El azúcar no puede ser mayor que los carbohidratos.');
      return;
    }
    
    const payload = {
      name: formName.trim(),
      nutritionPer100g,
      unitWeights: rowsToUnitWeights(formUnitWeights),
    };
    if (formCategoryId) payload.categoryId = formCategoryId;
    else if (editingIngredient) payload.categoryId = null; // clear category when editing
    if (editingIngredient) {
      await updateIngredient(editingIngredient.id, payload);
    } else {
      await createIngredient(payload);
    }
    
    handleClose();
  };

  const handleDelete = async (ingredient) => {
    const usage = getIngredientUsage(ingredient.name);
    
    if (usage.isUsed) {
      const mealCount = usage.usedInMeals.length;
      const mealCodes = usage.usedInMeals
        .map(mealId => meals.find(m => m.id === mealId)?.code)
        .filter(Boolean)
        .join(', ');
      const message = `No se puede eliminar "${ingredient.name}" porque está siendo usado en ${mealCount} comida${mealCount > 1 ? 's' : ''} (${mealCodes})`;
      showToast(message, 'error');
      return;
    }
    
    if (confirm(`¿Eliminar "${ingredient.name}"?`)) {
      await deleteIngredient(ingredient.id);
    }
  };

  if (loading) {
    return <Loading text="Cargando ingredientes..." />;
  }

  return (
    <div className="ingredients-page">
      <header className="section-header">
        <h1 className="section-title">Ingredientes</h1>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Nuevo
        </button>
      </header>

      <div className="ingredients-search-wrap">
        <input
          type="text"
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ingredients-search"
        />
        <span className="ingredients-count">
          {filteredIngredients.length} ingrediente{filteredIngredients.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredIngredients.length === 0 ? (
        <EmptyState
          icon="🥕"
          text="No hay ingredientes"
          action={
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              Crear primer ingrediente
            </button>
          }
        />
      ) : (
        <div className="ingredients-grid">
          {filteredIngredients.map(ingredient => {
            const summary = nutritionSummary(ingredient.nutritionPer100g);
            return (
            <div key={ingredient.id} className="ingredient-card">
              <div className="ingredient-card-main">
                <span className="ingredient-name">{ingredient.name}</span>
                {ingredient.categoryId && (
                  <span className="ingredient-category">{getCategoryLabel(ingredient.categoryId)}</span>
                )}
                {summary && (
                  <span className="ingredient-nutrition">{summary}</span>
                )}
                {Object.entries(ingredient.unitWeights || {}).map(([unit, grams]) => {
                  const label = formatUnitWeight(unit, grams);
                  return label ? (
                    <span key={unit} className="ingredient-unit-weight">{label}</span>
                  ) : null;
                })}
              </div>
              <div className="ingredient-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleOpenEdit(ingredient)}
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handleDelete(ingredient)}
                >
                  🗑️
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={handleClose}
        title={editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingIngredient ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Pollo, Tomate, Arroz..."
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
            >
              <option value="">Sin categoría</option>
              {INGREDIENT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Por 100 g</label>
            <div className="nutrition-grid">
              {NUTRITION_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="nutrition-field-label" htmlFor={`nutrition-${field.key}`}>
                    {field.label}
                  </label>
                  <input
                    id={`nutrition-${field.key}`}
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="—"
                    value={formNutrition[field.key]}
                    onChange={(e) => handleNutritionChange(field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className="nutrition-hint">
              El azúcar ya va dentro de los carbohidratos. Las kcal usan proteína, carbohidratos y grasa.
            </p>
            {formKcal != null && (
              <p className="nutrition-kcal">{formKcal} kcal / 100 g</p>
            )}
            {nutritionError && (
              <p className="form-error">{nutritionError}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Peso por unidad</label>
            <p className="nutrition-hint">
              Gramos que pesa 1 pieza, cucharada u otra unidad. Gramos no necesitan conversión.
            </p>
            {formUnitWeights.map((row) => {
              const usedElsewhere = new Set(
                formUnitWeights.filter((other) => other.id !== row.id).map((other) => other.unit)
              );
              return (
                <div key={row.id} className="unit-weight-row">
                  <select
                    value={row.unit}
                    onChange={(e) => handleUnitWeightChange(row.id, 'unit', e.target.value)}
                    aria-label="Unidad"
                  >
                    {WEIGHT_UNIT_OPTIONS.map((unit) => (
                      <option key={unit} value={unit} disabled={usedElsewhere.has(unit)}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    placeholder="gramos"
                    aria-label={`Gramos por ${row.unit}`}
                    value={row.grams}
                    onChange={(e) => handleUnitWeightChange(row.id, 'grams', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => handleRemoveUnitWeight(row.id)}
                    aria-label="Quitar unidad"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleAddUnitWeight}
              disabled={formUnitWeights.length >= WEIGHT_UNIT_OPTIONS.length}
            >
              + Unidad
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IngredientsPage;
