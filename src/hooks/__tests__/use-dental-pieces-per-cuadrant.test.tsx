import { renderHook } from '@testing-library/react-native';
import { useDentalPiecesPerCuadrant } from '@/hooks/use-dental-pieces-per-cuadrant';
import { ToothCondition } from '@/types/clinical-record';

describe('useDentalPiecesPerCuadrant Custom Hook Suite', () => {
  it('debe estructurar cuadrantes adultos (1, 2, 3, 4) con 8 piezas sanas por defecto si teeth es undefined', () => {
    const { result } = renderHook(() => useDentalPiecesPerCuadrant(true));

    const quadrants = result.current;

    // Verifica que existan los 4 cuadrantes adultos
    expect(Object.keys(quadrants).map(Number)).toEqual([1, 2, 3, 4]);

    // Cada cuadrante debe tener 8 piezas dencales
    expect(quadrants[1]).toHaveLength(8);
    expect(quadrants[2]).toHaveLength(8);
    expect(quadrants[3]).toHaveLength(8);
    expect(quadrants[4]).toHaveLength(8);

    // Valida la primera pieza (11) y la última (18) del cuadrante 1
    expect(quadrants[1][0]).toEqual({
      number: 11,
      generalStates: [],
    });
    expect(quadrants[1][7]).toEqual({
      number: 18,
      generalStates: [],
    });
  });

  it('debe estructurar cuadrantes pediátricos (5, 6, 7, 8) con 5 piezas dencales cada uno', () => {
    const { result } = renderHook(() => useDentalPiecesPerCuadrant(false));

    const quadrants = result.current;

    // Verifica que existan los 4 cuadrantes pediátricos
    expect(Object.keys(quadrants).map(Number)).toEqual([5, 6, 7, 8]);

    // Cada cuadrante pediátrico debe contener exactamente 5 piezas
    expect(quadrants[5]).toHaveLength(5);
    expect(quadrants[6]).toHaveLength(5);
    expect(quadrants[7]).toHaveLength(5);
    expect(quadrants[8]).toHaveLength(5);

    // Valida la numeración de la primera pieza (51) y la última (55) del cuadrante 5
    expect(quadrants[5][0].number).toBe(51);
    expect(quadrants[5][4].number).toBe(55);
  });

  it('debe sobreescribir la pieza con sus condiciones registradas cuando safeTeeth la contenga', () => {
    const mockCustomTeeth: Record<number, ToothCondition> = {
      16: {
        number: 16,
        generalStates: ['filled'],
        surfacesStates: {
          mesial: 'cavity',
          oclusal: 'filled',
        },
        notes: 'Tratamiento completado',
      },
    };

    const { result } = renderHook(() => useDentalPiecesPerCuadrant(true, mockCustomTeeth));

    const cuadrant1 = result.current[1];

    // La pieza 16 se ubica en el índice 5 del cuadrante 1 (11->0, 12->1, 13->2, 14->3, 15->4, 16->5)
    const tooth16 = cuadrant1.find((t) => t.number === 16);

    expect(tooth16).toBeDefined();
    expect(tooth16).toEqual({
      number: 16,
      generalStates: ['filled'],
      surfacesStates: {
        mesial: 'cavity',
        oclusal: 'filled',
      },
      notes: 'Tratamiento completado',
    });

    // Las demás piezas del mismo cuadrante (ej. 11) deben permanecer con estado sano por defecto
    expect(cuadrant1[0]).toEqual({
      number: 11,
      generalStates: [],
    });
  });

  it('debe memoizar el resultado y no recomputar si las referencias de isAdult y teeth permanecen idénticas', () => {
    const mockTeeth: Record<number, ToothCondition> = {
      11: { number: 11, generalStates: ['missing'] },
    };

    const { result, rerender } = renderHook(
      ({ isAdult, teeth }) => useDentalPiecesPerCuadrant(isAdult, teeth),
      {
        initialProps: { isAdult: true, teeth: mockTeeth },
      }
    );

    const firstExecutionResult = result.current;

    // Rerender con exactamente las mismas referencias
    rerender({ isAdult: true, teeth: mockTeeth });

    // La referencia retornada por useMemo debe ser estrictamente idéntica
    expect(result.current).toBe(firstExecutionResult);
  });

  it('debe recalcular el resultado si cambia isAdult de true a false', () => {
    const { result, rerender } = renderHook(
      ({ isAdult }) => useDentalPiecesPerCuadrant(isAdult),
      {
        initialProps: { isAdult: true },
      }
    );

    expect(result.current[1]).toBeDefined();
    expect(result.current[5]).toBeUndefined();

    // Cambiamos el tipo de paciente a pediátrico
    rerender({ isAdult: false });

    expect(result.current[1]).toBeUndefined();
    expect(result.current[5]).toBeDefined();
    expect(result.current[5]).toHaveLength(5);
  });
});