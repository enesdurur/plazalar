// Burgaz Yönetim'in /select-plaza ekranında kullanılan sabit plaza sırası — Kapital
// dashboard'undaki (MTTA/MTTR grafikleri, plaza kartları) sıralama da bununla tutarlı
// olsun diye buradan paylaşılıyor.
export const PLAZA_ORDER = [
  "Square Plaza",
  "Link Plaza",
  "Olive Plaza",
  "DLP No.1 Plaza",
  "Maslak No.19",
  "Maslak No.23-25 Plaza",
  "Uso Center",
  "Fındıklı Abisa Plaza",
];

export function sortByPlazaOrder<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = PLAZA_ORDER.indexOf(a.name);
    const bi = PLAZA_ORDER.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}
