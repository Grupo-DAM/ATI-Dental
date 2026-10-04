import { ToothCondition, ToothNumber } from "@/types/clinical-record";
import { useMemo } from "react";

const ADULT_CUADRANTS = [ 1, 2, 3, 4 ];
const PEDIATRIC_CUADRANTS = [ 5, 6, 7, 8 ];

const TEETH_PER_CUADRANT_ADULT = 8;
const TEETH_PER_CUADRANT_PEDRIATIC = 5;

export type TeethPerCuadrant = Record<number, ToothCondition[]>;

export function useDentalPiecesPerCuadrant(isAdult:boolean, teeth?: Record<number, ToothCondition>): TeethPerCuadrant {

    return useMemo(() => {
        const safeTeeth = teeth || {}; 
        const result: TeethPerCuadrant = {};

        
        const teethCount = isAdult? TEETH_PER_CUADRANT_ADULT: TEETH_PER_CUADRANT_PEDRIATIC;
        const cuadrants = isAdult ? ADULT_CUADRANTS : PEDIATRIC_CUADRANTS;

        cuadrants.forEach((cuadrant) => {
            result[cuadrant] = [];
            for (let i = 1; i <= teethCount; i++) {
                const toothNumber = (cuadrant * 10 + i) as ToothNumber;

                // Si no existe, asumimos que está sano creando la estructura por defecto.
                if (safeTeeth[toothNumber]) {
                    result[cuadrant].push(safeTeeth[toothNumber]);
                } else {
                    result[cuadrant].push({
                        number: toothNumber,
                        generalStates: [], // Arreglo vacío = Sano
                    });
                }
            }
        });

        return result
    }, [isAdult, teeth])
}