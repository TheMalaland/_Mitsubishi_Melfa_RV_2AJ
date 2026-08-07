// Minimal row-major 4x4 homogeneous transform helpers, used instead of a
// symbolic toolbox (the original MATLAB code used the Symbolic Math Toolbox).
export type Mat4 = number[]; // length 16, row-major

export function multiply(a: Mat4, b: Mat4): Mat4 {
  const r = new Array<number>(16).fill(0);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[i * 4 + k] * b[k * 4 + j];
      r[i * 4 + j] = sum;
    }
  }
  return r;
}

export function chain(mats: Mat4[]): Mat4[] {
  const out: Mat4[] = [];
  let acc = mats[0];
  out.push(acc);
  for (let i = 1; i < mats.length; i++) {
    acc = multiply(acc, mats[i]);
    out.push(acc);
  }
  return out;
}

export function translation(m: Mat4): { x: number; y: number; z: number } {
  return { x: m[3], y: m[7], z: m[11] };
}

// Standard Denavit-Hartenberg transform, ported from GetDHParameters.m
export function dhTransform(angleRad: number, d: number, a: number, alphaRad: number): Mat4 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  const ca = Math.cos(alphaRad);
  const sa = Math.sin(alphaRad);
  return [
    c, -s * ca, s * sa, a * c,
    s, c * ca, -c * sa, a * s,
    0, sa, ca, d,
    0, 0, 0, 1,
  ];
}
