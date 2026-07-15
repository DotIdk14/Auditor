# REPORTE: MÓDULO NUEVA LLAMADA — ANÁLISIS Y REDISEÑO COMPLETO

**Fecha:** 14 de julio de 2026
**Alcance:** Módulo "Nueva Llamada" en `apps/visor/src/features/resources/`
**Objetivo:** Transformar un asistente lineal de scripts en un sistema GPS de ventas consultivas

---

## 1. DIAGNÓSTICO DEL ESTADO ACTUAL

### 1.1 Estructura actual

```
Nueva Llamada
├── Bienvenida     → 1 speech (apertura)
├── Sondeo         → 1 speech (detección de necesidades)
├── Personalizar   → 4 speeches (modalidad, licenciatura, validez, acompañamiento)
├── Oferta Económica → 5 sub-pasos (anclaje → beca → referidos → platzi → S/NO)
└── Acordar        → flujo de cierre (S/NO → documentos → demo opcional)
```

### 1.2 Problemas identificados

| # | Problema | Impacto UX | Impacto en ventas |
|---|---------|------------|-------------------|
| 1 | **Flujo lineal sin ramas** — El asesor avanza de paso 1→2→3→4→5 sin importar qué dijo el prospecto | El asesor no adapta el discurso | Pierde relevancia, el prospecto se desentiende |
| 2 | **Speeches como bloques monolíticos** — Cada speech es un párrafo largo sin estructura interna | Difícil escanear durante la llamada | El asesor lee en vez de conversar |
| 3 | **Sin perfil del prospecto** — No se captura ni se usa la información del sondeo para personalizar | Cada llamada empieza de cero | No hay recomendaciones contextuales |
| 4 | **Sin objetivos ni principios psicológicos** — El asesor no sabe POR QUÉ dice lo que dice | Falta intención en cada intervención | La persuasión es accidental, no deliberada |
| 5 | **Sin señales de lectura** — No hay sistema de "¿funcionó o no?" | El asesor no sabe si el prospecto está convencido | Pierde señales de aversión a la pérdida o interés |
| 6 | **Sin versión corta/media/larga** — Un mismo speech para llamadas de 12 y 45 minutos | Inflexibilidad temporal | Llamadas largas se sienten monótonas, las cortas no llegan al punto |
| 7 | **Sin preguntas de regreso** — Muchos speeches terminan en declaraciones, no en preguntas | El asesor queda hablando solo | Pierde control de la conversación |
| 8 | **Sección de costos como presentación** — Es un PPT de precios, no una negociación | El prospecto escucha precios sin contexto de valor | Genera sticker shock |
| 9 | **Cierre débil** — Solo muestra documentos, no usa escalas ni confirmaciones | Falta cierre consultivo | Pierde inscripciones en el último paso |
| 10 | **Sin sección de persuasión** — No hay speeches emocionales para Momento E (Emoción) | Falta motivación emocional | El prospecto decide por lógica, no por deseo |

### 1.3 Componentes huérfanos

- `SafeReturnChecklist.tsx` — Definido pero no renderizado
- `VariablesPanel.tsx` — Definido pero no renderizado
- `InterestDecision.tsx` — Definido pero no renderizado (lógica inlined en ConversationAssistant)

---

## 2. NUEVA FILOSOFÍA: GPS DE VENTAS

### 2.1 Metáfora GPS

| GPS de navegación | GPS de ventas |
|-------------------|---------------|
| Destino | Tasa de inscripción |
| Ruta actual | Sección activa del call flow |
| Tráfico en tiempo real | Señales del prospecto (positivas/negativas) |
| Recalculación automática | Recomendación de speech siguiente |
| Puntos de interés | Objetivos por sección |
| Velocidad | Ritmo de la llamada |
| Semáforo | Estado emocional del prospecto |

### 2.2 Principios de diseño

1. **Decisiones, no lecturas** — Cada pantalla muestra QUÉ HACER, no solo QUÉ DECIR
2. **Contexto antes de contenido** — Antes de cada speech: objetivo, principio, momento ideal
3. **Perfil vivo** — El prospecto se construye en tiempo real y alimenta las recomendaciones
4. **Señales > scripts** — El asesor aprende a leer respuestas y adaptarse
5. **Escaneabilidad** — Tarjetas compactas con iconografía, no bloques de texto

---

## 3. NUEVA ARQUITECTURA DE TIPOS

### 3.1 SmartBlock (reemplaza a Speech)

