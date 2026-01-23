import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import WeekView from '../components/calendar/WeekView';
import DayMeals from '../components/calendar/DayMeals';
import MealPicker from '../components/calendar/MealPicker';
import Loading from '../components/ui/Loading';
import { pickMeal } from '../services/mealPickerService';
import './CalendarPage.css';

const CalendarPage = () => {
  const {
    loading,
    meals,
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
    deleteScheduledMeal
  } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [addingMealTime, setAddingMealTime] = useState(null);

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

  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setShowMealPicker(true);
  };

  const handleDeleteMeal = async (meal) => {
    if (confirm('¿Eliminar esta comida?')) {
      await deleteScheduledMeal(meal.id);
    }
  };

  const handleMealSelect = async (newMeal) => {
    if (editingMeal) {
      await updateScheduledMeal(editingMeal.id, {
        mealId: newMeal.id,
        mealName: newMeal.name,
        selectedSideId: newMeal.sideIds?.[0] || null
      });
      setEditingMeal(null);
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

  const handleAddMeal = (mealTime) => {
    setAddingMealTime(mealTime);
    setEditingMeal(null);
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
        onDeleteMeal={handleDeleteMeal}
        onAddMeal={handleAddMeal}
        onRandomMeal={handleRandomMeal}
        mealTimes={mealTimes}
      />

      <MealPicker
        isOpen={showMealPicker}
        onClose={() => {
          setShowMealPicker(false);
          setEditingMeal(null);
          setAddingMealTime(null);
        }}
        onSelect={handleMealSelect}
        mealTime={editingMeal?.mealTime || addingMealTime}
        currentMealId={editingMeal?.mealId}
      />
    </div>
  );
};

export default CalendarPage;
