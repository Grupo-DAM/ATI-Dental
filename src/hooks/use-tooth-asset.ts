import { useMemo } from 'react';

const TOOTH_ASSETS: Record<number, any> = {
    21: require('@/assets/odontogram/piece21.svg'),
    22: require('@/assets/odontogram/piece22.svg'),
    23: require('@/assets/odontogram/piece23.svg'),
    24: require('@/assets/odontogram/piece24.svg'),
    25: require('@/assets/odontogram/piece25.svg'),
    26: require('@/assets/odontogram/piece26.svg'),
    27: require('@/assets/odontogram/piece27.svg'),
    28: require('@/assets/odontogram/piece28.svg'),
    31: require('@/assets/odontogram/piece31.svg'),
    32: require('@/assets/odontogram/piece32.svg'),
    33: require('@/assets/odontogram/piece33.svg'),
    34: require('@/assets/odontogram/piece34.svg'),
    35: require('@/assets/odontogram/piece35.svg'),
    36: require('@/assets/odontogram/piece36.svg'),
    37: require('@/assets/odontogram/piece37.svg'),
    38: require('@/assets/odontogram/piece38.svg'),
    61: require('@/assets/odontogram/piece61.svg'),
    62: require('@/assets/odontogram/piece62.svg'),
    63: require('@/assets/odontogram/piece63.svg'),
    64: require('@/assets/odontogram/piece64.svg'),
    65: require('@/assets/odontogram/piece65.svg'),
    71: require('@/assets/odontogram/piece71.svg'),
    72: require('@/assets/odontogram/piece72.svg'),
    73: require('@/assets/odontogram/piece73.svg'),
    74: require('@/assets/odontogram/piece74.svg'),
    75: require('@/assets/odontogram/piece75.svg'),
}
//El odontograma es simétrico, los cuadrantes 1, 4, 5 y 8 usan los mismos assets pero volteados horizontalmente
const cuadrantsInAssets: Record<number,number> = {
    1: 2, 2: 2, 3: 3, 4: 3,
    5: 6, 6: 6, 7: 7, 8: 7
} as const;

export function useToothAsset(pieceNumber: number) {
    const cuadrant = Math.floor(pieceNumber / 10); // get the piece cuadrant
    const pieceInCuadrant = pieceNumber % 10; // get piece number inside de cuadrant

    const cuadrantAsset = cuadrantsInAssets[cuadrant];
    const flip = cuadrantAsset !== cuadrant; // flip is if from the oposite cuadrant 
    const piece = cuadrantAsset * 10 + pieceInCuadrant;

    const dentalPieceSource = useMemo(() => {
        return TOOTH_ASSETS[piece] || null;
    }, [pieceNumber]);

    return { dentalPieceSource, flip };
}