```typescript
// Cada "speech" se convierte en un bloque inteligente compuesto
interface SmartBlock {
  id: string;
  title: string;
  icon: string;

  // 1. Objetivo — QUÉ intenta lograr este bloque
  objective: string;  // ej: "Crear confianza", "Descubrir dolor"

  // 2. Principio psicológico
  principle: PsychPrinciple;

  // 3. Momento ideal — CUÁNDO debe aparecer
  timing: BlockTiming[];

  // 4. Speeches en 3 versiones
  versions: {
    short: string;   // ~30 segundos
    medium: string;  // ~1-2 minutos
    long: string;    // ~3-5 minutos
  };

  // 5. Preguntas de regreso (NUNCA terminar hablando)
  followUpQuestions: string[];

  // 6. Señales positivas del prospecto
  positiveSignals: string[];

  // 7. Señales negativas del prospecto
  negativeSignals: string[];

  // 8. Speech siguiente recomendado (si funcionó)
  nextIfPositive: string;  // block ID

  // 9. Speech alternativo recomendado (si no funcionó)
  nextIfNegative: string;  // block ID

  // 10. Tags para matching con perfil
  tags: ProfileTag[];

  // 11. Prioridad (para orden de recomendación)
  priority: 1 | 2 | 3 | 4 | 5;  // 5 = siempre mostrar, 1 = solo si perfil matchea

  // 12. Si el bloque ya fue usado
  used?: boolean;
}

type PsychPrinciple =
  | 'compromiso'      // "Dijiste que buscas X..."
  | 'consistencia'    // "Antes mencionaste que..."
  | 'reciprocidad'    // "Te estoy dando acceso a..."
  | 'prueba_social'   // "El 80% de nuestros estudiantes..."
  | 'autoridad'       // "UTEL tiene RVOE..."
  | 'contraste'       // "Sin beca: $7,240. Con beca: $2,419"
  | 'visualizacion'   // "Imagínate el día de tu graduación..."
  | 'aversion_perdida' // "Si no lo haces ahora, pierdes la beca"
  | 'costo_oportunidad' // "Cada año sin título es X en ingresos"
  | 'anclaje'         // "El precio lista es $7,240..."
  | 'escasez'         // "Esta beca tiene fecha de vencimiento"
  | 'empatia'         // "Entiendo tu situación..."
  | 'identificacion'  // "Yo también trabajo y estudié..."
  | 'compromiso_social' // "¿Quién sería el más orgulloso?"
  | 'contraprestacion'; // "¿Qué ganas tú a cambio?"

type BlockTiming =
  | 'apertura'       // Inicio de llamada
  | 'descubrimiento' // Durante sondeo
  | 'construccion'   // Después de detectar dolor
  | 'antes_precio'   // Justo antes de Oferta Económica
  | 'post_objecion'  // Después de manejar una objeción
  | 'cierre'         // Antes del cierre
  | 'emocional'      // Cuando el prospecto muestra duda emocional
  | 'urgencia';      // Cuando el prospecto está por decidir

type ProfileTag =
  | 'trabaja'
  | 'no_trabaja'
  | 'tiene_hijos'
  | 'sin_hijos'
  | 'preocupado_costos'
  | 'preocupado_tiempo'
  | 'preocupado_calidad'
  | 'quiere_crecer'
  | 'quiere_cambiar'
  | 'quiere_titulo'
  | 'quiere_ascenso'
  | 'quiere_emprender'
  | 'familia_apoyo'
  | 'primera_universidad'
  | 'ya_tiene_opcion'
  | 'motivacion_emocional'
  | 'motivacion_laboral'
  | 'motivacion_personal';
```

### 3.2 SectionMeta (contexto de cada sección)

```typescript
// Cada sección del call flow tiene metadata de contexto
interface SectionMeta {
  id: string;
  icon: string;
  title: string;
  subtitle: string;

  // Objetivo de ESTA sección
  objective: string;  // ej: "Descubrir qué motiva al prospecto"

  // Emoción que DEBE generar
  targetEmotion: string;  // ej: "Curiosidad", "Esperanza", "Urgencia"

  // Información que DEBE obtener
  requiredInfo: string[];  // ej: ["Motivación principal", "Situación laboral"]

  // Tiempo estimado
  estimatedMinutes: number;

  // Nivel de impacto en la decisión
  impactLevel: 'bajo' | 'medio' | 'alto' | 'crítico';

  // Blocks disponibles en esta sección
  blockIds: string[];

  // Si la sección es saltable
  skippable: boolean;
}
```

### 3.3 ProspectProfile (perfil vivo)

