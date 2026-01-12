function onOpen() {
   SpreadsheetApp.getUi()
      .createMenu("Meal Planner")
      .addItem("Generate 1 Week (week N tab)", "generateOneWeekTab")
      .addItem("Regenerate Shopping Lists", "regenerateShoppingLists")
      .addToUi();
}

const mealPreparation = {
    'sencilla': 'sencilla',
    'elaborada': 'elaborada',
    'no casera': 'no casera',
}

const mealTime = {
    'desayuno': 'desayuno',
    'comida': 'comida',
    'cena': 'cena',
    'snack': 'snack',
}

const DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

function generateOneWeekTab() {

   const weekNumber = readUserInput();
   const startDate = getStartOfTheWeek(weekNumber);
   console.log({
      weekNumber,
      startDate,
   })

   // Read Meals table
   const meals = readMealsSheet();

   if (meals.length === 0) throw new Error("No valid meals found (need non-empty code + name).");

   const weekPlan = generateWeekPlan(meals, startDate);
   
   // Convert to spreadsheet format
   const rows = convertWeekPlanToRows(weekPlan);

   // Generate shopping lists
   const ingredients = processIngredientsSheet(readIngredientsSheet());
   const shoppingListByWeek = generateShoppingListAggregated(weekPlan, ingredients);
   const shoppingListByDay = generateShoppingListGroupedByDay(weekPlan, ingredients);

   writeOnSheet(weekNumber, rows, shoppingListByWeek, shoppingListByDay);
}

function regenerateShoppingLists() {
   const weekNumber = readUserInput();
   const ss = SpreadsheetApp.getActive();
   const tabName = `week ${weekNumber}`;
   const planSheet = ss.getSheetByName(tabName);
   
   if (!planSheet) {
      SpreadsheetApp.getUi().alert(`Sheet "${tabName}" not found. Please generate a week plan first.`);
      return;
   }
   
   // Read the meal plan table (first 4 rows: header + 3 meal types)
   const mealPlanData = planSheet.getRange(1, 1, 4, 15).getValues();
   
   // Convert sheet data to weekPlan format
   const weekPlan = convertSheetRowsToWeekPlan(mealPlanData);
   
   // Generate shopping lists
   const ingredients = processIngredientsSheet(readIngredientsSheet());
   const shoppingListByWeek = generateShoppingListAggregated(weekPlan, ingredients);
   const shoppingListByDay = generateShoppingListGroupedByDay(weekPlan, ingredients);
   
   // Clear everything below row 4 (the meal plan table)
   const lastRow = planSheet.getMaxRows();
   if (lastRow > 4) {
      planSheet.deleteRows(5, lastRow - 4);
   }
   
   // Append the new shopping lists
   let currentRow = 6; // Start 2 rows below the meal plan (row 4 + 2)
   currentRow = appendShoppingListByWeek(planSheet, currentRow, weekNumber, shoppingListByWeek);
   currentRow += 2; // Add space
   currentRow = appendShoppingListByDay(planSheet, currentRow, weekNumber, shoppingListByDay);
   
   SpreadsheetApp.getUi().alert(`Shopping lists regenerated for week ${weekNumber}!`);
}

// Logic functions

function getStartOfTheWeek(weekNumber) {
   const currentYear = new Date().getFullYear();
   const startDate = new Date(currentYear, 0, 1);
   const dayOfWeek = startDate.getDay();
   const daysToAdd = (weekNumber - 1) * 7 + (dayOfWeek === 0 ? 7 : dayOfWeek);
   startDate.setDate(startDate.getDate() + daysToAdd);
   return startDate;
}

const getDateString = (startDate, dayIndex) => {
   
   const date = parseDate(startDate);
   date.setDate(date.getDate() + dayIndex);
   const day = String(date.getDate()).padStart(2, "0");
   const month = String(date.getMonth() + 1).padStart(2, "0");
   const year = date.getFullYear();
   return `${day}/${month}/${year}`;
  
};
// Get day label with Spanish day name + day number
const getDayLabel = (startDate, dayIndex) => {
   
   const date = parseDate(startDate);
   date.setDate(date.getDate() + dayIndex);
   const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
   const dayNumber = date.getDate();
   // Map JavaScript's getDay() (0=Sunday) to our DAYS array (0=Lunes/Monday)
   const spanishDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
   return `${DAYS[spanishDayIndex]} ${dayNumber}`;
   
};

