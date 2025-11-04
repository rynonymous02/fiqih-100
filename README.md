# Family 100 Game (Fiqih/Thaharah Edition)

Proyek ini adalah implementasi game Family 100 berbasis web, dengan soal-soal seputar fiqih dan thaharah. Terdapat tiga mode tampilan: Host (pengendali), Player (peserta), dan Display (layar utama).

## Fitur

- Server WebSocket dan HTTP menggunakan Node.js, Express, dan ws.
- Tampilan web untuk host, player, dan display.
- Soal dan jawaban dapat dikembangkan sesuai kebutuhan.

## Instalasi

1. **Clone repository** (jika belum):
   ```
   git clone <url-repo-anda>
   cd family-100
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

## Menjalankan Server

Jalankan perintah berikut:
```
npm start
```
Secara default, server akan berjalan di `http://localhost:3000`.

## Cara Menggunakan

### 1. Display (Layar Utama)
- Buka browser dan akses:  
  `http://localhost:3000/family`
- Tampilkan di layar besar/proyektor untuk semua peserta.

### 2. Host (Pengendali/Juri)
- Buka browser (bisa di perangkat berbeda) dan akses:  
  `http://localhost:3000/host`
- Host mengatur soal, membuka jawaban, memberi poin, dan mengatur jalannya permainan.

### 3. Player (Peserta)
- Setiap peserta membuka:  
  `http://localhost:3000/player`
- Masukkan nama dan pilih tim, lalu siap untuk menjawab.

> **Catatan:**  
> Semua perangkat harus terhubung ke jaringan yang sama dengan server.

## Struktur Folder

- `server.js` : Server utama (Express + WebSocket)
- `public/` : Berisi file HTML untuk host, player, dan display
- `sound/` dan `public/sound/` : Efek suara game
- `image/` dan `public/image/` : Logo/icon

## Pengembangan

- Soal dan jawaban dapat diubah pada variabel `questionsDatabase` di `server.js`.
- Untuk menambah/mengganti suara atau gambar, tambahkan file ke folder terkait.

## Lisensi

Bebas digunakan untuk edukasi dan pengembangan lebih lanjut.