```typescript
// Se construye en tiempo real durante la llamada
interface ProspectProfile {
  // Datos básicos
  nombre: string;
  carrera: string;

  // Motivaciones (seleccionadas en sondeo)
  motivations: Motivation[];

  // Dolor detectado
  painPoints: PainPoint[];

  // Situación actual
  situation: {
    trabaja: boolean;
    tieneHijos: boolean;
    tieneOtraOpcion: boolean;
    primeraUniversidad: boolean;
    preocupacionPrincipal: ConcernType | null;
  };

  // Emoción detectada (el asesor la marca)
  detectedEmotion: ProspectEmotion | null;

  // Nivel de interés (escala 1-10)
  interestLevel: number | null;

  // Decisión tomada
  decision: 'yes' | 'no' | null;

  // Razón del NO
  rejectionReason: string | null;

  // Tags generados automáticamente
  generatedTags: ProfileTag[];
}

type Motivation =
  | 'crecer_laboral'
  | 'mejor_salario'
  | 'cambiar_carrera'
  | 'obtener_titulo'
  | 'familia'
  | 'ascenso'
  | 'emprender'
  | 'superacion_personal'
  | 'requisito_empresa';

type PainPoint =
  | 'no_tiempo'
  | 'no_dinero'
  | 'no_termino_universidad'
  | 'tiene_hijos'
  | 'trabaja'
  | 'quiere_ascender'
  | 'no_sabe_que_estudiar'
  | 'otra_universidad';

type ConcernType =
  | 'precio'
  | 'tiempo'
  | 'calidad'
  | 'confianza'
  | 'modalidad'
  | 'familia';

type ProspectEmotion =
  | 'interesado'     // "Eso suena bien"
  | 'emocionado'     // "¡Sí, eso busco!"
  | 'dudoso'         // "Hmm, no sé..."
  | 'resistente'     // "No me convence"
  | 'satisfecho'     // "Perfecto, me gusta"
  | 'preocupado'     // "Y si no puedo pagar?"
  | 'indiferente';   // "Ok..."
```

### 3.4 FlowEngine (motor de recomendaciones)

```typescript
// El motor que decide qué mostrar después
interface FlowEngine {
  // Dado el perfil actual, retorna los blocks recomendados ordenados por relevancia
  getRecommendedBlocks(
    profile: ProspectProfile,
    sectionId: string,
    usedBlockIds: string[]
  ): SmartBlock[];

  // Dado un bloque y la respuesta del prospecto, sugiere el siguiente
  suggestNext(
    currentBlockId: string,
    signal: 'positive' | 'negative' | 'neutral',
    profile: ProspectProfile
  ): string | null;

  // Verifica si se puede avanzar a la siguiente sección
  canAdvance(
    sectionId: string,
    profile: ProspectProfile,
    usedBlockIds: string[]
  ): { ready: boolean; missing: string[] };

  // Genera tags del perfil a partir de las respuestas del sondeo
  generateTags(profile: ProspectProfile): ProfileTag[];
}
```

---

## 4. NUEVA ESTRUCTURA DE SECCIONES

### 4.1 Bienvenida — "Abrir puertas"

| Campo | Valor |
|-------|-------|
| **Objetivo** | Establecer rapport, explicar el formato de la llamada, reducir resistencia |
| **Emoción** | Confianza |
| **Principio** | Compromiso (el prospecto acepta el formato) |
| **Tiempo** | 1-2 min |
| **Impacto** | Medio |

**Speech GPS:**
```
"Antes de comenzar me gustaría comentarte cómo será esta llamada.
Primero quiero conocer un poco de ti.
Después revisaré si realmente puedo ayudarte.
Y solamente si hace sentido para ti te explicaré cómo funciona UTEL.
¿Te parece bien?"
```

**Preguntas de regreso:**
- "¿Te parece bien?"
- "¿Alguna pregunta antes de empezar?"

**Señales positivas:** "Sí", "De acuerdo", "Dale"
**Señales negativas:** Silencio prolongado, "Qué quieres venderme"

**Siguiente recomendado:** Si positivo → Sondeo. Si negativo → Reiniciar con tono más casual.

---

### 4.2 Sondeo — "Descubrir al prospecto"

| Campo | Valor |
|-------|-------|
| **Objetivo** | Obtener motivación, dolor, situación laboral, expectativas |
| **Emoción** | Curiosidad |
| **Principio** | Empatía + Reciprocidad (el asesor escucha antes de hablar) |
| **Tiempo** | 3-5 min |
| **Impacto** | Crítico |

**Nuevos componentes:**

#### Tarjeta "Resumen del Prospecto"
Se construye en tiempo real con checkboxes:

| Checkbox | Tag generado |
|----------|-------------|
| ☐ Crecer laboralmente | `quiere_crecer`, `motivacion_laboral` |
| ☐ Mejor salario | `quiere_crecer`, `motivacion_laboral` |
| ☐ Cambiar carrera | `quiere_cambiar`, `motivacion_laboral` |
| ☐ Obtener título | `quiere_titulo`, `motivacion_personal` |
| ☐ Familia | `familia_apoyo`, `motivacion_personal` |
| ☐ Ascenso | `quiere_ascenso`, `motivacion_laboral` |
| ☐ Emprender | `quiere_emprender`, `motivacion_laboral` |
| ☐ Superación personal | `superacion_personal`, `motivacion_personal` |
| ☐ Requisito empresa | `requisito_empresa`, `motivacion_laboral` |

#### Tarjeta "Dolor Principal"
Se selecciona uno o más:

| Dolor | Tag generado |
|-------|-------------|
| No tiene tiempo | `preocupado_tiempo` |
| No tiene dinero | `preocupado_costos` |
| No terminó universidad | `primera_universidad` |
| Tiene hijos | `tiene_hijos` |
| Trabaja | `trabaja` |
| Quiere ascender | `quiere_ascenso` |
| No sabe qué estudiar | `quiere_cambiar` |
| Ya tiene otra opción | `ya_tiene_opcion` |

