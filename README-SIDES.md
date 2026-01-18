# Funcionalidad de Guarniciones (Sides)

## Descripción

Se ha agregado la funcionalidad para combinar comidas con guarniciones. Algunas comidas pueden ser servidas solas, mientras que otras se benefician de agregar una guarnición como arroz, ensalada, pasta, pan, etc.

## Archivos Nuevos

### 1. `sides.csv`
Contiene las guarniciones disponibles con la siguiente estructura:
- **Codigo**: Código único de la guarnición (ej: S01, S02, etc.)
- **Nombre**: Nombre de la guarnición (ej: Arroz, Ensalada, Pan)
- **Etiquetas**: Categorías donde aplica (Desayuno, Comida, Cena)
- **Preferencia**: Quién prefiere esta guarnición (opcional)

Ejemplo:
```csv
Codigo,Nombre,Etiquetas,Preferencia
S01,Arroz,Comida,Julio; Ericka
S04,Pan,Desayuno,Julio; Ericka
S05,Tortilla,Desayuno; Comida,Julio; Ericka
```

### 2. `sides-ingredients.csv`
Contiene los ingredientes necesarios para cada guarnición:
- **Side Code**: Código de la guarnición
- **Nombre**: Nombre del ingrediente
- **Unidad**: Unidad de medida (gramos, pieza, etc.)
- **Cantidad**: Cantidad requerida

Ejemplo:
```csv
Side Code,Nombre,Unidad,Cantidad
S01,Arroz,gramos,100
S04,Pan,pieza,2
S05,Tortilla,pieza,3
```

## Modificaciones a Archivos Existentes

### `meals.csv`
Se agregó una nueva columna **Sides** al final del archivo que contiene la lista de códigos de guarniciones disponibles para cada comida, separados por punto y coma (;) o coma (,).

**Formato**: `S01;S02;S03` o `S01,S02,S03`

Ejemplos de comidas con sus guarniciones disponibles:

```csv
Codigo,Nombre,Dificultad,Etiquetas,Contador,Ingredientes,Preparacion,Preferencia,Variaciones,Sides
C21,Pollo asado,Sencillas,Comida,0,,,,,S01;S02;S03;S08;S09
D02,Huevo chorizo,Sencillas,Desayuno,0,huevo; cebolla; chorizo,,Julio,,S04;S05;S06
C26,Pescado empanizado,Sencillas,Comida,0,,,,,S01;S02;S09;S10
```

**Traducción**:
- **Pollo asado** puede servirse con: Arroz (S01), Ensalada (S02), Pasta (S03), Verduras al vapor (S08), o Puré de papa (S09)
- **Huevo chorizo** puede servirse con: Pan (S04), Tortilla (S05), o Quesadilla (S06)
- **Pescado empanizado** puede servirse con: Arroz (S01), Ensalada (S02), Puré de papa (S09), o Camote al horno (S10)

Si la columna está vacía, la comida no requiere guarnición.

## Uso en Google Sheets

### 1. Crear las Hojas Necesarias

Debes crear dos hojas nuevas en tu Google Spreadsheet:

#### Hoja "Sides"
Copia el contenido de `sides.csv` con las siguientes columnas:
| Codigo | Nombre | Etiquetas | Preferencia |
|--------|--------|-----------|-------------|
| S01    | Arroz  | Comida    | Julio; Ericka |

#### Hoja "SideIngredientes"
Copia el contenido de `sides-ingredients.csv` con las siguientes columnas:
| Side Code | Nombre | Unidad | Cantidad |
|-----------|--------|--------|----------|
| S01       | Arroz  | gramos | 100      |

### 2. Actualizar la Hoja "Meals"

Agrega una columna **Sides** al final de la hoja Meals. Para cada comida, especifica los códigos de guarniciones disponibles separados por punto y coma (;):

| Codigo | Nombre | ... | Sides |
|--------|--------|-----|-------|
| C21 | Pollo asado | ... | S01;S02;S03;S08;S09 |
| D02 | Huevo chorizo | ... | S04;S05;S06 |
| C01 | Enchiladas suizas | ... | *(vacío)* |

**Ventajas de este enfoque**:
- Control total sobre qué guarniciones son apropiadas para cada comida
- Evita combinaciones extrañas (ej: huevos con pasta)
- Permite personalización por comida

### 3. Generar Plan Semanal

Al usar el menú "Meal Planner" → "Generate 1 Week", el sistema automáticamente:

1. **Identifica comidas con guarniciones disponibles** (columna Sides no vacía)
2. **Selecciona una guarnición aleatoria** de las especificadas para esa comida
3. **Muestra la guarnición en el plan** con el formato:
   ```
   Nombre de la Comida
   + Nombre de la Guarnición
   ```
4. **Incluye los ingredientes de las guarniciones** en las listas de compras

**Ejemplo**: Si "Pollo asado" tiene `Sides: S01;S02;S03`, el sistema elegirá aleatoriamente entre Arroz, Ensalada o Pasta.

## Ejemplo de Salida

### Plan Semanal
```
Lunes 5
Desayuno: Huevo con jamon de pavo
          + Pan
Comida:   Pollo asado
          + Arroz
Cena:     Tacos de carne asada
```

### Lista de Compras
```
Lista de Compras - Semana 1 (Toda la Semana)

- 100gramos Arroz
- 2pieza Pan
- 200gramos Pollo
...
```

## Características

- **Selección Específica**: Cada comida tiene su propia lista de guarniciones apropiadas
- **Control Granular**: Evita combinaciones inapropiadas (ej: huevos con pasta sería extraño)
- **Ingredientes Automáticos**: Los ingredientes de las guarniciones se agregan automáticamente a las listas de compras
- **Opcional**: Si no existen las hojas de guarniciones, el sistema funciona normalmente sin ellas
- **Flexible**: Puedes agregar nuevas guarniciones fácilmente editando los archivos CSV
- **Aleatorio pero Controlado**: Se elige aleatoriamente, pero solo de las opciones válidas para cada comida

## Testing Local

Para probar la funcionalidad localmente:

```bash
npm test
# o
node test-local.js
```

El test mostrará:
- Comidas con su configuración de AllowsSides
- Guarniciones disponibles
- Plan semanal con guarniciones asignadas
- Listas de compras incluyendo ingredientes de guarniciones

## Notas

- Las guarniciones se asignan aleatoriamente de las especificadas para cada comida en la columna Sides
- Si una comida no tiene códigos de guarniciones en la columna Sides, no se le asignará ninguna
- El formato acepta tanto `;` como `,` como separadores: `S01;S02;S03` o `S01,S02,S03`
- Puedes personalizar las cantidades de ingredientes en `sides-ingredients.csv`
- Puedes agregar o modificar las guarniciones disponibles para cada comida editando la columna Sides

### Ejemplos de Combinaciones Recomendadas

**Desayunos** (usar S04, S05, S06):
- Huevos (cualquier preparación) → Pan, Tortilla, Quesadilla
- Omelettes → Pan, Tortilla, Quesadilla

**Comidas** (usar S01, S02, S03, S07, S08, S09, S10):
- Carnes/Pollo/Pescado asado → Arroz, Ensalada, Pasta, Verduras, Purés
- Guisados → Arroz, Frijoles, Ensalada
- Pescados → Arroz, Ensalada, Camote, Puré de papa