// Parse date from DD/MM/YYYY format
   const parseDate = (dateStr) => {
      // check if it needs to be parsed
      if (dateStr instanceof Date) return new Date(dateStr);
      const parts = dateStr.split('/');
      if (parts.length === 3) {
         // DD/MM/YYYY format
         return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return new Date(dateStr);
   };

function readUserInput () {
    const ui = SpreadsheetApp.getUi();
   // Ask for week number (used only for tab name)
   const weekPrompt = ui.prompt(
      "Generate Weekly Plan",
      'Enter week number (used for tab name like "week 1"):',
      ui.ButtonSet.OK_CANCEL
   );
   if (weekPrompt.getSelectedButton() !== ui.Button.OK) return;

   const weekNum = parseInt(weekPrompt.getResponseText(), 10);
   if (!Number.isFinite(weekNum) || weekNum < 1) {
      ui.alert("Please enter a valid week number (>= 1).");
      return;
   }

   return weekNum;
}

function generateWeekPlan(meals, startDate = null) {
   // Optional: if you tag meals with "desayuno", "comida", "cena", it will try to use those pools
   const breakfasts = filterByTag(meals, [mealTime.desayuno]);
   const lunches = filterByTag(meals, [mealTime.comida]);
   const dinners = filterByTag(meals, [mealTime.cena]);

   const MEAL_TIMES = [mealTime.desayuno, mealTime.comida, mealTime.cena];

   const poolsByMealTime = [
      breakfasts.length ? breakfasts : meals,
      lunches.length ? lunches : meals,
      dinners.length ? dinners : meals,
   ];

   const used = new Set(); // try to avoid repeating the same code in the week if possible
   
   const weekPlan = [];
   
   // For each day of the week
   for (let d = 0; d < DAYS.length; d++) {
      const dayPlan = {
         day: getDateString(startDate, d),
         dayLabel: getDayLabel(startDate, d),
         meals: []
      };

      // For each meal time
      for (let mt = 0; mt < MEAL_TIMES.length; mt++) {
         const pick = pickMeal(poolsByMealTime[mt], meals, used);
         dayPlan.meals.push({
            time: MEAL_TIMES[mt],
            meal: {
               code: pick.code,
               name: pick.name
            }
         });
      }

      weekPlan.push(dayPlan);
   }
   
   return weekPlan;
}

function readMealsSheet(){
    const ss = SpreadsheetApp.getActive();
    const mealsSheetName = "Meals";
    const mealsSheet = ss.getSheetByName(mealsSheetName);
    if (!mealsSheet) throw new Error(`Sheet "${mealsSheetName}" not found.`);

    const values = mealsSheet.getDataRange().getValues();
   if (values.length < 2) throw new Error("No meals found (need headers + at least one row).");

   const headers = values[0].map((h) => String(h).trim().toLowerCase());

   const codeCol = findCol(headers, ["código", "codigo", "code"]);
   const nameCol = findCol(headers, ["nombre", "name", "meal", "platillo"]);
   const tagsCol = findCol(headers, ["etiquetas", "tags", "tag"]); // optional
   const countCol = findCol(headers, ["contador", "count", "cantidad de veces"]);

   if (codeCol === -1) throw new Error('Could not find code column header (e.g., "Código", "Codigo", or "Code").');
   if (nameCol === -1) throw new Error('Could not find name column header (e.g., "Nombre" or "Name").');

   const meals = [];
   for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const code = row[codeCol];
      const name = row[nameCol];
      if (!code || !name) continue;

      const tags = tagsCol !== -1 ? String(row[tagsCol] || "").toLowerCase() : "";
      meals.push({
         code: String(code).trim(),
         name: String(name).trim(),
         tags,
         count: countCol !== -1 ? parseInt(row[countCol] || "0", 10) : 0,
      });
   }
   return meals;
}