#### Tarjeta "Situación"
- ¿Trabaja actualmente? → `trabaja` / `no_trabaja`
- ¿Tiene hijos? → `tiene_hijos` / `sin_hijos`
- ¿Es la primera universidad? → `primera_universidad`
- ¿Tiene otra opción? → `ya_tiene_opcion`

**Cada selección modifica automáticamente:**
1. Los tags del perfil
2. Los speeches recomendados en Personalizar
3. La prioridad de blocks en Persuasión
4. Las objeciones esperadas en Oferta Económica

---

### 4.3 Personalizar — "Recomendar, no mostrar todo"

| Campo | Valor |
|-------|-------|
| **Objetivo** | Presentar SOLO los beneficios relevantes al perfil |
| **Emoción** | Esperanza |
| **Principio** | Identificación ("Esto es para TI") |
| **Tiempo** | 3-5 min |
| **Impacto** | Alto |

**Cambios radicales:**

#### ANTES (actual)
```
Mostrar TODOS los speeches (modalidad, licenciatura, validez, acompañamiento)
El asesor elige cuál leer
Sin importar si el prospecto trabaja, tiene hijos, etc.
```

#### DESPUÉS (nuevo)
```
Motor de recomendaciones filtra blocks según perfil:
- Perfil: "Trabaja + Preocupado por tiempo"
  → Mostrar: Flexibilidad (★★★★★), Acompañamiento (★★★★)
  → NO mostrar: Platzi, Eventos, Biblioteca (no aportan valor)

- Perfil: "No sabe qué estudiar + Primera universidad"
  → Mostrar: Validez (★★★★★), Licenciatura (★★★★★), Flexibilidad (★★★★)
  → NO mostrar: Referidos (todavía no)
```

#### Sistema de prioridad

| Estrellas | Significado | Comportamiento |
|-----------|-------------|----------------|
| ★★★★★ | Muy recomendado | Se muestra primero, resaltado |
| ★★★★ | Recomendado | Se muestra, sin resalto |
| ★★★ | Opcional | Se muestra al final |
| ★★ | Poco relevante | Se oculta por defecto, desplegable |
| ★ | No mostrar | No se muestra nunca |

**Cada block muestra:**
```
┌─────────────────────────────────────────┐
│ ⚡ Modalidad y Flexibilidad    ★★★★★   │
│ ─────────────────────────────────────── │
│ 🎯 Crear confianza en la modalidad     │
│ 🧠 Principio: Identificación           │
│ ⏱️ Ideal después de: Descubrir dolor   │
│                                         │
│ [Speech Corto] [Speech Medio] [Largo]  │
│                                         │
│ ❓ "¿En qué momento del día            │
│     podrías dedicarle tiempo?"          │
│                                         │
│ ✅ Señales: "Sí", "Exacto", "Eso busco"│
│ ❌ Señales: Silencio, "No sé"          │
│                                         │
│ → Si funciona: Siguiente → Validez     │
│ → Si no funciona: Cambiar a Acompañ.   │
└─────────────────────────────────────────┘
```

---

### 4.4 Persuasión — NUEVA SECCIÓN

| Campo | Valor |
|-------|-------|
| **Objetivo** | Generar motivación emocional, visualizar futuro, crear urgencia |
| **Emoción** | Deseo |
| **Principio** | Visualización + Aversión a la pérdida + Costo de oportunidad |
| **Tiempo** | 2-4 min |
| **Impacto** | Alto |

**Speeches emocionales:**

| # | Speech | Principio | Momento ideal | Tags |
|---|--------|-----------|---------------|------|
| 1 | "El tiempo va a pasar de cualquier forma. La diferencia es si en 3 años tienes título o no." | Costo de oportunidad | Antes del precio | `preocupado_tiempo` |
| 2 | "Imagínate el día de tu graduación. Tu familia orgullosa, tu título en la pared." | Visualización | Después de detectar motivación familiar | `familia_apoyo`, `quiere_titulo` |
| 3 | "¿Qué cambiaría en 5 años si HOYempiezas tu carrera?" | Visualización + Compromiso | Durante sondeo | todos |
| 4 | "¿Qué pasa si no haces nada? ¿Dónde estarás en 3 años?" | Aversión a la pérdida | Cuando el prospecto duda | `dudoso`, `resistente` |
| 5 | "¿Qué le dirías a tu yo del futuro si decides no hacerlo?" | Compromiso social | Después de objeción de tiempo | `preocupado_tiempo` |
| 6 | "¿Quién sería el más orgulloso de verte titulado?" | Compromiso social + Identificación | Cierre emocional | `familia_apoyo` |
| 7 | "Cuéntame, ¿cuánto ganas actualmente? ¿Y con título? La diferencia es tu inversión." | Contraste + Costo de oportunidad | Antes del precio | `preocupado_costos`, `quiere_crecer` |
| 8 | "No es solo un título. Es la puerta a ese ascenso que llevas buscando." | Costo de oportunidad | Después de detectar ascenso | `quiere_ascenso`, `motivacion_laboral` |

