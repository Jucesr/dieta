const { convertRowsToWeekPlan, generateShoppingListAggregated, processIngredientsSheet } = require("./sheet");
const fs = require('fs');
const path = require('path');

const readFile = (filename) => {
    const filePath = path.join(__dirname, filename);
    const fileContent = fs.readFileSync(filePath, "utf8");
    return fileContent.split("\n").map((line) => line.split(","));
}
const tabSeparatedText = `
	Lunes 12		Martes 13		Miercoles 14		Jueves 15		Viernes 16		Sabado 17		Domingo 18	
desayuno	D09	Huevo con tocino	D01	Huevo con jamon de pavo	D02	Huevo chorizo	D03	Huevo con papa	D04	Omelette con champiñón, espinaca, queso	D05	Omelette clásico	D06	Tostadas mexicanas saludables
comida	C41	Poke de atun	C01	Enchiladas suizas	C37	Pizza	C26	Pescado empanizado	C21	Pollo asado	C07	Hamburguesas	C19	Wrap de pollo
cena	C35	Lentejas preparadas	C34	Tacos de carne asada	C03	Pollo con salsa de champion			C06	Flautas	C22	Carne en su jugo	C46	Tacos de carne asada caseros`;

const weekPlan = convertRowsToWeekPlan(tabSeparatedText);
console.log(JSON.stringify(weekPlan, null, 2));

const rawIngredients = readFile("ingredients.csv");
const ingredients = processIngredientsSheet(rawIngredients);

const shoppingList = generateShoppingListAggregated(weekPlan, ingredients);
console.log(shoppingList);