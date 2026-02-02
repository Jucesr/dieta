import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Collection names (subcollections under users/{userId}/)
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

function getUserId() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Must be authenticated to access Firestore');
  return uid;
}

function userCollection(collectionName) {
  return collection(db, 'users', getUserId(), collectionName);
}

function userDoc(collectionName, id) {
  return doc(db, 'users', getUserId(), collectionName, id);
}

// Generic CRUD operations (user-scoped)
const createDocument = async (collectionName, data) => {
  const docRef = await addDoc(userCollection(collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return { id: docRef.id, ...data };
};

const updateDocument = async (collectionName, id, data) => {
  const docRef = userDoc(collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
  return { id, ...data };
};

const deleteDocument = async (collectionName, id) => {
  await deleteDoc(userDoc(collectionName, id));
};

const getDocument = async (collectionName, id) => {
  const docRef = userDoc(collectionName, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

const getAllDocuments = async (collectionName, orderByField = 'name') => {
  const q = query(userCollection(collectionName), orderBy(orderByField));
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
      batch.delete(userDoc(COLLECTIONS.MEAL_INGREDIENTS, ing.id));
    });
    batch.delete(userDoc(COLLECTIONS.MEALS, id));
    await batch.commit();
  },
  getByLabels: async (labels) => {
    const q = query(
      userCollection(COLLECTIONS.MEALS),
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
  delete: (id) => deleteDocument(COLLECTIONS.INGREDIENTS, id),
  findByName: async (name) => {
    const q = query(
      userCollection(COLLECTIONS.INGREDIENTS),
      where('name', '==', name)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  },
  findOrCreate: async (name) => {
    // Try to find existing ingredient by name
    const existing = await ingredientsService.findByName(name);
    if (existing) {
      return existing;
    }
    // Create new ingredient
    return createDocument(COLLECTIONS.INGREDIENTS, { name });
  },
  bulkFindOrCreate: async (names) => {
    // Get unique names
    const uniqueNames = [...new Set(names.filter(n => n && n.trim()))];
    
    // Get all existing ingredients
    const allIngredients = await ingredientsService.getAll();
    const existingByName = {};
    allIngredients.forEach(ing => {
      existingByName[ing.name.toLowerCase()] = ing;
    });
    
    // Create missing ingredients
    const results = {};
    const batch = writeBatch(db);
    const toCreate = [];
    
    for (const name of uniqueNames) {
      const normalizedName = name.trim();
      const existing = existingByName[normalizedName.toLowerCase()];
      if (existing) {
        results[normalizedName] = existing;
      } else {
        const docRef = doc(userCollection(COLLECTIONS.INGREDIENTS));
        const data = {
          name: normalizedName,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        batch.set(docRef, data);
        toCreate.push({ id: docRef.id, name: normalizedName, docRef, data });
      }
    }
    
    if (toCreate.length > 0) {
      await batch.commit();
      toCreate.forEach(item => {
        results[item.name] = { id: item.id, ...item.data };
      });
    }
    
    return results;
  }
};

// Meal Ingredients
export const mealIngredientsService = {
  getAll: async () => {
    const querySnapshot = await getDocs(userCollection(COLLECTIONS.MEAL_INGREDIENTS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  getByMealId: async (mealId) => {
    const q = query(
      userCollection(COLLECTIONS.MEAL_INGREDIENTS),
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
      batch.delete(userDoc(COLLECTIONS.MEAL_INGREDIENTS, ing.id));
    });

    // Add new
    for (const ing of ingredients) {
      const docRef = doc(userCollection(COLLECTIONS.MEAL_INGREDIENTS));
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
      batch.delete(userDoc(COLLECTIONS.SIDE_INGREDIENTS, ing.id));
    });
    batch.delete(userDoc(COLLECTIONS.SIDES, id));
    await batch.commit();
  }
};

// Side Ingredients
export const sideIngredientsService = {
  getAll: async () => {
    const querySnapshot = await getDocs(userCollection(COLLECTIONS.SIDE_INGREDIENTS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  getBySideId: async (sideId) => {
    const q = query(
      userCollection(COLLECTIONS.SIDE_INGREDIENTS),
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
      batch.delete(userDoc(COLLECTIONS.SIDE_INGREDIENTS, ing.id));
    });

    // Add new
    for (const ing of ingredients) {
      const docRef = doc(userCollection(COLLECTIONS.SIDE_INGREDIENTS));
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
      userCollection(COLLECTIONS.SCHEDULED_MEALS),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  getByDate: async (date) => {
    const q = query(
      userCollection(COLLECTIONS.SCHEDULED_MEALS),
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
      batch.delete(userDoc(COLLECTIONS.SCHEDULED_MEALS, meal.id));
    });
    await batch.commit();
  },
  batchCreate: async (meals) => {
    const batch = writeBatch(db);
    const createdMeals = [];
    
    for (const meal of meals) {
      const docRef = doc(userCollection(COLLECTIONS.SCHEDULED_MEALS));
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
    const querySnapshot = await getDocs(userCollection(COLLECTIONS.DELIVERY_RULES));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  create: (data) => createDocument(COLLECTIONS.DELIVERY_RULES, data),
  update: (id, data) => updateDocument(COLLECTIONS.DELIVERY_RULES, id, data),
  delete: (id) => deleteDocument(COLLECTIONS.DELIVERY_RULES, id),
  getByDayAndMealTime: async (dayOfWeek, mealTime) => {
    const q = query(
      userCollection(COLLECTIONS.DELIVERY_RULES),
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
    const docRef = userDoc(COLLECTIONS.SETTINGS, key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().value;
    }
    return null;
  },
  set: async (key, value) => {
    const docRef = userDoc(COLLECTIONS.SETTINGS, key);
    await updateDoc(docRef, { value, updatedAt: Timestamp.now() }).catch(async () => {
      // Document doesn't exist, create it with key as document ID
      await setDoc(docRef, {
        key,
        value,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    });
  }
};