**Seleccionador automático:** El motor elige 2-3 speeches según el perfil del prospecto.

---

### 4.5 Oferta Económica — "Construir valor ANTES del precio"

| Campo | Valor |
|-------|-------|
| **Objetivo** | Construir valor suficiente antes de revelar precio, manejar objeciones post-precio |
| **Emoción** | Contraste (antes/después) |
| **Principio** | Anclaje + Contraste + Escasez |
| **Tiempo** | 5-8 min |
| **Impacto** | Crítico |

**Nueva sub-estructura:**

#### Paso 1: Checklist de valor PRECIO
```
Antes de mostrar el precio, verificar:

□ Modalidad explicada
□ Validez explicada
□ Flexibilidad explicada
□ Duración explicada
□ Acompañamiento explicado
□ Beneficio personalizado según perfil

Si falta algo:
⚠️ "Aún no has construido suficiente valor.
   Primero completa los puntos antes de hablar de precio."
```

#### Paso 2: Pre-precio (transición)
```
"No quiero hablarte todavía del descuento.
Primero quiero enseñarte el costo real de la universidad
para que podamos comparar."
```

#### Paso 3: Flujo de costos (mantenido, mejorado)
1. Precio lista (anclaje)
2. Precio beca (contraste)
3. Referidos (reciprocidad)
4. Platzi (valor agregado)
5. Decisión S/NO

#### Paso 4: Post-precio — Reacción automática
```
Si SÍ → Confirmar + documentos
Si NO → Selector de razón → Objeciones relevantes → Speech de manejo

NUEVO: Después de manejar objeción, NO saltar a acordar.
       Primero: "¿Hay algo más que te impediría comenzar?"
       Luego: Escala 1-10
       Luego: Cierre
```

---

### 4.6 Acordar (Cierre) — "Confirmar y cerrar"

| Campo | Valor |
|-------|-------|
| **Objetivo** | Confirmar decisión, escalar compromiso, establecer siguiente paso |
| **Emoción** | Seguridad |
| **Principio** | Compromiso + Consistencia |
| **Tiempo** | 2-3 min |
| **Impacto** | Crítico |

**Nuevos módulos:**

#### Módulo 1: Confirmación profunda
```
"Si resolvemos el tema económico...
¿Hay algo más que te impediría comenzar?"
```

#### Módulo 2: Escala de convicción
```
"Del 1 al 10, ¿qué tan convencido te sientes?"

1-3: → Mostrar objeciones pendientes + speech de reconstrucción de valor
4-6: → Mostrar objeciones pendientes + beneficio personalizado
7-8: → "¿Qué te frena del 8 al 10?" → Manejar objeción específica
9-10: → Cerrar inmediatamente con documentos
```

#### Módulo 3: Cierre exitoso
```
"¡Perfecto! Para tu inscripción necesitamos:
• Documentos digitales
• Solicitud de admisión
• Primera colegiatura

¿Tienes alguna duda sobre el proceso?"
```

#### Módulo 4: Cierre no exitoso
```
"Entiendo. ¿Te parece si agendamos una llamada para
resolver cualquier duda que surja? Mientras tanto,
te envío la información por correo."
```

---

## 5. NUEVA ESTRUCTURA DE ARCHIVOS

### 5.1 Data layer (archivos)

```
resources/data/
├── smartBlocks/
│   ├── bienvenidaBlocks.ts      # Blocks de bienvenida
│   ├── sondeoBlocks.ts          # Blocks de sondeo
│   ├── personalizarBlocks.ts    # Blocks de personalizar (con tags y prioridades)
│   ├── persuasionBlocks.ts      # NUEVO: Blocks emocionales
│   ├── costosBlocks.ts          # Blocks de oferta económica
│   └── acordarBlocks.ts         # Blocks de cierre
├── sections/
│   └── sectionMeta.ts           # Metadata de cada sección
├── objections/
│   ├── objectionCategories.ts   # Categorías de objeciones (mejoradas)
│   ├── objectionReasons.ts      # Razones → categorías relevantes
│   └── objectionPsychology.ts   # NUEVO: Qué significa cada objeción + emoción detrás + qué NO decir
├── profile/
│   ├── motivations.ts           # Motivaciones + tags generados
│   ├── painPoints.ts            # Dolor + tags generados
│   └── profileEngine.ts         # Generación de tags + matching
├── callSteps.ts                 # Paso actual (lineal → dinámico)
├── defaultSpeeches.ts           # DEPRECATED → reemplazado por smartBlocks
├── defaultObjections.ts         # DEPRECATED → reemplazado por objections/
├── costFlow.ts                  # DEPRECATED → integrado en costosBlocks
└── closingFlow.ts               # DEPRECATED → integrado en acordarBlocks
```

