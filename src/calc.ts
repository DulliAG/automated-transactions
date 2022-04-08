export function calc(capital: number, interest: number, days: number) {
  // K * (1 + (zs / 100)) ^ laufzeit
  return (capital * Math.pow(1 + interest / 100, days)).toFixed(2);
}
