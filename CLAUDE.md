# Konteks repo (untuk asisten AI)

- Video **"Yang Tak Pernah Hilang" — Momentum & Impuls** (Fisika Umum, S1 Kimia UNESA) milik **Yayan** (Septian Anugrah Dwi Putra), seri Fisika Umum #4 (terakhir). Seri #1 `video-fisika-energi`, #2 `video-fisika-fluida-statis`, #3 `video-fisika-fluida-dinamis` (mesin, komponen, dan alur kerja disalin dari #3). Aturan umum & pelajaran teknis: repo `septiananugrah-ship-it/science-intro` → `CLAUDE.md`.
- Angka yang dipakai dicek di `naskah/AUDIT.md`.
- Branding: **tanpa intro SCIENTIAN terpisah** — judul menampilkan kapsul logo S + "Explore Science with Yayan"; outro SCIENTIAN + "Disusun oleh Septian Anugrah Dwi Putra" + pil penutup seri.
- Gaya seri **"Lab"** (malam biru tinta + kisi cetak biru, Space Grotesk/Inter/JetBrains Mono/Source Serif 4) dengan nuansa **tumbukan**: benda yang bergerak & bertumbukan sesuai hitungan (posisi analitik per frame), panah momentum yang berpindah antarbenda, riak/kilatan saat tumbukan.
- **Kode warna**: momentum p = ungu `C.spr`, kecepatan v = toska `C.cyan`, gaya F = kuning `C.force`, impuls J = hijau `C.work`, energi kinetik K = jingga `C.kin`, energi hilang (panas/bunyi) = merah `C.heat`, tekanan gas = merah muda `C.press`.
- Komponen: `physics.tsx` (Crate, Ball, Car, Person, Spring, EnergyBars, Plot…), `flow.tsx`, `fluid.tsx`, `primitives.tsx` (Arrow berdenyut, Spark trail, Ripple, Card, Formula…).
- **Semua adegan harus terus bergerak** — panduan lengkap `naskah/POLISH.md`.
- **Claude tidak menjalankan workflow GitHub Actions.** Setelah merge ke `main`, berhenti dan minta pengguna menekan *Run workflow* sendiri; beri link & isian.
- Narasi: menyusul (ElevenLabs suara klon, atau Edge TTS gratis lewat input `mesin`). Selalu sediakan versi tanpa narasi.

## Aturan konten & tata letak

- Rumus utama ≥ 56 px (`Formula`), satu kartu per momen; zona subtitle (bawah 180 px) selalu bebas; margin ≥ 80 px. Komponen HTML di luar `<Stage>`.
- g = 10 m/s², arah kanan positif. "≈" untuk perkiraan. Koma desimal.
- Fisika gerak harus benar: kecepatan sesudah tumbukan dihitung dari kekekalan momentum (dan K / e bila perlu), bukan ditebak; panjang panah ∝ besaran dengan skala yang sama sebelum/sesudah.
- Teks TTS terpisah dari subtitle (`src/tts.ts`; huruf tunggal & nama tokoh dieja otomatis).
- Kemulusan: `EASE` lembut, fade keluar `EASE_IN_OUT`; tanpa ganti berdasarkan ambang (silang-pudar); tanpa CSS blur; tanpa filter pada garis lurus.

## QA

- `CHROME_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell node scripts/qa-moments.mjs out/x adegan:baris:offset ...` lalu `python3 scripts/contact.py out/x out/x-sheets 6` (offset positif = detik setelah baris mulai).
- `scripts/qa-lines.mjs` = still di akhir setiap baris narasi (audit menyeluruh); `scripts/qa-audit.mjs` = awal/tengah/akhir + transisi.
- Uji kemulusan: `node scripts/qa-film.mjs out/a.mp4 <frameAwal> <frameAkhir> 0.25` lalu `python3 scripts/qa-glitch.py out/a.mp4 <frameAwal>`.