function writeOnSheet(weekNum, rows, shoppingListByWeek, shoppingListByDay){
    const ss = SpreadsheetApp.getActive();

    const tabName = `week ${weekNum}`;
    let planSheet = ss.getSheetByName(tabName);
    if (!planSheet) planSheet = ss.insertSheet(tabName);
    planSheet.clear();

   // Write meal plan
   const range = planSheet.getRange(1, 1, rows.length, rows[0].length);
   range.setValues(rows);

   console.log(rows);

   // Merge day headers (row 1)
   // Lunes starts at col 2 (B), each day spans 2 cols
   for (let i = 0; i < DAYS.length; i++) {
      const startCol = 2 + i * 2;
      planSheet.getRange(1, startCol, 1, 2).merge();
      planSheet.getRange(1, startCol).setHorizontalAlignment("center");
   }

   // Formatting meal plan
   planSheet.getRange(1, 1, 1, 15).setFontWeight("bold").setHorizontalAlignment("center");
   planSheet.getRange(2, 1, 3, 1).setFontWeight("bold"); // Desayuno/Comida/Cena
   range.setBorder(true, true, true, true, true, true);
   range.setWrap(true);
   planSheet.autoResizeColumns(1, 15);

   // Optional row heights for readability
   planSheet.setRowHeight(1, 28);
   planSheet.setRowHeights(2, 3, 40);

   // Add shopping lists below the meal plan
   let currentRow = rows.length + 2; // Start 2 rows below the meal plan

   // Add shopping list by week
   currentRow = appendShoppingListByWeek(planSheet, currentRow, weekNum, shoppingListByWeek);
   
   // Add some space
   currentRow += 2;
   
   // Add shopping list by day
   currentRow = appendShoppingListByDay(planSheet, currentRow, weekNum, shoppingListByDay);
}

function appendShoppingListByWeek(sheet, startRow, weekNum, shoppingList) {
   const rows = [];
   
   // Title
   rows.push([`Lista de Compras - Semana ${weekNum} (Toda la Semana)`]);
   rows.push([""]);
   
   if (shoppingList.length === 0) {
      rows.push(["No hay ingredientes registrados"]);
   } else {
      for (const ing of shoppingList) {
         const quantityStr = ing.quantity > 0 
            ? `${ing.quantity}${ing.unit}` 
            : ing.unit || "al gusto";
         rows.push([`- ${quantityStr} ${ing.name}`]);
      }
   }
   
   // Write to sheet
   const range = sheet.getRange(startRow, 1, rows.length, 1);
   range.setValues(rows);
   
   // Format title
   sheet.getRange(startRow, 1).setFontWeight("bold").setFontSize(14);
   
   return startRow + rows.length;
}

function appendShoppingListByDay(sheet, startRow, weekNum, shoppingByDay) {
   const rows = [];
   
   // Title
   rows.push([`Lista de Compras - Semana ${weekNum} (Por Día)`]);
   rows.push([""]);
   
   for (const day of shoppingByDay) {
      // Day header
      rows.push([day.dayLabel]);
      rows.push([""]);
      
      if (day.ingredients.length === 0) {
         rows.push(["No hay ingredientes registrados para este día"]);
      } else {
         for (const ing of day.ingredients) {
            const quantityStr = ing.quantity > 0 
               ? `${ing.quantity}${ing.unit}` 
               : ing.unit || "al gusto";
            rows.push([`- ${quantityStr} ${ing.name}`]);
         }
      }
      
      rows.push([""]);
   }
   
   // Write to sheet
   const range = sheet.getRange(startRow, 1, rows.length, 1);
   range.setValues(rows);
   
   // Format title
   sheet.getRange(startRow, 1).setFontWeight("bold").setFontSize(14);
   
   // Format day headers
   let currentRow = startRow + 2; // Title + blank row
   for (let i = 0; i < shoppingByDay.length; i++) {
      sheet.getRange(currentRow, 1).setFontWeight("bold").setFontSize(12);
      const ingredientCount = shoppingByDay[i].ingredients.length || 1;
      currentRow += ingredientCount + 3; // ingredients + day header + 2 blank rows
   }
   
   return startRow + rows.length;
}

function findCol(headers, candidates) {
   for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx !== -1) return idx;
   }
   return -1;
}

function filterByTag(meals, tagKeywords) {
   return meals.filter((m) => tagKeywords.some((k) => m.tags.includes(k)));
}

function convertWeekPlanToRows(weekPlan) {
   // Build table (4 rows x 15 cols): A + (7 days * 2 cols)
   // Row 1: day headers with dayLabel (e.g., "Lunes 1", "Viernes 23")
   const row1 = [""];
   for (const day of weekPlan) {
      row1.push(day.dayLabel, "");
   }

   const rows = [row1];

   // Get meal times from first day
   const mealTimes = weekPlan[0]?.meals.map(m => m.time) || [];

   // For each meal time
   for (const mealTime of mealTimes) {
      const row = [mealTime];
      // For each day
      for (const day of weekPlan) {
         const mealEntry = day.meals.find(m => m.time === mealTime);
         if (mealEntry) {
            row.push(mealEntry.meal.code, mealEntry.meal.name);
         } else {
            row.push("", "");
         }
      }
      rows.push(row);
   }

   return rows;
}