### 5.2 Component layer (archivos)

```
components/NewCallView/
├── index.tsx                     # Layout principal (sin cambios)
├── CallSidebar.tsx               # Sidebar mejorado con badges de impacto
├── StepItem.tsx                  # Item de paso con indicador de estado
├── NavigationBar.tsx             # Navegación con "Saltar" inteligente
│
├── sections/
│   ├── SectionWrapper.tsx        # Wrapper genérico: header + objetivo + emoción + contenido
│   ├── BienvenidaSection.tsx     # Bienvenida con agenda de llamada
│   ├── SondeoSection.tsx         # Sondeo con prospect profile builder
│   ├── PersonalizarSection.tsx   # Personalizar con motor de recomendaciones
│   ├── PersuasionSection.tsx     # NUEVO: Persuasión emocional
│   ├── CostosSection.tsx         # Costos con checklist de valor
│   └── AcordarSection.tsx        # Acordar con escala 1-10
│
├── cards/
│   ├── SmartBlockCard.tsx        # Tarjeta de block inteligente (objetivo + principios + speech)
│   ├── ObjectiveCard.tsx         # Card: "¿Qué intentas lograr?"
│   ├── PrincipleBadge.tsx        # Badge: principio psicológico
│   ├── TimingBadge.tsx           # Badge: momento ideal
│   ├── VersionSelector.tsx       # Selector: corto / medio / largo
│   ├── FollowUpCard.tsx          # Card: preguntas de regreso
│   ├── SignalsCard.tsx           # Card: señales positivas y negativas
│   ├── RecommendationCard.tsx    # Card: "Siguiente recomendado"
│   ├── ProfileCard.tsx           # Card: resumen del prospecto
│   ├── EmotionCard.tsx           # Card: emoción detectada
│   ├── ValueChecklist.tsx        # Checklist de valor pre-precio
│   ├── ConvictionScale.tsx       # Escala 1-10
│   └── ObjectionDeepCard.tsx     # Card de objeción profunda (qué significa + emoción + qué NO decir + speech)
│
├── engine/
│   ├── FlowEngine.tsx            # Motor de recomendaciones (componente)
│   ├── ProfileBuilder.tsx        # Builder de perfil en tiempo real
│   ├── RecommendationPanel.tsx   # Panel lateral de recomendaciones
│   └── EmotionDetector.tsx       # Selector de emoción detectada
│
├── ConversationAssistant.tsx     # DEPRECATED → reemplazado por sections/
├── SondeoSelector.tsx            # DEPRECATED → integrado en SondeoSection
├── CostFlowStep.tsx              # DEPRECATED → integrado en CostosSection
├── AcordarStep.tsx               # DEPRECATED → integrado en AcordarSection
├── InterestDecision.tsx          # DEPRECATED → integrado en cada sección
├── SafeReturnChecklist.tsx       # DEPRECATED → eliminar
└── VariablesPanel.tsx            # DEPRECATED → integrado en ProfileCard
```

### 5.3 Store layer

```
store/
└── useCallStore.ts               # Reescrito con:
                                    - ProspectProfile
                                    - FlowEngine actions
                                    - SectionMeta
                                    - SmartBlock usage tracking
                                    - Emotion detection
                                    - Conviction scale
```

---

## 6. JUSTIFICACIÓN POR CAMBIO

### 6.1 Por UX

| Cambio | Justificación |
|--------|---------------|
| Bloques compuestos | Un asesor en llamada no tiene tiempo de leer párrafos. Necesita escanear objetivo → speech → pregunta en <5 segundos |
| Señales positivas/negativas | Sin feedback loops, el asesor no sabe si su intervención funcionó. Es como conducir sin espejos |
| 3 versiones de speech | Las llamadas varían 12-45 min. Un speech largo en una llamada corta es letal. Un speech corto en una llamada larga es insuficiente |
| Perfil vivo | Sin datos del prospecto, cada recomendación es genérica. Con perfil, cada recomendación es personal |
| GPS con recalculación | Si el prospecto cambia de tema, el sistema recalcula qué speech usar. Sin GPS, el asesor pierde el hilo |

### 6.2 Por Psicología de Ventas

| Cambio | Framework | Justificación |
|--------|-----------|---------------|
| Principios en cada block | NEPQ | El asesor debe saber QUÉ principio está usando para activarlo conscientemente |
| Persuasión como sección | Cialdini | La reciprocidad y prueba social se aplican mejor como bloques dedicados, no incrustados |
| Checklist de valor pre-precio | SPIN Selling | "Situación → Problema → Implicación → Necesidad-Pago" = construir valor ANTES del precio |
| Escala 1-10 en cierre | Sandler | "¿Qué tan convencido estás?" revela objeciones ocultas sin confrontar |
| Señales negativas | Challenger Sale | El asesor debe identificar cuándo el cliente está "comprando" vs. "saliendo por la puerta" |
| Objección = emoción | Consumer Psychology | Detrás de "es caro" hay "miedo a perder dinero". Manejar la emoción, no la palabra |

