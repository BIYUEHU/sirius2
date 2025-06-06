export interface Position {
  dimension: 0 | 1 | 2 // 0: Overworld, 1: Nether, 2: End
  x: number
  y: number
  z: number
}

export const homes: Record<string, Record<string, Position>> = {}
export const warps: Record<string, Position> = {}
