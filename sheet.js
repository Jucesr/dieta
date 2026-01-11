function onOpen() {
   SpreadsheetApp.getUi()
      .createMenu("Meal Planner")
      .addItem("Generate 1 Week (week N tab)", "generateOneWeekTab")
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

   writeOnSheet(weekNumber, rows);
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

function writeOnSheet(weekNum, rows){
    const ss = SpreadsheetApp.getActive();

    const tabName = `week ${weekNum}`;
    let planSheet = ss.getSheetByName(tabName);
    if (!planSheet) planSheet = ss.insertSheet(tabName);
    planSheet.clear();

   // Write values
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

   // Formatting
   planSheet.getRange(1, 1, 1, 15).setFontWeight("bold").setHorizontalAlignment("center");
   planSheet.getRange(2, 1, 3, 1).setFontWeight("bold"); // Desayuno/Comida/Cena
   range.setBorder(true, true, true, true, true, true);
   range.setWrap(true);
   planSheet.autoResizeColumns(1, 15);

   // Optional row heights for readability
   planSheet.setRowHeight(1, 28);
   planSheet.setRowHeights(2, 3, 40);
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

// Export for Node.js testing (won't execute in Google Apps Script)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateOneWeekTab,
        readUserInput,
        generateWeekPlan,
        readMealsSheet,
        writeOnSheet,
        findCol,
        filterByTag,
        pickMeal,
        convertWeekPlanToRows,
        getStartOfTheWeek,
        getDateString,
        getDayLabel,
    };
}