### 6.3 Por Arquitectura de Software

| Cambio | Justificación |
|--------|---------------|
| Separación data/component | Los speeches son datos puros. Los componentes son UI. Mezclarlos (como ahora) dificulta mantener |
| Motor de recomendaciones | Lógica de negocio separada de UI. Puede testearse sin renderizar componentes |
| Tags y matching | Sistema declarativo: "Si perfil tiene X, mostrar block Y". Fácil de extender sin modificar componentes |
| Persistencia mejorada | El perfil del prospecto se guarda con la llamada. Permite analytics post-llamada |

---

## 7. FLUJO COMPLETO REIMAGINADO

```
┌─────────────────────────────────────────────────────────────────┐
│                    NUEVA LLAMADA — GPS DE VENTAS                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ BIENVENIDA ──────────────────────────────────────────────┐  │
│  │ 🎯 Objetivo: Establecer rapport + explicar formato       │  │
│  │ 🧠 Principio: Compromiso                                  │  │
│  │ 💬 "Antes de comenzar... ¿Te parece bien?"                │  │
│  │ ❓ Pregunta: "¿Alguna pregunta antes de empezar?"        │  │
│  │ ✅ Señales: "Sí", "De acuerdo"                            │  │
│  │ → Siguiente: Sondeo                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌─ SONDEO ──────────────────────────────────────────────────┐  │
│  │ 🎯 Objetivo: Descubrir motivación + dolor + situación    │  │
│  │ 🧠 Principio: Empatía + Reciprocidad                      │  │
│  │                                                            │  │
│  │ 📋 RESUMEN DEL PROSPECTO (se construye en vivo)           │  │
│  │ □ Crecer laboralmente  □ Mejor salario  □ Cambiar área   │  │
│  │ □ Título  □ Familia  □ Ascenso  □ Emprender              │  │
│  │                                                            │  │
│  │ 🔴 DOLOR PRINCIPAL                                        │  │
│  │ □ No tiene tiempo  □ No tiene dinero  □ No terminó uni    │  │
│  │                                                            │  │
│  │ 🏠 SITUACIÓN                                              │  │
│  │ ¿Trabaja? [Sí/No]  ¿Hijos? [Sí/No]  ¿Primera uni? [S/N]│  │
│  │                                                            │  │
│  │ → Perfil generado: [trabaja, preocostos, quiere_crecer]   │  │
│  │ → Siguiente recomendado: Personalizar (Flexibilidad)      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌─ PERSONALIZAR ────────────────────────────────────────────┐  │
│  │ 🎯 Objetivo: Mostrar SOLO beneficios relevantes          │  │
│  │                                                            │  │
│  │ [★★★★★] Modalidad y Flexibilidad ← RECOMENDADO           │  │
│  │          🎯 Crear confianza  🧠 Identificación            │  │
│  │          [Corto] [Medio] [Largo]                           │  │
│  │          ❓ "¿En qué momento del día?"                    │  │
│  │          → Si funciona: Validez                            │  │
│  │          → Si no funciona: Acompañamiento                  │  │
│  │                                                            │  │
│  │ [★★★★] Validez Oficial                                    │  │
│  │          🎯 Eliminar duda  🧠 Autoridad                    │  │
│  │          [Corto] [Medio] [Largo]                           │  │
│  │                                                            │  │
│  │ [★★★] Acompañamiento Académico                             │  │
│  │ [★] Platzi ← NO RELEVANTE PARA ESTE PERFIL               │  │
│  │                                                            │  │
│  │ 🎭 EMOCIÓN DETECTADA: [Interesado ▼]                      │  │
│  │                                                            │  │
│  │ → Siguiente recomendado: Persuasión                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌─ PERSUASIÓN (NUEVA) ─────────────────────────────────────┐  │
│  │ 🎯 Objetivo: Generar deseo emocional                      │  │
│  │ 🧠 Principios: Visualización + Aversión a la pérdida      │  │
│  │                                                            │  │
│  │ [★★★★★] "El tiempo va a pasar de cualquier forma..."     │  │
│  │          🎯 Crear urgencia  🧠 Costo de oportunidad       │  │
│  │          [Corto] [Medio] [Largo]                           │  │
│  │          ❓ "¿Qué cambiaría en 5 años?"                   │  │
│  │                                                            │  │
│  │ [★★★★] "Imagínate el día de tu graduación..."            │  │
│  │          🎯 Visualizar futuro  🧠 Visualización            │  │
│  │                                                            │  │
│  │ [★★★] "¿Qué le dirías a tu yo del futuro?"              │  │
│  │                                                            │  │
│  │ → Siguiente: Oferta Económica                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌─ OFERTA ECONÓMICA ───────────────────────────────────────┐  │
│  │ 🎯 Objetivo: Construir valor → revelar precio → cerrar   │  │
│  │                                                            │  │
│  │ 📋 CHECKLIST DE VALOR PRECIO                              │  │
│  │ ☑ Modalidad  ☑ Validez  ☑ Flexibilidad                   │  │
│  │ ☑ Duración  ☑ Acompañamiento  ☐ Beneficio personalizado  │  │
│  │ ⚠️ "Aún no has construido suficiente valor"               │  │
│  │                                                            │  │
│  │ 💬 "No quiero hablarte del descuento todavía..."          │  │
│  │                                                            │  │
│  │ 💰 FLUJO DE COSTOS (mejorado)                             │  │
│  │ 1. Precio lista → 2. Precio beca → 3. Referidos           │  │
│  │ → 4. Platzi → 5. Decisión S/NO                            │  │
│  │                                                            │  │
│  │ Si NO:                                                     │  │
│  │ ┌─ OBJECIONES ──────────────────────────────────────┐     │  │
│  │ │ 📊 "Es caro" = emoción: miedo a perder dinero     │     │  │
│  │ │ ❌ NO digas: "Pero es una inversión"              │     │  │
│  │ │ ✅ SÍ di: [Speech recomendado]                    │     │  │
│  │ │ ❓ Pregunta: "¿Qué te frena?"                    │     │  │
│  │ │ → Después: Escala 1-10                            │     │  │
│  │ └───────────────────────────────────────────────────┘     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                    │
│  ┌─ ACORDAR ─────────────────────────────────────────────────┐  │
│  │ 🎯 Objetivo: Confirmar + cerrar + siguiente paso         │  │
│  │                                                            │  │
│  │ 📊 CONFIRMACIÓN PROFUNDA                                  │  │
│  │ "Si resolvemos el tema económico, ¿hay algo más?"         │  │
│  │                                                            │  │
│  │ 📊 ESCALA DE CONVICCIÓN                                   │  │
│  │ "Del 1 al 10, ¿qué tan convencido te sientes?"           │  │
│  │ 1-3 → Reconstruir valor                                   │  │
│  │ 4-6 → Manejar objeciones pendientes                       │  │
│  │ 7-8 → "¿Qué te frena del 8 al 10?"                      │  │
│  │ 9-10 → Cerrar inmediatamente                              │  │
│  │                                                            │  │
│  │ 📋 DOCUMENTOS + SIGUIENTE PASO                            │  │
│  │ 💻 Demo opcional                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. PRIORIDAD DE IMPLEMENTACIÓN

### Fase 1: Tipos y Data (sin cambiar UI)
1. Crear nuevos tipos (`SmartBlock`, `SectionMeta`, `ProspectProfile`, `FlowEngine`)
2. Migrar speeches actuales al formato `SmartBlock` (una sección a la vez)
3. Crear data de señales, preguntas de regreso, principios
4. Crear `profileEngine.ts` con generación de tags

### Fase 2: Motor de recomendaciones
5. Implementar `FlowEngine` (matching de tags → blocks)
6. Implementar `ProfileBuilder` (UI para sondeo)
7. Implementar `RecommendationPanel` (panel lateral con sugerencias)

### Fase 3: Nuevos componentes
8. `SmartBlockCard` (tarjeta base con todos los campos)
9. `SectionWrapper` (wrapper genérico con header contextual)
10. Migrar secciones una por una:
    - Bienvenida (simple, buen punto de partida)
    - Sondeo (con ProfileBuilder)
    - Personalizar (con motor de recomendaciones)
    - Persuasión (nueva sección)
    - Costos (con checklist de valor)
    - Acordar (con escala 1-10)

### Fase 4: Integración
11. Reescribir `useCallStore` con nuevo state shape
12. Integrar `FlowEngine` en cada sección
13. Eliminar componentes deprecated
14. Testing y validación con asesores reales

---

## 9. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Complejidad excesiva para asesores nuevos | Alta | UI minimalista: mostrar solo lo esencial, expandir con detalle opcional |
| Performance con muchos SmartBlocks | Media | Lazy loading por sección, virtualizar listas |
| Migración de datos existentes | Media | Script de migración que convierte speeches actuales a SmartBlocks |
| Resistencia al cambio | Alta | Mantener toggle "Modo clásico" durante transición |
| Over-engineering del motor de recomendaciones | Media | Empezar con matching simple (tags → blocks) antes de ML |

---

## 10. MÉTRICAS DE ÉXITO

| Métrica | Baseline actual | Target |
|---------|----------------|--------|
| Tiempo de capacitación nuevo asesor | ~2 semanas | ~3 días |
| Tasa de inscripción | ~15-20% | ~30-35% |
| Tiempo promedio de llamada | Variable | 15-25 min (consistente) |
| % de llamadas que llegan a cierre | ~40% | ~70% |
| % de objeciones manejadas correctamente | Sin data | ~80% |
| Satisfacción del asesor con la herramienta | N/A | >8/10 |

---

*Documento generado por análisis automatizado del código fuente en `apps/visor/src/features/resources/`*
