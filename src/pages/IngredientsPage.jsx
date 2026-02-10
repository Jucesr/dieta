import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { INGREDIENT_CATEGORIES, getCategoryLabel } from '../config/ingredientCategories';
import './IngredientsPage.css';

const IngredientsPage = () => {
  const { 
    ingredients, 
    meals,
    sides,
    mealIngredients,
    sideIngredients,
    loading, 
    createIngredient, 
    updateIngredient, 
    deleteIngredient,
    showToast
  } = useApp();

  // Helper function to check if ingredient is used in any meal or side
  const getIngredientUsage = (ingredientName) => {
    const usedInMeals = [];
    const usedInSides = [];
    
    // Check meal ingredients
    Object.entries(mealIngredients).forEach(([mealId, ings]) => {
      if (ings.some(ing => ing.ingredientName?.toLowerCase() === ingredientName?.toLowerCase())) {
        usedInMeals.push(mealId);
      }
    });
    
    // Check side ingredients
    Object.entries(sideIngredients).forEach(([sideId, ings]) => {
      if (ings.some(ing => ing.ingredientName?.toLowerCase() === ingredientName?.toLowerCase())) {
        usedInSides.push(sideId);
      }
    });
    
    return { usedInMeals, usedInSides, isUsed: usedInMeals.length > 0 || usedInSides.length > 0 };
  };

  const [showForm, setShowForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [search, setSearch] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');

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

  const handleOpenCreate = () => {
    setFormName('');
    setFormCategoryId('');
    setEditingIngredient(null);
    setShowForm(true);
  };

  const handleOpenEdit = (ingredient) => {
    setEditingIngredient(ingredient);
    setFormName(ingredient.name || '');
    setFormCategoryId(ingredient.categoryId || '');
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingIngredient(null);
    setFormName('');
    setFormCategoryId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formName.trim()) return;
    
    const payload = { name: formName.trim() };
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
      const sideCount = usage.usedInSides.length;
      const mealCodes = usage.usedInMeals
        .map(mealId => meals.find(m => m.id === mealId)?.code)
        .filter(Boolean)
        .join(', ');
      const sideCodes = usage.usedInSides
        .map(sideId => sides.find(s => s.id === sideId)?.code)
        .filter(Boolean)
        .join(', ');
      let message = `No se puede eliminar "${ingredient.name}" porque está siendo usado en `;
      
      if (mealCount > 0 && sideCount > 0) {
        message += `${mealCount} comida${mealCount > 1 ? 's' : ''} (${mealCodes}) y ${sideCount} guarnición${sideCount > 1 ? 'es' : ''} (${sideCodes})`;
      } else if (mealCount > 0) {
        message += `${mealCount} comida${mealCount > 1 ? 's' : ''} (${mealCodes})`;
      } else {
        message += `${sideCount} guarnición${sideCount > 1 ? 'es' : ''} (${sideCodes})`;
      }
      
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
          {filteredIngredients.map(ingredient => (
            <div key={ingredient.id} className="ingredient-card">
              <div className="ingredient-card-main">
                <span className="ingredient-name">{ingredient.name}</span>
                {ingredient.categoryId && (
                  <span className="ingredient-category">{getCategoryLabel(ingredient.categoryId)}</span>
                )}
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
          ))}
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
        </form>
      </Modal>
    </div>
  );
};

export default IngredientsPage;
