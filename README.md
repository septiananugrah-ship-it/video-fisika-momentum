# Yang Tak Pernah Hilang — Momentum & Impuls (Fisika Umum)

Video edukasi (2K, 30 FPS) · **SCIENTIAN — Explore Science with Yayan** · disusun oleh **Septian Anugrah Dwi Putra**. Seri Fisika Umum #4 (sebelumnya: Usaha & Energi, Fluida Statis, Momentum). Dibuat dengan [Remotion](https://remotion.dev).

Gaya visual seri **"Lab"** bernuansa tumbukan: benda bergerak sesuai hitungan kekekalan momentum, panah momentum ungu yang berpindah antarbenda, kode warna tetap (momentum ungu · kecepatan toska · gaya kuning · impuls hijau · energi kinetik jingga · energi hilang merah). Tanpa intro terpisah: judul pembuka memuat logo S + "Explore Science with Yayan".

## Isi

| Bagian | Bab |
|---|---|
| Pembuka | Ayunan Newton, dua pemain sepatu luncur, roket di ruang hampa · judul · peta video |
| 1 · Konsep & cara berpikir | 01 Momentum · 02 Impuls · 03 Memperlama tumbukan · 04 Kekekalan momentum · 05 Saling dorong & tolakan · 06 Tiga jenis tumbukan · 07 Gerbong menyambung · 08 Tumbukan lenting · 09 Koefisien restitusi · 10 Tumbukan dua dimensi · 11 Cara berpikir soal momentum |
| 2 · Momentum di dunia kimia | 12 Tekanan gas · 13 Teori tumbukan reaksi · 14 Momentum cahaya |
| 3 · Penerapan | 15 Keselamatan berkendara · 16 Bandul balistik · 17 Roket |
| Penutup | 18 Rangkuman · rujukan |

Daftar bab bertimecode ada di `naskah/BAB_YOUTUBE.txt`, naskah teleprompter di `naskah/NASKAH_VOICEOVER.md` (cocok juga untuk merekam suara sendiri), audit angka di `naskah/AUDIT.md`.

## Render (tombol ditekan sendiri, tab **Actions**)

- **Belum ada suara?** Jalankan **Render Momentum 2K 30FPS → Run workflow** dengan isian bawaan → versi musik + subtitle (`momentum-tanpa-narasi-2k-30fps`).
- **Dengan narasi:** **Buat voice-over + render 2K → Run workflow**, pilih `mesin`:
  - `elevenlabs` — suara klon. Isi secret `ELEVENLABS_API_KEY` dan `ELEVENLABS_VOICE_ID` (Settings → Secrets and variables → Actions), atau isi voice ID di form. ±19 ribu karakter untuk seluruh naskah (muat dalam kuota Starter 30 ribu/bulan).
  - `edge` — gratis, tanpa kunci (suara Microsoft `id-ID-ArdiNeural` laki-laki / `id-ID-GadisNeural` perempuan).
  Workflow membuat suara per baris, menyesuaikan timeline/subtitle/musik dengan durasi suara asli, menyimpannya ke repo, lalu merender versi **dengan narasi** dan **tanpa narasi**.
- Setelah suara jadi, disarankan **Cek pengucapan narasi (Whisper)**.
- Unduh artefak di halaman run (iPad: tekan lama nama artefak → *Unduh Tautan Tertaut*).

Baris yang teksnya diubah: hapus `public/voiceover/<kode>.mp3` agar dibuat ulang (workflow hanya membuat baris yang belum ada). Rekaman suara sendiri: simpan per baris dengan kode di `naskah/NASKAH_VOICEOVER.md`, lalu `npm run voiceover -- --measure`.

## Menjalankan sendiri

```bash
npm ci
npm run dev                # Remotion Studio: "Momentum", "Momentum2K", atau folder "Adegan"
npm run timeline           # perbarui naskah VO, SRT, BAB_YOUTUBE, peta musik
npm run music              # sintesis ulang musik (python3 + numpy + ffmpeg)
npm run lint               # cek tipe TypeScript
```

## Struktur

```
src/script.ts           naskah per adegan (teks, kata kunci, jeda, ejaan TTS opsional)
src/tts.ts              teks ramah-TTS (ejaan huruf & simbol)
src/timeline.ts         waktu baris & kata (estimasi suku kata, atau durasi rekaman asli)
src/components/         latar cetak biru, subtitle, heading bab, primitif rumus, komponen fisika (batang energi, pegas, balok, grafik) + fluida (air bergelombang, tangki, panah tekanan, gelembung)
src/scenes/             23 adegan
scripts/                voice-over (ElevenLabs/Edge), musik orisinal (numpy), cek pengucapan, render potongan & gabung, QA still
```