function convertRowsToWeekPlan(tabSeparatedText) {
   if (!tabSeparatedText || typeof tabSeparatedText !== 'string') {
      throw new Error("Invalid input: expected tab-separated text string");
   }
   
   // Parse the tab-separated text into rows
   const lines = tabSeparatedText.trim().split('\n');
   const rows = lines.map(line => line.split('\t'));
   
   if (rows.length < 2) {
      throw new Error("Invalid format: need at least header row and one meal row");
   }
   
   // Parse header row to get day labels
   // In tab-separated text: day labels are at even indices: 0, 2, 4, 6, 8, 10, 12...
   const headerRow = rows[0];
   const dayLabels = [];
   
   for (let i = 0; i < headerRow.length; i += 2) {
      const label = headerRow[i] ? headerRow[i].trim() : '';
      if (label) {
         dayLabels.push(label);
      }
   }
   
   if (dayLabels.length === 0) {
      throw new Error("No day labels found in header row");
   }
   
   // Initialize weekPlan array with day structures
   const weekPlan = dayLabels.map(dayLabel => {
      return {
         day: "",
         dayLabel: dayLabel,
         meals: []
      };
   });
   
   // Process meal rows (skip header row)
   for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const mealTime = row[0] ? row[0].trim() : '';
      
      if (!mealTime) continue;
      
      // For each day
      // In meal rows: index 0 is meal time, then pairs start at index 1: (1,2), (3,4), (5,6), (7,8)...
      for (let d = 0; d < dayLabels.length; d++) {
         const codeIndex = 1 + (d * 2);
         const nameIndex = codeIndex + 1;
         
         const code = row[codeIndex] ? row[codeIndex].trim() : '';
         const name = row[nameIndex] ? row[nameIndex].trim() : '';
         
         if (code && name) {
            weekPlan[d].meals.push({
               time: mealTime,
               meal: {
                  code: code,
                  name: name
               }
            });
         }
      }
   }
   
   return weekPlan;
}

function convertSheetRowsToWeekPlan(rows) {
   if (!rows || rows.length < 2) {
      throw new Error("Invalid format: need at least header row and one meal row");
   }
   
   // Parse header row to get day labels
   // In Google Sheets getValues() format: column 0 is empty, then pairs of (day label, empty) at positions (1,2), (3,4), (5,6)...
   // Day labels are at odd indices: 1, 3, 5, 7, 9, 11, 13
   const headerRow = rows[0];
   const dayLabels = [];
   
   // Extract day labels from odd indices (1, 3, 5, 7, 9, 11, 13)
   for (let i = 1; i < headerRow.length; i += 2) {
      const label = headerRow[i] ? String(headerRow[i]).trim() : '';
      if (label) {
         dayLabels.push(label);
      }
   }
   
   if (dayLabels.length === 0) {
      throw new Error("No day labels found in header row");
   }
   
   // Initialize weekPlan array with day structures
   const weekPlan = dayLabels.map(dayLabel => {
      return {
         day: "", // Placeholder
         dayLabel: dayLabel,
         meals: []
      };
   });
   
   // Process meal rows (skip header row)
   for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const mealTime = row[0] ? String(row[0]).trim() : '';
      
      if (!mealTime) continue; // Skip empty rows
      
      // For each day
      // In meal rows: index 0 is meal time, then pairs start at index 1: (1,2), (3,4), (5,6), (7,8)...
      for (let d = 0; d < dayLabels.length; d++) {
         const codeIndex = 1 + (d * 2);
         const nameIndex = codeIndex + 1;
         
         const code = row[codeIndex] ? String(row[codeIndex]).trim() : '';
         const name = row[nameIndex] ? String(row[nameIndex]).trim() : '';
         
         // Only add meal if both code and name exist
         if (code && name) {
            weekPlan[d].meals.push({
               time: mealTime,
               meal: {
                  code: code,
                  name: name
               }
            });
         }
      }
   }
   
   return weekPlan;
}

// Try to avoid duplicates across the whole week and prioritize the ones with the lowest count if available
// If pool is exhausted, fall back to full list, then allow repeats.
function pickMeal(preferredPool, fullPool, usedSet) {
   let candidates = preferredPool.filter((m) => !usedSet.has(m.code));
   if (candidates.length === 0) candidates = fullPool.filter((m) => !usedSet.has(m.code));
   if (candidates.length === 0) candidates = preferredPool.length ? preferredPool : fullPool;

   // Sort by count ascending and pick the one with lowest count
   candidates.sort((a, b) => a.count - b.count);
   const pick = candidates[0];
   usedSet.add(pick.code);
   return pick;
}

