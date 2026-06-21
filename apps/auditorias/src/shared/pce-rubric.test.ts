import { describe, it, expect } from 'vitest'
import { buildChecklist, evaluateHeuristic, PCE_CATEGORIES } from './pce-rubric'

describe('PCE Rubric - buildChecklist', () => {
  it('returns compliant when all subitems pass', () => {
    const subitems: Record<string, boolean> = {}
    for (const cat of PCE_CATEGORIES) {
      for (const sub of cat.subitems) {
        subitems[sub.id] = true
      }
    }
    const result = buildChecklist(subitems, {}, 'LÍNEA')
    expect(result.isCompliant).toBe(true)
    expect(result.totalScore).toBeGreaterThanOrEqual(7.0)
  })

  it('returns non-compliant when no subitems pass', () => {
    const subitems: Record<string, boolean> = {}
    for (const cat of PCE_CATEGORIES) {
      for (const sub of cat.subitems) {
        subitems[sub.id] = false
      }
    }
    // C5 items (except c5_seg) default to true, so set them explicitly false
    subitems.c5_int = false
    subitems.c5_tip = false
    subitems.c5_pla = false
    subitems.c5_reg = false
    subitems.c5_seg = false

    const result = buildChecklist(subitems, {}, 'LÍNEA')
    expect(result.isCompliant).toBe(false)
    expect(result.totalScore).toBe(0)
  })

  it('has all 5 categories in the checklist', () => {
    const result = buildChecklist({}, {}, 'LÍNEA')
    expect(result.checklist).toHaveLength(5)
    expect(result.checklist.map(c => c.id)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5'])
  })

  it('sets C5 items (except c5_seg) as true by default', () => {
    const result = buildChecklist({}, {}, 'LÍNEA')
    const c5 = result.checklist.find(c => c.id === 'C5')
    expect(c5).toBeDefined()
    const c5Int = c5!.subitems.find(s => s.id === 'c5_int')
    const c5Seg = c5!.subitems.find(s => s.id === 'c5_seg')
    expect(c5Int?.checked).toBe(true)
    expect(c5Seg?.checked).toBe(false)
  })

  it('respects passed feedbackMap', () => {
    const feedbackMap = { 'CONOCE A TU CLIENTE': 'Feedback personalizado' }
    const result = buildChecklist({ c1_linea: true }, feedbackMap, 'LÍNEA')
    const c1 = result.checklist.find(c => c.id === 'C1')
    expect(c1?.feedback).toBe('Feedback personalizado')
  })

  it('uses default feedback when not in feedbackMap', () => {
    const result = buildChecklist({}, {}, 'LÍNEA')
    const c2 = result.checklist.find(c => c.id === 'C2')
    expect(c2?.feedback).toBe('Institucionalidad y modelo educativo.')
  })

  it('detects modalidad correctly', () => {
    const result = buildChecklist({}, {}, 'EJECUTIVA')
    expect(result.modalidadDetectada).toBe('EJECUTIVA')
  })
})

describe('PCE Rubric - evaluateHeuristic', () => {
  it('returns a valid result for minimal input', () => {
    const result = evaluateHeuristic(
      [{ text: 'hola' }, { text: 'mundo' }],
      'hola mundo',
    )
    expect(result).toHaveProperty('totalScore')
    expect(result).toHaveProperty('isCompliant')
    expect(result).toHaveProperty('checklist')
    expect(result).toHaveProperty('emotionalAnalysis')
    expect(result.checklist).toHaveLength(5)
  })

  it('detects keywords and sets subitems accordingly', () => {
    const fullText = 'El programa de licenciatura tiene un costo de 5000 pesos. Hay beca disponible. Interesado en inicio inmediato.'
    const result = evaluateHeuristic([{ text: fullText }], fullText.toLowerCase())
    const allSubitems = result.checklist.flatMap(c => c.subitems)
    const c1Prog = allSubitems.find(s => s.id === 'c1_programa')
    const c3Costos = allSubitems.find(s => s.id === 'c3_costos')
    expect(c1Prog?.checked).toBe(true)
    expect(c3Costos?.checked).toBe(true)
  })

  it('returns compliant for a high-quality call transcript', () => {
    const fullText = [
      'hola buenas tardes te habla de utel universidad',
      'estamos viendo el programa de licenciatura',
      'tiene un costo de 5000 pesos mensuales',
      'hay beca del 35 por ciento disponible',
      'la jornada es de 15 horas semanales',
      'necesito tus documentos para inicio',
      'te contacto mañana para seguimiento',
      'puedes referir a algún amigo',
      'gracias por tu interés',
    ].join('. ')
    const result = evaluateHeuristic([{ text: fullText }], fullText.toLowerCase())
    expect(result.totalScore).toBeGreaterThanOrEqual(5)
  })

  it('detects modalidad EJECUTIVA from keywords', () => {
    const fullText = 'La modalidad ejecutiva incluye networking con expertos del sector.'
    const result = evaluateHeuristic([{ text: fullText }], fullText.toLowerCase())
    expect(result.modalidadDetectada).toBe('EJECUTIVA')
  })

  it('detects modalidad HÍBRIDA from keywords', () => {
    const fullText = 'La modalidad híbrida incluye sesiones presenciales en cdmx.'
    const result = evaluateHeuristic([{ text: fullText }], fullText.toLowerCase())
    expect(result.modalidadDetectada).toBe('HÍBRIDA')
  })
})
