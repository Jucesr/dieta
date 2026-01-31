import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import WeekView from '../components/calendar/WeekView';
import DayMeals from '../components/calendar/DayMeals';
import MealPicker from '../components/calendar/MealPicker';
import MealForm from '../components/forms/MealForm';
import Loading from '../components/ui/Loading';
import Modal from '../components/ui/Modal';
import { pickMeal } from '../services/mealPickerService';
import './CalendarPage.css';

const CalendarPage = () => {
  const {
    loading,
    meals,
    sides,
    mealIngredients,
    scheduledMeals,
    mealTimes,
    deliveryRules,
    selectedDate,
    setSelectedDate,
    loadScheduledMeals,
    generateDayMealPlan,
    generateWeekMealPlan,
    createScheduledMeal,
    updateScheduledMeal,
    deleteScheduledMeal,
    updateMeal
  } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [showMealEditModal, setShowMealEditModal] = useState(false);
  const [editingScheduledMeal, setEditingScheduledMeal] = useState(null);
  const [addingMealTime, setAddingMealTime] = useState(null);
  
  // Full meal edit form state
  const [mealFormData, setMealFormData] = useState({
    code: '',
    name: '',
    difficulty: 'Sencillas',
    labels: [],
    sideIds: [],
    preparation: '',
    variations: '',
    preference: ''
  });
  const [mealFormIngredients, setMealFormIngredients] = useState([]);

  // Load scheduled meals for current week
  const loadWeekMeals = useCallback(async () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    await loadScheduledMeals(
      format(start, 'yyyy-MM-dd'),
      format(end, 'yyyy-MM-dd')
    );
  }, [selectedDate, loadScheduledMeals]);

  useEffect(() => {
    loadWeekMeals();
  }, [loadWeekMeals]);

  const handlePrevWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleGenerateDay = async () => {
    setIsGenerating(true);
    try {
      await generateDayMealPlan(selectedDate);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateWeek = async () => {
    setIsGenerating(true);
    try {
      await generateWeekMealPlan(selectedDate);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditMeal = (scheduledMeal) => {
    // Find the actual meal data
    const meal = meals.find(m => m.id === scheduledMeal.mealId);
    if (!meal) return;
    // Resolve sideIds (pueden ser códigos S01 o ids) a ids para que los chips se marquen
    const resolvedSideIds = (meal.sideIds || []).map(sideRef => {
      const side = sides.find(s => s.code === sideRef || s.id === sideRef);
      return side?.id || sideRef;
    }).filter(Boolean);
    setEditingScheduledMeal(scheduledMeal);
    setMealFormData({
      code: meal.code || '',
      name: meal.name || '',
      difficulty: meal.difficulty || 'Sencillas',
      labels: meal.labels || [],
      sideIds: resolvedSideIds,
      preparation: meal.preparation || '',
      variations: meal.variations || '',
      preference: meal.preference || ''
    });
    setMealFormIngredients(mealIngredients[meal.id] || []);
    setShowMealEditModal(true);
  };

  const handleQuickChangeMeal = (meal) => {
    setEditingScheduledMeal(meal);
    setShowMealPicker(true);
  };

  const handleDeleteMeal = async (meal) => {
    if (confirm('¿Eliminar esta comida?')) {
      await deleteScheduledMeal(meal.id);
    }
  };

  const handleMealSelect = async (newMeal) => {
    if (editingScheduledMeal) {
      await updateScheduledMeal(editingScheduledMeal.id, {
        mealId: newMeal.id,
        mealName: newMeal.name,
        selectedSideId: newMeal.sideIds?.[0] || null
      });
      setEditingScheduledMeal(null);
    } else if (addingMealTime) {
      // Creating a new meal for this slot
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await createScheduledMeal({
        date: dateStr,
        mealTime: addingMealTime,
        mealId: newMeal.id,
        mealName: newMeal.name,
        selectedSideId: newMeal.sideIds?.[0] || null,
        servings: 1,
        isDelivery: false,
        completed: false
      });
      setAddingMealTime(null);
    }
  };

  const handleSaveMealEdit = async () => {
    if (!editingScheduledMeal) return;
    
    const meal = meals.find(m => m.id === editingScheduledMeal.mealId);
    if (!meal) return;
    
    // Update the meal definition
    await updateMeal(meal.id, mealFormData, mealFormIngredients);
    
    // Update the scheduled meal name if it changed
    if (mealFormData.name !== meal.name) {
      await updateScheduledMeal(editingScheduledMeal.id, {
        mealName: mealFormData.name
      });
    }
    
    setShowMealEditModal(false);
    setEditingScheduledMeal(null);
  };

  const handleCloseMealEdit = () => {
    setShowMealEditModal(false);
    setEditingScheduledMeal(null);
  };

  const handleLabelToggle = (label) => {
    setMealFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label]
    }));
  };

  const handleSideToggle = (sideId) => {
    setMealFormData(prev => ({
      ...prev,
      sideIds: prev.sideIds.includes(sideId)
        ? prev.sideIds.filter(s => s !== sideId)
        : [...prev.sideIds, sideId]
    }));
  };

  const handleAddIngredient = () => {
    setMealFormIngredients(prev => [
      ...prev,
      { ingredientName: '', unit: 'gramos', quantity: 0 }
    ]);
  };

  const handleRemoveIngredient = (index) => {
    setMealFormIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, field, value) => {
    setMealFormIngredients(prev => prev.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  const handleAddMeal = (mealTime) => {
    setAddingMealTime(mealTime);
    setEditingScheduledMeal(null);
    setShowMealPicker(true);
  };

  const handleRandomMeal = async (mealTime) => {
    setIsGenerating(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const picked = pickMeal({
        meals,
        mealTime,
        date: dateStr,
        recentMeals: scheduledMeals,
        deliveryRules,
        config: {
          avoidRepetition: true,
          repetitionWindow: 7,
          respectPreferences: true,
          balanceDifficulty: true
        }
      });
      
      if (picked) {
        await createScheduledMeal({
          date: dateStr,
          mealTime,
          mealId: picked.id,
          mealName: picked.name,
          selectedSideId: picked.sideIds?.[0] || null,
          servings: 1,
          isDelivery: picked.isDelivery || false,
          completed: false
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  if (loading) {
    return <Loading text="Cargando plan de comidas..." />;
  }

  return (
    <div className="calendar-page">
      <header className="calendar-header">
        <h1 className="calendar-title">Plan de Comidas</h1>
        <div className="calendar-nav">
          <button className="btn btn-icon btn-secondary" onClick={handlePrevWeek}>
            ←
          </button>
          <button className="btn btn-sm btn-secondary" onClick={handleToday}>
            Hoy
          </button>
          <button className="btn btn-icon btn-secondary" onClick={handleNextWeek}>
            →
          </button>
        </div>
      </header>

      <div className="calendar-week-label">
        {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
      </div>

      <WeekView
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        scheduledMeals={scheduledMeals}
        mealTimes={mealTimes}
      />

      <div className="calendar-actions">
        <button 
          className="btn btn-primary"
          onClick={handleGenerateDay}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳' : '✨'} Generar Día
        </button>
        <button 
          className="btn btn-secondary"
          onClick={handleGenerateWeek}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳' : '📅'} Generar Semana
        </button>
      </div>

      <DayMeals
        date={selectedDate}
        scheduledMeals={scheduledMeals}
        onEditMeal={handleEditMeal}
        onQuickChangeMeal={handleQuickChangeMeal}
        onDeleteMeal={handleDeleteMeal}
        onAddMeal={handleAddMeal}
        onRandomMeal={handleRandomMeal}
        mealTimes={mealTimes}
      />

      <MealPicker
        isOpen={showMealPicker}
        onClose={() => {
          setShowMealPicker(false);
          setEditingScheduledMeal(null);
          setAddingMealTime(null);
        }}
        onSelect={handleMealSelect}
        mealTime={editingScheduledMeal?.mealTime || addingMealTime}
        currentMealId={editingScheduledMeal?.mealId}
      />

      <Modal
        isOpen={showMealEditModal}
        onClose={handleCloseMealEdit}
        title="Editar Comida Completa"
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseMealEdit}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSaveMealEdit}>
              💾 Guardar cambios
            </button>
          </>
        }
      >
        <MealForm
          formData={mealFormData}
          formIngredients={mealFormIngredients}
          onFormDataChange={setMealFormData}
          onIngredientChange={handleIngredientChange}
          onAddIngredient={handleAddIngredient}
          onRemoveIngredient={handleRemoveIngredient}
          onLabelToggle={handleLabelToggle}
          onSideToggle={handleSideToggle}
          onSubmit={(e) => { e.preventDefault(); handleSaveMealEdit(); }}
          datalistId="meal-edit-ingredients-datalist"
        />
      </Modal>
    </div>
  );
};

export default CalendarPage;
