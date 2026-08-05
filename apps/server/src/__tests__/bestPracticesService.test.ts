/**
 * Tests for the learning/best-practices service.
 * Validates: classification por etapa/objeción, extracción de momentos ganadores
 * y selección de las mejores llamadas.
 */
import { describe, it, expect } from "vitest";
import {
  classifySection,
  classifyObjection,
  extractWinMoments,
  selectWinningCalls,
  normalizeSectionId,
  normalizeObjectionId,
  type TopCall,
} from "../services/bestPracticesService.js";

function makeTopCall(overrides: Partial<TopCall> = {}): TopCall {
  return {
    id: "call_1",
    metadata: { fileName: "test.mp3" },
    score: { global: 90 },
    scoreGlobal: 90,
    salesOutcome: "venta_cerrada",
    transcription: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("classifySection", () => {
  it("detecta bienvenida/apertura", () => {
    expect(classifySection("Hola, muy buenos días, me comunico de UTEL. Mucho gusto, ¿con quién tengo el gusto?")).toBe("bienvenida");
  });

  it("detecta sondeo/descubrimiento", () => {
    expect(classifySection("Cuéntame, ¿qué te motivó a buscar una licenciatura en este momento?")).toBe("sondeo");
  });

  it("detecta personalizar (modelo UTEL)", () => {
    expect(classifySection("UTEL nació como universidad en línea, nuestro modelo educativo te ofrece flexibilidad con el aula virtual disponible 24 horas.")).toBe("personalizar");
  });

  it("detecta costos", () => {
    expect(classifySection("Te comento que la colegiatura es accesible y tenemos facilidades de pago y beca.")).toBe("costos");
  });

  it("detecta acuerdos y cierre", () => {
    expect(classifySection("Para tu inscripción solo necesitamos tus documentos y agendamos el inicio de clases.")).toBe("acordar");
  });

  it("devuelve null para texto sin señales", () => {
    expect(classifySection("Hola mundo de prueba sin contexto comercial.")).toBeNull();
  });
});

describe("classifyObjection", () => {
  it("detecta objeción de costos con contexto", () => {
    expect(classifyObjection("Es muy caro, no me alcanza el presupuesto", true)).toBe("costos");
  });

  it("detecta objeción de duda", () => {
    expect(classifyObjection("Déjame pensarlo, necesito tiempo para decidir", true)).toBe("duda");
  });

  it("detecta objeción de tiempo", () => {
    expect(classifyObjection("No tengo tiempo, trabajo todo el día", true)).toBe("tiempo");
  });

  it("devuelve null sin contexto de cliente (evita falsos positivos)", () => {
    expect(classifyObjection("Es muy caro, no me alcanza el presupuesto", false)).toBeNull();
  });
});

describe("extractWinMoments", () => {
  it("agrupa líneas del vendedor y captura el contexto del cliente", () => {
    const call = makeTopCall({
      transcription: [
        { speaker: "Cliente", text: "Hola, quiero información de la licenciatura", start: 0, end: 3 },
        { speaker: "Vendedor", text: "Hola, muy buenos días, me comunico de UTEL Universidad. Mucho gusto, ¿con quién tengo el gusto?", start: 4, end: 9 },
        { speaker: "Vendedor", text: "Para brindarte la mejor atención, ¿qué te motivó a buscar esta licenciatura?", start: 10, end: 15 },
        { speaker: "Cliente", text: "Me parece muy caro, no me alcanza el presupuesto", start: 16, end: 19 },
        { speaker: "Vendedor", text: "Entiendo que te parezca caro. Te comento que la colegiatura es accesible y tenemos facilidades de pago y beca.", start: 20, end: 26 },
        { speaker: "Vendedor", text: "Además podrías comenzar la inscripción con tus documentos en esta misma semana.", start: 27, end: 32 },
      ],
    });

    const moments = extractWinMoments(call);
    expect(moments.length).toBe(2);

    expect(moments[0].context).toBe("Hola, quiero información de la licenciatura");
    expect(moments[0].section).toBe("bienvenida");
    expect(moments[0].text).toContain("Mucho gusto");

    expect(moments[1].context).toBe("Me parece muy caro, no me alcanza el presupuesto");
    expect(moments[1].section).toBe("costos");
    expect(moments[1].objection).toBe("costos");
  });

  it("descarta líneas demasiado cortas", () => {
    const call = makeTopCall({
      transcription: [
        { speaker: "Cliente", text: "Hola", start: 0, end: 1 },
        { speaker: "Vendedor", text: "Hola", start: 2, end: 3 },
      ],
    });
    expect(extractWinMoments(call)).toHaveLength(0);
  });

  it("respeta el límite de momentos por llamada", () => {
    const transcription: any[] = [];
    for (let i = 0; i < 8; i++) {
      transcription.push(
        { speaker: "Cliente", text: `Pregunta ${i}`, start: i * 10, end: i * 10 + 3 },
        { speaker: "Vendedor", text: `Perfecto, te comento que la colegiatura de UTEL es accesible con facilidades de pago y beca para tu presupuesto.`, start: i * 10 + 4, end: i * 10 + 9 },
      );
    }
    const call = makeTopCall({ transcription });
    expect(extractWinMoments(call).length).toBeLessThanOrEqual(6);
  });
});

describe("selectWinningCalls", () => {
  it("incluye venta cerrada o score alto y ordena por score", () => {
    const calls: TopCall[] = [
      makeTopCall({ id: "a", scoreGlobal: 90, salesOutcome: "interesado_seguimiento" }),
      makeTopCall({ id: "b", scoreGlobal: 60, salesOutcome: "venta_cerrada" }),
      makeTopCall({ id: "c", scoreGlobal: 70, salesOutcome: "no_interesado" }),
      makeTopCall({ id: "d", scoreGlobal: 50, salesOutcome: "venta_cerrada" }),
    ];

    const winners = selectWinningCalls(calls, 10);
    expect(winners.map((c) => c.id)).toEqual(["a", "b", "d"]);
  });

  it("respeta el límite", () => {
    const calls: TopCall[] = [
      makeTopCall({ id: "a", scoreGlobal: 95, salesOutcome: "venta_cerrada" }),
      makeTopCall({ id: "b", scoreGlobal: 90, salesOutcome: "venta_cerrada" }),
      makeTopCall({ id: "c", scoreGlobal: 88, salesOutcome: "venta_cerrada" }),
    ];
    expect(selectWinningCalls(calls, 2)).toHaveLength(2);
  });
});

describe("normalización de ids del prompt IA", () => {
  it("normaliza secciones válidas", () => {
    expect(normalizeSectionId("Costos")).toBe("costos");
    expect(normalizeSectionId("bienvenida")).toBe("bienvenida");
    expect(normalizeSectionId("persuasión")).toBeNull();
    expect(normalizeSectionId(undefined)).toBeNull();
  });

  it("normaliza objeciones válidas", () => {
    expect(normalizeObjectionId("Familia")).toBe("familia");
    expect(normalizeObjectionId("duda")).toBe("duda");
    expect(normalizeObjectionId("otro")).toBeNull();
  });
});