// Shopping List Functions

function generateShoppingListByDay() {
   const weekNumber = readUserInput();
   const startDate = getStartOfTheWeek(weekNumber);
   const meals = readMealsSheet();
   const weekPlan = generateWeekPlan(meals, startDate);
   const ingredients = processIngredientsSheet(readIngredientsSheet());
   
   const shoppingList = generateShoppingListGroupedByDay(weekPlan, ingredients);
   console.log(JSON.stringify(shoppingList, null, 2));
   writeShoppingListByDay(weekNumber, shoppingList);
}

function generateShoppingListByWeek() {
   const weekNumber = readUserInput();
   const startDate = getStartOfTheWeek(weekNumber);
   const meals = readMealsSheet();
   const weekPlan = generateWeekPlan(meals, startDate);
   const ingredients = processIngredientsSheet(readIngredientsSheet());
   
   const shoppingList = generateShoppingListAggregated(weekPlan, ingredients);
   writeShoppingListByWeek(weekNumber, shoppingList);
}

function readIngredientsSheet(filename) {
   const ss = SpreadsheetApp.getActive();
   const ingredientsSheetName = "Ingredientes";
   const ingredientsSheet = ss.getSheetByName(ingredientsSheetName);

   if (!ingredientsSheet) {
      throw new Error(
         `Sheet "${ingredientsSheetName}" not found. Please create an Ingredientes sheet with columns: Meal Code, Nombre, Unidad, Cantidad`
      );
   }

   const values = ingredientsSheet.getDataRange().getValues();
   if (values.length < 2) {
      throw new Error("No ingredients found (need headers + at least one row).");
   }
   return values;
}

function processIngredientsSheet(values) {
   
   const headers = values[0].map((h) => String(h).trim().toLowerCase());
   
   const mealCodeCol = findCol(headers, ["meal code", "código", "codigo", "code"]);
   const nameCol = findCol(headers, ["nombre", "name", "ingrediente", "ingredient"]);
   const unitCol = findCol(headers, ["unidad", "unit", "medida"]);
   const quantityCol = findCol(headers, ["cantidad", "quantity", "amount"]);
   
   if (mealCodeCol === -1) throw new Error('Could not find meal code column in Ingredientes sheet.');
   if (nameCol === -1) throw new Error('Could not find ingredient name column in Ingredientes sheet.');
   if (unitCol === -1) throw new Error('Could not find unit column in Ingredientes sheet.');
   if (quantityCol === -1) throw new Error('Could not find quantity column in Ingredientes sheet.');
   
   const ingredients = [];
   for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const mealCode = row[mealCodeCol];
      const name = row[nameCol];
      
      if (!mealCode || !name) continue;
      
      ingredients.push({
         mealCode: String(mealCode).trim(),
         name: String(name).trim(),
         unit: String(row[unitCol] || "").trim(),
         quantity: parseFloat(row[quantityCol]) || 0
      });
   }
   
   return ingredients;
}

function generateShoppingListGroupedByDay(weekPlan, ingredients) {
   const shoppingByDay = [];
   
   for (const day of weekPlan) {
      const dayIngredients = {};
      
      // Get all meal codes for this day
      for (const mealEntry of day.meals) {
         const mealCode = mealEntry.meal.code;
         
         // Find all ingredients for this meal code
         const mealIngredients = ingredients.filter(ing => ing.mealCode === mealCode);
         
         for (const ing of mealIngredients) {
            const key = `${ing.name}|${ing.unit}`;
            
            if (!dayIngredients[key]) {
               dayIngredients[key] = {
                  name: ing.name,
                  unit: ing.unit,
                  quantity: 0
               };
            }
            
            dayIngredients[key].quantity += ing.quantity;
         }
      }
      
      // Convert to array and sort
      const ingredientsList = Object.values(dayIngredients)
         .sort((a, b) => a.name.localeCompare(b.name));
      
      shoppingByDay.push({
         day: day.day,
         dayLabel: day.dayLabel,
         ingredients: ingredientsList
      });
   }
   
   return shoppingByDay;
}

