export function id<T>(x: T): T {
  return x
}

export function Unit<T>(_: T): void {
  return
}

export function pipe<t1, t2>(x: t1, f1: (x: t1) => t2): t2
export function pipe<t1, t2, t3>(x: t1, f1: (x: t1) => t2, f2: (x: t2) => t3): t3
export function pipe<t1, t2, t3, t4>(x: t1, f1: (x: t1) => t2, f2: (x: t2) => t3, f3: (x: t3) => t4): t4
export function pipe<t1, t2, t3, t4, t5>(
  x: t1,
  f1: (x: t1) => t2,
  f2: (x: t2) => t3,
  f3: (x: t3) => t4,
  f4: (x: t4) => t5
): t5
export function pipe<t1, t2, t3, t4, t5, t6>(
  x: t1,
  f1: (x: t1) => t2,
  f2: (x: t2) => t3,
  f3: (x: t3) => t4,
  f4: (x: t4) => t5,
  f5: (x: t5) => t6
): t6
export function pipe<t1, t2, t3, t4, t5, t6, t7>(
  x: t1,
  f1: (x: t1) => t2,
  f2: (x: t2) => t3,
  f3: (x: t3) => t4,
  f4: (x: t4) => t5,
  f5: (x: t5) => t6,
  f6: (x: t6) => t7
): t7
export function pipe<t1, t2, t3, t4, t5, t6, t7, t8>(
  x: t1,
  f1: (x: t1) => t2,
  f2: (x: t2) => t3,
  f3: (x: t3) => t4,
  f4: (x: t4) => t5,
  f5: (x: t5) => t6,
  f6: (x: t6) => t7,
  f7: (x: t7) => t8
): t8
export function pipe<t1, t2, t3, t4, t5, t6, t7, t8, t9>(
  x: t1,
  f1: (x: t1) => t2,
  f2: (x: t2) => t3,
  f3: (x: t3) => t4,
  f4: (x: t4) => t5,
  f5: (x: t5) => t6,
  f6: (x: t6) => t7,
  f7: (x: t7) => t8,
  f8: (x: t8) => t9
): t9
export function pipe<t1, t2, t3, t4, t5, t6, t7, t8, t9, t10>(
  x: t1,
  f1: (x: t1) => t2,
  f2: (x: t2) => t3,
  f3: (x: t3) => t4,
  f4: (x: t4) => t5,
  f5: (x: t5) => t6,
  f6: (x: t6) => t7,
  f7: (x: t7) => t8,
  f8: (x: t8) => t9,
  f9: (x: t9) => t10
): t10
// biome-ignore lint:
export function pipe(x: any, ...funcs: any[]): any {
  return funcs.reduce((v, f) => f(v), x)
}
