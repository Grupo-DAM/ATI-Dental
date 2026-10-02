import { renderHook } from '@testing-library/react-native';
import { useToothAsset } from '@/hooks/use-tooth-asset';

describe('useToothAsset Custom Hook Suite', () => {
  
  // ── CASO 1: CUADRANTES BASE ADULTOS (NO REQUIEREN FLIP) ──
  describe('Cuadrantes Base Adultos (Sin Inversión)', () => {
    it('debe retornar la referencia de recurso y la bandera flip en falso para el cuadrante 2 (Superior Izquierdo)', () => {
      const { result } = renderHook(() => useToothAsset(21)); // Incisivo central superior izquierdo
      
      expect(result.current.dentalPieceSource).toBeTruthy(); // Verifica que devuelva un asset válido indexado (1)
      expect(result.current.flip).toBe(false);
    });

    it('debe retornar la referencia de recurso y la bandera flip en falso para el cuadrante 3 (Inferior Izquierdo)', () => {
      const { result } = renderHook(() => useToothAsset(36)); // Primer molar inferior izquierdo
      
      expect(result.current.dentalPieceSource).toBeTruthy();
      expect(result.current.flip).toBe(false);
    });
  });

  // ── CASO 2: CUADRANTES ESPEJO ADULTOS (CON INVERSIÓN) ──
  describe('Cuadrantes Espejo Adultos (Con Inversión)', () => {
    it('debe mapear el cuadrante 1 (Superior Derecho) y activar la bandera flip', () => {
      const { result } = renderHook(() => useToothAsset(11)); // Incisivo central superior derecho
      
      expect(result.current.dentalPieceSource).toBeTruthy();
      expect(result.current.flip).toBe(true); // Requiere inversión horizontal para simetría
    });

    it('debe mapear el cuadrante 4 (Inferior Derecho) y activar la bandera flip', () => {
      const { result } = renderHook(() => useToothAsset(46)); // Primer molar inferior derecho
      
      expect(result.current.dentalPieceSource).toBeTruthy();
      expect(result.current.flip).toBe(true); // Requiere inversión horizontal para simetría
    });
  });

  // ── CASO 3: ODONTOPEDIATRÍA / DIENTES TEMPORALES (NIÑOS) ──
  describe('Cuadrantes Infantiles (Pediátricos)', () => {
    it('debe retornar la referencia de recurso y flip en falso para el cuadrante 6 (Superior Izquierdo Infantil)', () => {
      const { result } = renderHook(() => useToothAsset(63)); // Canino temporal superior izquierdo
      
      expect(result.current.dentalPieceSource).toBeTruthy();
      expect(result.current.flip).toBe(false);
    });

    it('debe mapear el cuadrante 5 (Superior Derecho Infantil) al cuadrante 6 y activar la bandera flip', () => {
      const { result } = renderHook(() => useToothAsset(53)); // Canino temporal superior derecho
      
      expect(result.current.dentalPieceSource).toBeTruthy();
      expect(result.current.flip).toBe(true);
    });

    it('debe retornar la referencia de recurso y flip en falso para el cuadrante 7 (Inferior Izquierdo Infantil)', () => {
      const { result } = renderHook(() => useToothAsset(75)); // Segundo molar temporal inferior izquierdo
      
      expect(result.current.dentalPieceSource).toBeTruthy();
      expect(result.current.flip).toBe(false);
    });

    it('debe mapear el cuadrante 8 (Inferior Derecho Infantil) al cuadrante 7 y activar la bandera flip', () => {
      const { result } = renderHook(() => useToothAsset(85)); // Segundo molar temporal inferior derecho
      
      expect(result.current.dentalPieceSource).toBeTruthy();
      expect(result.current.flip).toBe(true);
    });
  });

  // ── CASO 4: CONTROL DE SEGURIDAD / FALLBACKS ──
  describe('Casos de Borde', () => {
    it('debe retornar null o valor vacío si se consulta una pieza fuera de rango no registrada en el diccionario', () => {
      const { result } = renderHook(() => useToothAsset(99)); // Código FDI irreal
      
      // Valida que el hook responda de manera segura sin colapsar la app
      expect(result.current.dentalPieceSource).toBeNull();
    });
  });
});