function generateShoppingListAggregated(weekPlan, ingredients) {
   const aggregatedIngredients = {};
   
   for (const day of weekPlan) {
      for (const mealEntry of day.meals) {
         const mealCode = mealEntry.meal.code;
         
         // Find all ingredients for this meal code
         const mealIngredients = ingredients.filter(ing => ing.mealCode === mealCode);
         console.log(`meal code: ${mealCode}. ingredients: ${mealIngredients.length}`);
         for (const ing of mealIngredients) {
            const key = `${ing.name}|${ing.unit}`;
            
            if (!aggregatedIngredients[key]) {
               aggregatedIngredients[key] = {
                  name: ing.name,
                  unit: ing.unit,
                  quantity: 0
               };
            }
            
            aggregatedIngredients[key].quantity += ing.quantity;
         }
      }
   }
   
   // Convert to array and sort
   return Object.values(aggregatedIngredients)
      .sort((a, b) => a.name.localeCompare(b.name));
}

function writeShoppingListByDay(weekNum, shoppingByDay) {
   const ss = SpreadsheetApp.getActive();
   const tabName = `Lista Diaria semana ${weekNum}`;
   let sheet = ss.getSheetByName(tabName);
   if (!sheet) sheet = ss.insertSheet(tabName);
   sheet.clear();
   
   const rows = [];
   
   // Title
   rows.push([`Lista de Compras - Semana ${weekNum} (Por Día)`]);
   rows.push([""]);
   
   for (const day of shoppingByDay) {
      // Day header
      rows.push([day.dayLabel]);
      rows.push([""]);
      
      if (day.ingredients.length === 0) {
         rows.push(["No hay ingredientes registrados para este día"]);
      } else {
         for (const ing of day.ingredients) {
            const quantityStr = ing.quantity > 0 
               ? `${ing.quantity}${ing.unit}` 
               : ing.unit || "al gusto";
            rows.push([`- ${quantityStr} ${ing.name}`]);
         }
      }
      
      rows.push([""]);
   }
   
   // Write to sheet
   const range = sheet.getRange(1, 1, rows.length, 1);
   range.setValues(rows);
   
   // Format title
   sheet.getRange(1, 1).setFontWeight("bold").setFontSize(14);
   
   // Format day headers
   let currentRow = 3;
   for (let i = 0; i < shoppingByDay.length; i++) {
      sheet.getRange(currentRow, 1).setFontWeight("bold").setFontSize(12);
      const ingredientCount = shoppingByDay[i].ingredients.length || 1;
      currentRow += ingredientCount + 3;
   }
   
   sheet.autoResizeColumns(1, 1);
   
   SpreadsheetApp.getUi().alert(`Lista de compras por día generada en la pestaña "${tabName}"`);
}

function writeShoppingListByWeek(weekNum, shoppingList) {
   const ss = SpreadsheetApp.getActive();
   const tabName = `Lista Semanal semana ${weekNum}`;
   let sheet = ss.getSheetByName(tabName);
   if (!sheet) sheet = ss.insertSheet(tabName);
   sheet.clear();
   
   const rows = [];
   
   // Title
   rows.push([`Lista de Compras - Semana ${weekNum} (Toda la Semana)`]);
   rows.push([""]);
   
   if (shoppingList.length === 0) {
      rows.push(["No hay ingredientes registrados"]);
   } else {
      for (const ing of shoppingList) {
         const quantityStr = ing.quantity > 0 
            ? `${ing.quantity}${ing.unit}` 
            : ing.unit || "al gusto";
         rows.push([`- ${quantityStr} ${ing.name}`]);
      }
   }
   
   // Write to sheet
   const range = sheet.getRange(1, 1, rows.length, 1);
   range.setValues(rows);
   
   // Format title
   sheet.getRange(1, 1).setFontWeight("bold").setFontSize(14);
   
   sheet.autoResizeColumns(1, 1);
   
   SpreadsheetApp.getUi().alert(`Lista de compras semanal generada en la pestaña "${tabName}"`);
}

// Export for Node.js testing (won't execute in Google Apps Script)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateOneWeekTab,
        regenerateShoppingLists,
        readUserInput,
        generateWeekPlan,
        readMealsSheet,
        writeOnSheet,
        appendShoppingListByWeek,
        appendShoppingListByDay,
        findCol,
        filterByTag,
        pickMeal,
        convertWeekPlanToRows,
        convertRowsToWeekPlan,
        convertSheetRowsToWeekPlan,
        getStartOfTheWeek,
        getDateString,
        getDayLabel,
        generateShoppingListByDay,
        generateShoppingListByWeek,
        readIngredientsSheet,
        generateShoppingListGroupedByDay,
        generateShoppingListAggregated,
        writeShoppingListByDay,
        writeShoppingListByWeek,
        processIngredientsSheet,
    };
}