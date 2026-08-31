// Daftar kategori aplikasi, dipakai bersama oleh HandoverForm.tsx (dropdown
// Kategori Aplikasi) dan MasterData.tsx (checkbox kategori pada Konfigurasi
// Checklist). Sebelumnya daftar ini di-hardcode terpisah di HandoverForm.tsx
// saja — kalau ada kategori baru ditambah di sana, MasterData.tsx tidak akan
// pernah tahu (checklist item tidak akan pernah bisa dibatasi ke kategori
// itu). Satu sumber di sini mencegah dua daftar itu diam-diam melenceng.
export const APPLICATION_CATEGORIES = [
  'Operations', 'Upstream', 'Production', 'Drilling', 'Integrity', 'HSE',
  'Finance', 'Procurement', 'Supply Chain', 'Trading', 'Analytics',
  'Geoscience', 'Geospatial', 'Asset', 'Maintenance', 'Laboratory',
  'Compliance', 'HR', 'Document',
] as const