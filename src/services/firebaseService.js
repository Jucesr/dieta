import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection names
const COLLECTIONS = {
  MEALS: 'meals',
  INGREDIENTS: 'ingredients',
  MEAL_INGREDIENTS: 'mealIngredients',
  SIDES: 'sides',
  SIDE_INGREDIENTS: 'sideIngredients',
  SCHEDULED_MEALS: 'scheduledMeals',
  DELIVERY_RULES: 'deliveryRules',
  SETTINGS: 'settings'
};

// Generic CRUD operations
const createDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return { id: docRef.id, ...data };
};

const updateDocument = async (collectionName, id, data) => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
  return { id, ...data };
};

const deleteDocument = async (collectionName, id) => {
  await deleteDoc(doc(db, collectionName, id));
};

const getDocument = async (collectionName, id) => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

const getAllDocuments = async (collectionName, orderByField = 'name') => {
  const q = query(collection(db, collectionName), orderBy(orderByField));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Meals
export const mealsService = {
  getAll: () => getAllDocuments(COLLECTIONS.MEALS),
  getById: (id) => getDocument(COLLECTIONS.MEALS, id),
  create: (data) => createDocument(COLLECTIONS.MEALS, data),
  update: (id, data) => updateDocument(COLLECTIONS.MEALS, id, data),
  delete: async (id) => {
    // Also delete associated meal ingredients
    const ingredients = await mealIngredientsService.getByMealId(id);
    const batch = writeBatch(db);
    ingredients.forEach(ing => {
      batch.delete(doc(db, COLLECTIONS.MEAL_INGREDIENTS, ing.id));
    });
    batch.delete(doc(db, COLLECTIONS.MEALS, id));
    await batch.commit();
  },
  getByLabels: async (labels) => {
    const q = query(
      collection(db, COLLECTIONS.MEALS),
      where('labels', 'array-contains-any', labels)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  incrementUseCount: async (id) => {
    const meal = await getDocument(COLLECTIONS.MEALS, id);
    if (meal) {
      await updateDocument(COLLECTIONS.MEALS, id, { 
        useCount: (meal.useCount || 0) + 1 
      });
    }
  }
};

// Ingredients
export const ingredientsService = {
  getAll: () => getAllDocuments(COLLECTIONS.INGREDIENTS),
  getById: (id) => getDocument(COLLECTIONS.INGREDIENTS, id),
  create: (data) => createDocument(COLLECTIONS.INGREDIENTS, data),
  update: (id, data) => updateDocument(COLLECTIONS.INGREDIENTS, id, data),
  delete: (id) => deleteDocument(COLLECTIONS.INGREDIENTS, id)
};

// Meal Ingredients
export const mealIngredientsService = {
  getByMealId: async (mealId) => {
    const q = query(
      collection(db, COLLECTIONS.MEAL_INGREDIENTS),
      where('mealId', '==', mealId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  create: (data) => createDocument(COLLECTIONS.MEAL_INGREDIENTS, data),
  update: (id, data) => updateDocument(COLLECTIONS.MEAL_INGREDIENTS, id, data),
  delete: (id) => deleteDocument(COLLECTIONS.MEAL_INGREDIENTS, id),
  batchUpdate: async (mealId, ingredients) => {
    const batch = writeBatch(db);
    
    // Delete existing
    const existing = await mealIngredientsService.getByMealId(mealId);
    existing.forEach(ing => {
      batch.delete(doc(db, COLLECTIONS.MEAL_INGREDIENTS, ing.id));
    });
    
    // Add new
    for (const ing of ingredients) {
      const docRef = doc(collection(db, COLLECTIONS.MEAL_INGREDIENTS));
      batch.set(docRef, {
        ...ing,
        mealId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    
    await batch.commit();
  }
};

// Sides
export const sidesService = {
  getAll: () => getAllDocuments(COLLECTIONS.SIDES),
  getById: (id) => getDocument(COLLECTIONS.SIDES, id),
  create: (data) => createDocument(COLLECTIONS.SIDES, data),
  update: (id, data) => updateDocument(COLLECTIONS.SIDES, id, data),
  delete: async (id) => {
    // Also delete associated side ingredients
    const ingredients = await sideIngredientsService.getBySideId(id);
    const batch = writeBatch(db);
    ingredients.forEach(ing => {
      batch.delete(doc(db, COLLECTIONS.SIDE_INGREDIENTS, ing.id));
    });
    batch.delete(doc(db, COLLECTIONS.SIDES, id));
    await batch.commit();
  }
};

// Side Ingredients
export const sideIngredientsService = {
  getBySideId: async (sideId) => {
    const q = query(
      collection(db, COLLECTIONS.SIDE_INGREDIENTS),
      where('sideId', '==', sideId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  create: (data) => createDocument(COLLECTIONS.SIDE_INGREDIENTS, data),
  update: (id, data) => updateDocument(COLLECTIONS.SIDE_INGREDIENTS, id, data),
  delete: (id) => deleteDocument(COLLECTIONS.SIDE_INGREDIENTS, id),
  batchUpdate: async (sideId, ingredients) => {
    const batch = writeBatch(db);
    
    // Delete existing
    const existing = await sideIngredientsService.getBySideId(sideId);
    existing.forEach(ing => {
      batch.delete(doc(db, COLLECTIONS.SIDE_INGREDIENTS, ing.id));
    });
    
    // Add new
    for (const ing of ingredients) {
      const docRef = doc(collection(db, COLLECTIONS.SIDE_INGREDIENTS));
      batch.set(docRef, {
        ...ing,
        sideId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    
    await batch.commit();
  }
};

// Scheduled Meals
export const scheduledMealsService = {
  getByDateRange: async (startDate, endDate) => {
    const q = query(
      collection(db, COLLECTIONS.SCHEDULED_MEALS),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  getByDate: async (date) => {
    const q = query(
      collection(db, COLLECTIONS.SCHEDULED_MEALS),
      where('date', '==', date)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  create: (data) => createDocument(COLLECTIONS.SCHEDULED_MEALS, data),
  update: (id, data) => updateDocument(COLLECTIONS.SCHEDULED_MEALS, id, data),
  delete: (id) => deleteDocument(COLLECTIONS.SCHEDULED_MEALS, id),
  deleteByDate: async (date) => {
    const meals = await scheduledMealsService.getByDate(date);
    const batch = writeBatch(db);
    meals.forEach(meal => {
      batch.delete(doc(db, COLLECTIONS.SCHEDULED_MEALS, meal.id));
    });
    await batch.commit();
  },
  batchCreate: async (meals) => {
    const batch = writeBatch(db);
    const createdMeals = [];
    
    for (const meal of meals) {
      const docRef = doc(collection(db, COLLECTIONS.SCHEDULED_MEALS));
      const mealData = {
        ...meal,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      batch.set(docRef, mealData);
      createdMeals.push({ id: docRef.id, ...mealData });
    }
    
    await batch.commit();
    return createdMeals;
  }
};

// Delivery Rules
export const deliveryRulesService = {
  getAll: async () => {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.DELIVERY_RULES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  create: (data) => createDocument(COLLECTIONS.DELIVERY_RULES, data),
  update: (id, data) => updateDocument(COLLECTIONS.DELIVERY_RULES, id, data),
  delete: (id) => deleteDocument(COLLECTIONS.DELIVERY_RULES, id),
  getByDayAndMealTime: async (dayOfWeek, mealTime) => {
    const q = query(
      collection(db, COLLECTIONS.DELIVERY_RULES),
      where('dayOfWeek', '==', dayOfWeek),
      where('mealTime', '==', mealTime),
      where('enabled', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// Settings
export const settingsService = {
  get: async (key) => {
    const docRef = doc(db, COLLECTIONS.SETTINGS, key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return null;
  },
  set: async (key, value) => {
    const docRef = doc(db, COLLECTIONS.SETTINGS, key);
    await updateDoc(docRef, { value, updatedAt: Timestamp.now() }).catch(async () => {
      // Document doesn't exist, create it
      await addDoc(collection(db, COLLECTIONS.SETTINGS), {
        key,
        value,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });
  }
};
