# Dieta - Meal Planner

Repositorio para guardar codigo relacionado a automatizaciones de dieta.

Actualmente tengo este [google sheet](https://docs.google.com/spreadsheets/d/1SbomUnfF1xjCvFYFQIO8xKtRwUDAajwOU4rVFwJ-z00/edit?usp=sharing)

## Características

### 1. Generación de Plan Semanal
Genera un plan de comidas para toda la semana con desayuno, comida y cena para cada día.

### 2. Lista de Compras
Genera listas de compras con cantidades agregadas de ingredientes:
- **Por día**: Muestra los ingredientes necesarios para cada día de la semana
- **Por semana**: Agrega todos los ingredientes de la semana en una sola lista

## Uso en Google Apps Script

1. Copia el contenido de `sheet.js` en el editor de scripts de Google Sheets
2. Crea las siguientes pestañas en tu Google Sheet:
   - **Meals**: Lista de comidas con columnas: Código, Nombre, Etiquetas, Contador
   - **Ingredientes**: Lista de ingredientes con columnas: **Meal Code**, **Nombre**, **Unidad**, **Cantidad**

3. Usa el menú "Meal Planner":
   - **"Generate 1 Week (week N tab)"**: Genera el plan semanal
   - **"Generate Shopping List by Day"**: Genera lista de compras por día
   - **"Generate Shopping List by Week"**: Genera lista de compras agregada por semana

### Formato de la pestaña "Ingredientes"

La pestaña de ingredientes debe tener este formato:

| Meal Code | Nombre | Unidad | Cantidad |
|-----------|--------|--------|----------|
| C02 | Pollo | gramos | 150 |
| C02 | Queso fresco | gramos | 30 |
| C01 | Pollo | gramos | 200 |
| D01 | Huevo | piezas | 2 |

**Notas:**
- `Meal Code` debe coincidir con el código en la pestaña "Meals"
- `Unidad` puede ser: gramos, ml, piezas, etc.
- `Cantidad` es un número (puede tener decimales como 0.5)

## Ejemplo de Salida

### Lista por Día

```
Lunes 5
- 2piezas Huevo
- 50gramos Jamón de pavo
- 200gramos Pollo

Martes 6
- 3piezas Huevo
- 100gramos Champiñones
- 250gramos Pollo
```

### Lista por Semana

```
- 20gramos Almendras
- 1piezas Cebolla
- 100gramos Champiñones
- 7piezas Huevo
- 450gramos Pollo
- 50gramos Queso
```

## Pruebas Locales

Para probar la lógica localmente sin usar Google Sheets:

```bash
npm test
```

Esto ejecutará `test-local.js` que simula las funciones de Google Apps Script y muestra el resultado en la consola.

### Personalizar los datos de prueba

- Actualiza `meals.csv` para agregar más comidas
- Actualiza `ingredients.csv` para agregar más ingredientes