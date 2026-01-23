import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import { DIFFICULTY_OPTIONS, LABEL_OPTIONS, UNIT_OPTIONS } from '../models/types';
import './MealsPage.css';

// CSV parsing helper
const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.some(v => v.trim())) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
};

// Handle CSV fields with quotes and commas
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
};

const MealsPage = () => {
  const { 
    meals, 
    sides,
    mealIngredients,
    ingredients,
    loading, 
    createMeal, 
    updateMeal, 
    deleteMeal,
    showToast
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  
  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const mealsFileRef = useRef(null);
  const ingredientsFileRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    difficulty: 'Sencillas',
    labels: [],
    sideIds: [],
    preparation: '',
    variations: '',
    preference: ''
  });
  const [formIngredients, setFormIngredients] = useState([]);

  const filteredMeals = useMemo(() => {
    let filtered = meals;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(searchLower) ||
        m.code?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filterDifficulty) {
      filtered = filtered.filter(m => m.difficulty === filterDifficulty);
    }
    
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [meals, search, filterDifficulty]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      difficulty: 'Sencillas',
      labels: [],
      sideIds: [],
      preparation: '',
      variations: '',
      preference: ''
    });
    setFormIngredients([]);
    setEditingMeal(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (meal) => {
    setEditingMeal(meal);
    setFormData({
      code: meal.code || '',
      name: meal.name || '',
      difficulty: meal.difficulty || 'Sencillas',
      labels: meal.labels || [],
      sideIds: meal.sideIds || [],
      preparation: meal.preparation || '',
      variations: meal.variations || '',
      preference: meal.preference || ''
    });
    setFormIngredients(mealIngredients[meal.id] || []);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingMeal) {
      await updateMeal(editingMeal.id, formData, formIngredients);
    } else {
      await createMeal({ ...formData, useCount: 0 }, formIngredients);
    }
    
    handleClose();
  };

  const handleDelete = async (meal) => {
    if (confirm(`¿Eliminar "${meal.name}"?`)) {
      await deleteMeal(meal.id);
    }
  };

  const handleLabelToggle = (label) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label]
    }));
  };

  const handleSideToggle = (sideId) => {
    setFormData(prev => ({
      ...prev,
      sideIds: prev.sideIds.includes(sideId)
        ? prev.sideIds.filter(s => s !== sideId)
        : [...prev.sideIds, sideId]
    }));
  };

  const handleAddIngredient = () => {
    setFormIngredients(prev => [
      ...prev,
      { ingredientName: '', unit: 'gramos', quantity: 0 }
    ]);
  };

  const handleRemoveIngredient = (index) => {
    setFormIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    setFormIngredients(prev => prev.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  // Import handlers
  const handleOpenImport = () => {
    setImportPreview(null);
    setShowImportModal(true);
  };

  const handleCloseImport = () => {
    setShowImportModal(false);
    setImportPreview(null);
    if (mealsFileRef.current) mealsFileRef.current.value = '';
    if (ingredientsFileRef.current) ingredientsFileRef.current.value = '';
  };

  const handleFilesSelected = async () => {
    const mealsFile = mealsFileRef.current?.files[0];
    const ingredientsFile = ingredientsFileRef.current?.files[0];
    
    if (!mealsFile) {
      showToast('Por favor selecciona el archivo de comidas', 'error');
      return;
    }
    
    try {
      // Parse meals CSV
      const mealsText = await mealsFile.text();
      const mealsData = parseCSV(mealsText);
      
      // Parse ingredients CSV if provided
      let ingredientsData = [];
      if (ingredientsFile) {
        const ingredientsText = await ingredientsFile.text();
        ingredientsData = parseCSV(ingredientsText);
      }
      
      // Build preview data
      const preview = {
        meals: mealsData.filter(row => row.Codigo && row.Nombre).map(row => ({
          code: row.Codigo,
          name: row.Nombre,
          difficulty: row.Dificultad || 'Sencillas',
          labels: row.Etiquetas ? row.Etiquetas.split(',').map(l => l.trim()).filter(Boolean) : [],
          preparation: row.Preparacion || '',
          preference: row.Preferencia || '',
          variations: row.Variaciones || '',
          sideIds: row.Sides ? row.Sides.split(';').map(s => s.trim()).filter(Boolean) : [],
          useCount: parseInt(row.Contador) || 0
        })),
        ingredients: ingredientsData
          .filter(row => row['Meal Code'] && row.Nombre)
          .map(row => ({
            mealCode: row['Meal Code'],
            ingredientName: row.Nombre,
            unit: row.Unidad || 'gramos',
            quantity: parseFloat(row.Cantidad) || 0
          }))
      };
      
      setImportPreview(preview);
    } catch (err) {
      console.error('Error parsing CSV:', err);
      showToast('Error al leer los archivos CSV', 'error');
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || importPreview.meals.length === 0) return;
    
    setIsImporting(true);
    let imported = 0;
    let skipped = 0;
    
    try {
      for (const mealData of importPreview.meals) {
        // Check if meal already exists by code
        const existing = meals.find(m => m.code === mealData.code);
        if (existing) {
          skipped++;
          continue;
        }
        
        // Get ingredients for this meal
        const mealIngreds = importPreview.ingredients
          .filter(ing => ing.mealCode === mealData.code)
          .map(ing => ({
            ingredientName: ing.ingredientName,
            unit: ing.unit,
            quantity: ing.quantity
          }));
        
        // Resolve side IDs (they might be codes like S01, S02)
        const resolvedSideIds = mealData.sideIds.map(sideRef => {
          const side = sides.find(s => s.code === sideRef || s.id === sideRef);
          return side?.id || sideRef;
        }).filter(Boolean);
        
        await createMeal({
          ...mealData,
          sideIds: resolvedSideIds
        }, mealIngreds);
        
        imported++;
      }
      
      showToast(`Importadas ${imported} comidas${skipped > 0 ? `, ${skipped} omitidas (ya existían)` : ''}`);
      handleCloseImport();
    } catch (err) {
      console.error('Error importing meals:', err);
      showToast('Error durante la importación', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  if (loading) {
    return <Loading text="Cargando comidas..." />;
  }

  return (
    <div className="meals-page">
      <header className="section-header">
        <h1 className="section-title">Comidas</h1>
        <div className="section-actions">
          <button className="btn btn-secondary" onClick={handleOpenImport}>
            📥 Importar CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            + Nueva
          </button>
        </div>
      </header>

      <div className="meals-filters">
        <input
          type="text"
          placeholder="Buscar comida..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="meals-search"
        />
        <div className="meals-filter-chips">
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
      </div>

      {filteredMeals.length === 0 ? (
        <EmptyState
          icon="🍽️"
          text="No hay comidas"
          action={
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              Crear primera comida
            </button>
          }
        />
      ) : (
        <div className="meals-list">
          {filteredMeals.map(meal => (
            <div key={meal.id} className="meal-list-item">
              <div className="meal-list-info" onClick={() => handleOpenEdit(meal)}>
                <span className="meal-list-code">{meal.code}</span>
                <span className="meal-list-name">{meal.name}</span>
                {meal.difficulty && (
                  <span className={`badge badge-${
                    DIFFICULTY_OPTIONS.find(d => d.value === meal.difficulty)?.color
                  }`}>
                    {meal.difficulty}
                  </span>
                )}
              </div>
              <div className="meal-list-actions">
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleOpenEdit(meal)}
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handleDelete(meal)}
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
        title={editingMeal ? 'Editar Comida' : 'Nueva Comida'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingMeal ? 'Guardar' : 'Crear'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="meal-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: '0 0 100px' }}>
              <label className="form-label">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="C01"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onClick={() => setFormData({ ...formData, difficulty: opt.value })}
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
                  onClick={() => handleLabelToggle(label)}
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
                  onClick={() => handleSideToggle(side.id)}
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
                onClick={handleAddIngredient}
              >
                + Agregar
              </button>
            </div>
            <div className="ingredients-list">
              {formIngredients.map((ing, index) => (
                <div key={index} className="ingredient-row">
                  <input
                    type="text"
                    placeholder="Ingrediente"
                    value={ing.ingredientName}
                    onChange={(e) => handleIngredientChange(index, 'ingredientName', e.target.value)}
                    list="ingredients-datalist"
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
            <datalist id="ingredients-datalist">
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.name} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label className="form-label">Preparación</label>
            <textarea
              value={formData.preparation}
              onChange={(e) => setFormData({ ...formData, preparation: e.target.value })}
              placeholder="Instrucciones de preparación..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Variaciones</label>
            <input
              type="text"
              value={formData.variations}
              onChange={(e) => setFormData({ ...formData, variations: e.target.value })}
              placeholder="Con pollo, con carne de res..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferencia</label>
            <input
              type="text"
              value={formData.preference}
              onChange={(e) => setFormData({ ...formData, preference: e.target.value })}
              placeholder="Julio, Ericka..."
            />
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={handleCloseImport}
        title="Importar Comidas desde CSV"
        footer={
          importPreview ? (
            <>
              <button className="btn btn-secondary" onClick={() => setImportPreview(null)}>
                ← Volver
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmImport}
                disabled={isImporting || importPreview.meals.length === 0}
              >
                {isImporting ? '⏳ Importando...' : `Importar ${importPreview.meals.length} comidas`}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleCloseImport}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleFilesSelected}>
                Vista previa
              </button>
            </>
          )
        }
      >
        {!importPreview ? (
          <div className="import-form">
            <div className="import-info">
              <p>Selecciona los archivos CSV para importar comidas.</p>
              <p className="import-hint">
                <strong>Formato de comidas:</strong> Codigo, Nombre, Dificultad, Etiquetas, Contador, Ingredientes, Preparacion, Preferencia, Variaciones, Sides
              </p>
              <p className="import-hint">
                <strong>Formato de ingredientes:</strong> Meal Code, Nombre, Unidad, Cantidad
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Archivo de Comidas (requerido) *</label>
              <input
                type="file"
                ref={mealsFileRef}
                accept=".csv"
                className="file-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Archivo de Ingredientes (opcional)</label>
              <input
                type="file"
                ref={ingredientsFileRef}
                accept=".csv"
                className="file-input"
              />
            </div>
          </div>
        ) : (
          <div className="import-preview">
            <div className="import-summary">
              <div className="import-stat">
                <span className="import-stat-number">{importPreview.meals.length}</span>
                <span className="import-stat-label">comidas</span>
              </div>
              <div className="import-stat">
                <span className="import-stat-number">{importPreview.ingredients.length}</span>
                <span className="import-stat-label">ingredientes</span>
              </div>
            </div>
            
            <div className="import-preview-list">
              <h4>Comidas a importar:</h4>
              <div className="import-meals-list">
                {importPreview.meals.slice(0, 10).map((meal, index) => (
                  <div key={index} className="import-meal-item">
                    <span className="import-meal-code">{meal.code}</span>
                    <span className="import-meal-name">{meal.name}</span>
                    <span className="badge">{meal.difficulty}</span>
                  </div>
                ))}
                {importPreview.meals.length > 10 && (
                  <p className="import-more">... y {importPreview.meals.length - 10} más</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MealsPage;
