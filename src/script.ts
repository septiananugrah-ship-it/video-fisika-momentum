// Naskah narasi "Yang Tak Pernah Hilang" — Fisika Umum: Momentum & Impuls.
// Setiap adegan berisi baris narasi. Durasi baris dihitung otomatis dari jumlah
// suku kata (lihat timeline.ts) atau dari rekaman suara bila sudah ada,
// jadi cukup ubah teks di sini: visual, subtitle, dan musik ikut menyesuaikan.
//
// Aturan menulis teks narasi (dibaca mesin TTS):
//  - angka & simbol ditulis sebagai kata ("dua puluh meter per detik"),
//  - rumus ditulis sebagai kalimat; rumus rapi tampil di layar (komponen Formula).
// Angka sudah dicek di naskah/AUDIT.md (g = 10 m/s², ρ air = 1000 kg/m³, p_atm = 100 kPa, kecuali disebut lain).
//
// hl     : kata/frasa yang disorot pada subtitle
// pause  : jeda (detik) SETELAH baris dibacakan
// lead   : jeda (detik) sebelum baris pertama adegan
// tail   : jeda (detik) setelah baris terakhir adegan
// fixed  : durasi tetap (detik) untuk adegan tanpa narasi

export type Line = {
  text: string;
  /** Teks khusus TTS (opsional). Bila kosong, dibuat otomatis oleh src/tts.ts. */
  tts?: string;
  hl?: string[];
  pause?: number;
};

export type SceneScript = {
  id: string;
  chapter: string; // nomor bab di heading, "" untuk tanpa heading
  part?: 1 | 2 | 3; // 1 konsep & cara berpikir, 2 momentum di dunia kimia, 3 penerapan
  title: string;
  lines: Line[];
  lead?: number;
  tail?: number;
  fixed?: number;
  mood: 'mystery' | 'title' | 'wonder' | 'build' | 'tension' | 'bright' | 'resolve' | 'outro';
};

export const SCRIPT: SceneScript[] = [
  {
    "id": "hook",
    "chapter": "",
    "title": "Bola baja, sepatu luncur, dan roket",
    "mood": "mystery",
    "lead": 1.6,
    "tail": 1.2,
    "lines": [
      {
        "text": "Tarik satu bola baja di ujung ayunan Newton, lalu lepaskan.",
        "hl": [
          "ayunan Newton"
        ],
        "pause": 0.7
      },
      {
        "text": "Bola itu berhenti, tetapi bola di ujung seberang langsung terlempar, seolah sesuatu berpindah menembus bola-bola di tengah.",
        "hl": [
          "sesuatu berpindah"
        ],
        "pause": 0.8
      },
      {
        "text": "Dua pemain sepatu luncur saling mendorong. Keduanya meluncur menjauh, padahal sebelumnya sama-sama diam.",
        "hl": [
          "saling mendorong"
        ],
        "pause": 0.7
      },
      {
        "text": "Dan sebuah roket melaju di ruang hampa, tempat tidak ada apa pun untuk didorong.",
        "hl": [
          "tidak ada apa pun untuk didorong"
        ],
        "pause": 0.9
      },
      {
        "text": "Ketiganya diatur oleh satu besaran yang tidak pernah hilang:",
        "pause": 0.4
      },
      {
        "text": "momentum.",
        "hl": [
          "momentum"
        ],
        "pause": 1.0
      },
      {
        "text": "Momentum hanya bisa berpindah dari satu benda ke benda lain, tetapi jumlah totalnya selalu tetap.",
        "hl": [
          "jumlah totalnya selalu tetap"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "title",
    "chapter": "",
    "title": "Yang Tak Pernah Hilang",
    "mood": "title",
    "fixed": 8,
    "lines": []
  },
  {
    "id": "roadmap",
    "chapter": "",
    "title": "Peta video",
    "mood": "wonder",
    "lead": 0.8,
    "tail": 1.4,
    "lines": [
      {
        "text": "Video ini membahas momentum dan impuls dalam tiga bagian.",
        "hl": [
          "momentum dan impuls"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian pertama, konsep dan cara berpikir: momentum, impuls, kekekalan momentum, jenis-jenis tumbukan, dan koefisien restitusi.",
        "hl": [
          "konsep dan cara berpikir"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian kedua, momentum di dunia kimia: tekanan gas, teori tumbukan, dan momentum cahaya.",
        "hl": [
          "dunia kimia"
        ],
        "pause": 0.7
      },
      {
        "text": "Bagian ketiga, penerapan: keselamatan berkendara, bandul balistik, dan roket.",
        "hl": [
          "penerapan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "momentum",
    "chapter": "01",
    "title": "Momentum: massa kali kecepatan",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Mana yang lebih sulit dihentikan: truk yang merayap pelan, atau sebutir peluru yang melesat?",
        "hl": [
          "lebih sulit dihentikan"
        ],
        "pause": 0.8
      },
      {
        "text": "Jawabannya bergantung pada momentum, yaitu massa kali kecepatan: p sama dengan m v.",
        "hl": [
          "p sama dengan m v"
        ],
        "pause": 0.7
      },
      {
        "text": "Satuannya kilogram meter per detik. Dan karena kecepatan punya arah, momentum juga punya arah: ia besaran vektor.",
        "hl": [
          "besaran vektor"
        ],
        "pause": 0.7
      },
      {
        "text": "Truk dua ribu kilogram yang bergerak satu meter per detik bermomentum dua ribu kilogram meter per detik.",
        "hl": [
          "dua ribu"
        ],
        "pause": 0.7
      },
      {
        "text": "Peluru sepuluh gram yang melesat empat ratus meter per detik hanya bermomentum empat kilogram meter per detik.",
        "hl": [
          "empat kilogram meter per detik"
        ],
        "pause": 0.7
      },
      {
        "text": "Truk yang pelan itu membawa momentum lima ratus kali lebih besar.",
        "hl": [
          "lima ratus kali"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "impulse",
    "chapter": "02",
    "title": "Impuls: gaya kali waktu",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Bagaimana cara mengubah momentum sebuah benda? Dengan memberinya gaya selama selang waktu tertentu.",
        "hl": [
          "selang waktu"
        ],
        "pause": 0.7
      },
      {
        "text": "Gaya kali selang waktu disebut impuls, dan impuls sama dengan perubahan momentum.",
        "hl": [
          "impuls sama dengan perubahan momentum"
        ],
        "pause": 0.7
      },
      {
        "text": "Ini sebenarnya hukum kedua Newton yang ditulis ulang: F kali delta t sama dengan delta p.",
        "hl": [
          "F kali delta t sama dengan delta p"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada grafik gaya terhadap waktu, impuls adalah luas daerah di bawah kurva.",
        "hl": [
          "luas daerah di bawah kurva"
        ],
        "pause": 0.7
      },
      {
        "text": "Bola nol koma empat kilogram datang sepuluh meter per detik dan ditendang balik lima belas meter per detik.",
        "pause": 0.7
      },
      {
        "text": "Perubahan momentumnya nol koma empat kali dua puluh lima, yaitu sepuluh newton sekon. Arah balik ikut dihitung.",
        "hl": [
          "sepuluh newton sekon"
        ],
        "pause": 0.7
      },
      {
        "text": "Bila kaki menyentuh bola selama nol koma nol dua detik, gaya rata-ratanya lima ratus newton.",
        "hl": [
          "lima ratus newton"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "cushion",
    "chapter": "03",
    "title": "Memperlama tumbukan, memperkecil gaya",
    "mood": "tension",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Impuls menyimpan rahasia keselamatan.",
        "pause": 0.5
      },
      {
        "text": "Untuk menghentikan sebuah benda, perubahan momentumnya sudah pasti. Yang bisa kita pilih hanyalah lamanya waktu.",
        "hl": [
          "lamanya waktu"
        ],
        "pause": 0.7
      },
      {
        "text": "Seorang penumpang enam puluh kilogram melaju sepuluh meter per detik, lalu berhenti mendadak.",
        "pause": 0.7
      },
      {
        "text": "Bila berhenti dalam seperseratus detik karena membentur dasbor, gayanya enam puluh ribu newton.",
        "hl": [
          "enam puluh ribu newton"
        ],
        "pause": 0.7
      },
      {
        "text": "Bila sabuk pengaman dan kantong udara memperlama penghentian menjadi nol koma dua detik, gayanya tinggal tiga ribu newton.",
        "hl": [
          "tiga ribu newton"
        ],
        "pause": 0.7
      },
      {
        "text": "Perubahan momentum sama, tetapi gayanya dua puluh kali lebih kecil.",
        "hl": [
          "dua puluh kali lebih kecil"
        ],
        "pause": 0.7
      },
      {
        "text": "Itulah sebabnya kita menekuk lutut saat mendarat, dan menarik tangan ke belakang saat menangkap telur.",
        "hl": [
          "menekuk lutut"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "conservation",
    "chapter": "04",
    "title": "Hukum kekekalan momentum",
    "mood": "bright",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sekarang dua benda bertumbukan.",
        "pause": 0.5
      },
      {
        "text": "Menurut hukum ketiga Newton, gaya yang dikerjakan benda pertama pada benda kedua sama besar dan berlawanan arah dengan gaya sebaliknya.",
        "hl": [
          "sama besar dan berlawanan arah"
        ],
        "pause": 0.7
      },
      {
        "text": "Kedua gaya itu bekerja selama waktu yang sama, jadi impulsnya juga sama besar dan berlawanan.",
        "hl": [
          "impulsnya"
        ],
        "pause": 0.7
      },
      {
        "text": "Momentum yang hilang dari satu benda tepat sama dengan momentum yang diterima benda lain.",
        "hl": [
          "tepat sama"
        ],
        "pause": 0.7
      },
      {
        "text": "Selama tidak ada gaya luar, momentum total sistem tidak berubah. Inilah hukum kekekalan momentum.",
        "hl": [
          "hukum kekekalan momentum"
        ],
        "pause": 0.8
      },
      {
        "text": "Hukum ini berlaku untuk tabrakan mobil, ledakan, molekul gas, bahkan partikel subatom.",
        "hl": [
          "bahkan partikel subatom"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "recoil",
    "chapter": "05",
    "title": "Saling dorong dan tolakan senapan",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Dua pemain sepatu luncur tadi mula-mula diam, jadi momentum totalnya nol.",
        "hl": [
          "nol"
        ],
        "pause": 0.7
      },
      {
        "text": "Setelah saling mendorong, momentum totalnya harus tetap nol: momentum mereka sama besar, berlawanan arah.",
        "hl": [
          "sama besar, berlawanan arah"
        ],
        "pause": 0.7
      },
      {
        "text": "Pemain lima puluh kilogram meluncur satu koma lima meter per detik, pemain tujuh puluh lima kilogram meluncur satu meter per detik.",
        "pause": 0.7
      },
      {
        "text": "Yang lebih ringan bergerak lebih cepat.",
        "hl": [
          "lebih ringan bergerak lebih cepat"
        ],
        "pause": 0.8
      },
      {
        "text": "Hal yang sama terjadi saat senapan ditembakkan. Peluru sepuluh gram melesat empat ratus meter per detik ke depan,",
        "pause": 0.3
      },
      {
        "text": "maka senapan empat kilogram tertolak ke belakang dengan kecepatan satu meter per detik. Inilah tolakan atau recoil.",
        "hl": [
          "satu meter per detik"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "collisions",
    "chapter": "06",
    "title": "Tiga jenis tumbukan",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Dalam setiap tumbukan tanpa gaya luar, momentum selalu kekal. Tetapi energi kinetik belum tentu.",
        "hl": [
          "belum tentu"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada tumbukan lenting sempurna, energi kinetik juga kekal. Benda memantul tanpa kehilangan energi.",
        "hl": [
          "lenting sempurna"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada tumbukan lenting sebagian, sebagian energi kinetik berubah menjadi panas, bunyi, dan perubahan bentuk.",
        "hl": [
          "lenting sebagian"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada tumbukan tidak lenting sama sekali, kedua benda menempel dan bergerak bersama.",
        "hl": [
          "tidak lenting sama sekali"
        ],
        "pause": 0.7
      },
      {
        "text": "Ingat video pertama seri ini: energi tidak hilang, hanya berpindah bentuk.",
        "hl": [
          "tidak hilang"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "inelastic",
    "chapter": "07",
    "title": "Gerbong yang menyambung",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Sebuah gerbong sepuluh ton melaju dua meter per detik dan menabrak gerbong sepuluh ton yang diam. Keduanya tersambung.",
        "hl": [
          "tersambung"
        ],
        "pause": 0.7
      },
      {
        "text": "Momentum sebelum tumbukan dua puluh ribu kilogram meter per detik. Setelahnya, massa dua puluh ton membawa momentum yang sama,",
        "pause": 0.3
      },
      {
        "text": "jadi keduanya bergerak satu meter per detik.",
        "hl": [
          "satu meter per detik"
        ],
        "pause": 0.8
      },
      {
        "text": "Energi kinetik sebelum tumbukan dua puluh kilojoule, setelahnya hanya sepuluh kilojoule.",
        "hl": [
          "sepuluh kilojoule"
        ],
        "pause": 0.7
      },
      {
        "text": "Separuh energinya berubah menjadi bunyi dentuman, panas, dan getaran sambungan. Momentum kekal, energi kinetik tidak.",
        "hl": [
          "Momentum kekal, energi kinetik tidak"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "elastic",
    "chapter": "08",
    "title": "Tumbukan lenting: bertukar kecepatan",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kembali ke ayunan Newton. Bola-bola baja hampir lenting sempurna.",
        "hl": [
          "hampir lenting sempurna"
        ],
        "pause": 0.7
      },
      {
        "text": "Pada tumbukan lenting sempurna antara dua benda bermassa sama, keduanya bertukar kecepatan.",
        "hl": [
          "bertukar kecepatan"
        ],
        "pause": 0.7
      },
      {
        "text": "Bola yang datang berhenti total, dan bola yang diam melaju dengan kecepatan bola pertama.",
        "hl": [
          "berhenti total"
        ],
        "pause": 0.7
      },
      {
        "text": "Itulah sebabnya hanya satu bola yang terlempar. Dua bola keluar dengan kecepatan separuh memang kekal momentumnya, tetapi energi kinetiknya tidak.",
        "hl": [
          "energi kinetiknya tidak"
        ],
        "pause": 0.7
      },
      {
        "text": "Hanya satu jawaban yang memenuhi kedua hukum sekaligus.",
        "hl": [
          "kedua hukum sekaligus"
        ],
        "pause": 0.8
      },
      {
        "text": "Bola biliar yang ditembak lurus ke bola lain juga berhenti di tempat, sementara bola sasaran melaju.",
        "hl": [
          "berhenti di tempat"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "restitution",
    "chapter": "09",
    "title": "Koefisien restitusi",
    "mood": "build",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Seberapa lenting sebuah tumbukan? Ukurannya adalah koefisien restitusi, e.",
        "hl": [
          "koefisien restitusi"
        ],
        "pause": 0.7
      },
      {
        "text": "Koefisien ini adalah perbandingan kecepatan relatif sesudah tumbukan terhadap kecepatan relatif sebelum tumbukan.",
        "hl": [
          "kecepatan relatif"
        ],
        "pause": 0.7
      },
      {
        "text": "Nilai e sama dengan satu berarti lenting sempurna. Nilai nol berarti benda menempel.",
        "hl": [
          "satu",
          "nol"
        ],
        "pause": 0.7
      },
      {
        "text": "Cara mudah mengukurnya: jatuhkan bola ke lantai. Untuk bola yang memantul, e sama dengan akar tinggi pantulan dibagi tinggi jatuh.",
        "hl": [
          "akar tinggi pantulan dibagi tinggi jatuh"
        ],
        "pause": 0.7
      },
      {
        "text": "Bola dijatuhkan dari satu meter dan memantul enam puluh empat sentimeter. Koefisien restitusinya akar nol koma enam empat, yaitu nol koma delapan.",
        "hl": [
          "nol koma delapan"
        ],
        "pause": 0.7
      },
      {
        "text": "Pantulan berikutnya hanya setinggi empat puluh satu sentimeter, karena setiap pantulan mengalikan tingginya dengan nol koma enam empat.",
        "hl": [
          "empat puluh satu sentimeter"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "twod",
    "chapter": "10",
    "title": "Tumbukan dua dimensi",
    "mood": "wonder",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Momentum adalah vektor, jadi kekekalannya berlaku ke setiap arah sekaligus.",
        "hl": [
          "ke setiap arah"
        ],
        "pause": 0.7
      },
      {
        "text": "Bola biliar menyerempet bola lain yang diam. Kedua bola terpental ke arah yang berbeda.",
        "hl": [
          "menyerempet"
        ],
        "pause": 0.7
      },
      {
        "text": "Momentum mendatar total tetap, dan momentum tegak total tetap nol.",
        "hl": [
          "mendatar",
          "tegak"
        ],
        "pause": 0.7
      },
      {
        "text": "Jumlahkan kedua panah momentum sesudah tumbukan seperti menyambung anak panah: hasilnya tepat sama dengan panah momentum semula.",
        "hl": [
          "tepat sama"
        ],
        "pause": 0.7
      },
      {
        "text": "Untuk dua bola bermassa sama yang bertumbukan lenting, kedua bola selalu berpisah membentuk sudut siku-siku.",
        "hl": [
          "sudut siku-siku"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "strategy",
    "chapter": "11",
    "title": "Cara berpikir: soal momentum",
    "mood": "resolve",
    "part": 1,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Bagaimana menaklukkan soal momentum? Gunakan urutan berpikir ini.",
        "hl": [
          "urutan berpikir"
        ],
        "pause": 0.7
      },
      {
        "text": "Pertama, tentukan sistemnya, dan pastikan tidak ada gaya luar yang berarti selama tumbukan.",
        "hl": [
          "tentukan sistemnya"
        ],
        "pause": 0.7
      },
      {
        "text": "Kedua, pilih arah positif. Kecepatan yang berlawanan arah diberi tanda negatif.",
        "hl": [
          "arah positif"
        ],
        "pause": 0.7
      },
      {
        "text": "Ketiga, tulis momentum total sebelum sama dengan momentum total sesudah.",
        "hl": [
          "sebelum sama dengan"
        ],
        "pause": 0.7
      },
      {
        "text": "Keempat, bila tumbukannya lenting atau koefisien restitusinya diketahui, tambahkan persamaan kedua.",
        "hl": [
          "persamaan kedua"
        ],
        "pause": 0.7
      },
      {
        "text": "Kelima, periksa energi kinetik: energi boleh berkurang, tetapi tidak boleh bertambah tanpa sumber energi lain.",
        "hl": [
          "tidak boleh bertambah"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "gaspressure",
    "chapter": "12",
    "title": "Tekanan gas: hujan tumbukan",
    "mood": "wonder",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Mengapa gas di dalam tabung menekan dindingnya?",
        "pause": 0.6
      },
      {
        "text": "Karena molekul-molekul gas terus menabrak dinding dan memantul.",
        "hl": [
          "menabrak dinding"
        ],
        "pause": 0.7
      },
      {
        "text": "Setiap pantulan membalik arah molekul, jadi perubahan momentumnya dua kali m v.",
        "hl": [
          "dua kali m v"
        ],
        "pause": 0.7
      },
      {
        "text": "Sebuah molekul nitrogen pada suhu kamar bergerak sekitar lima ratus meter per detik. Setiap pantulannya mengubah momentum sekitar lima kali sepuluh pangkat minus dua puluh tiga kilogram meter per detik.",
        "pause": 0.7
      },
      {
        "text": "Sangat kecil. Tetapi setiap sentimeter persegi dinding ditabrak triliunan triliun kali setiap detik.",
        "hl": [
          "triliunan triliun"
        ],
        "pause": 0.7
      },
      {
        "text": "Jumlah impuls yang sangat banyak itu, dibagi waktu dan luas, kita rasakan sebagai tekanan gas.",
        "hl": [
          "tekanan gas"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "collisiontheory",
    "chapter": "13",
    "title": "Teori tumbukan dalam reaksi kimia",
    "mood": "build",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Reaksi kimia di dalam gas atau larutan juga dimulai dari tumbukan antarmolekul.",
        "hl": [
          "tumbukan antarmolekul"
        ],
        "pause": 0.7
      },
      {
        "text": "Tidak semua tumbukan menghasilkan reaksi. Tumbukan harus cukup keras dan arahnya harus tepat.",
        "hl": [
          "cukup keras",
          "arahnya harus tepat"
        ],
        "pause": 0.7
      },
      {
        "text": "Energi tumbukan harus melampaui energi aktivasi, sehingga ikatan lama bisa putus.",
        "hl": [
          "energi aktivasi"
        ],
        "pause": 0.7
      },
      {
        "text": "Dalam setiap tumbukan antarmolekul, momentum total tetap kekal, walaupun ikatan putus dan terbentuk.",
        "hl": [
          "momentum total tetap kekal"
        ],
        "pause": 0.7
      },
      {
        "text": "Menaikkan suhu membuat molekul bergerak lebih cepat, sehingga tumbukan lebih sering dan lebih keras.",
        "hl": [
          "lebih sering dan lebih keras"
        ],
        "pause": 0.7
      },
      {
        "text": "Banyak reaksi menjadi kira-kira dua kali lebih cepat untuk setiap kenaikan suhu sepuluh derajat.",
        "hl": [
          "dua kali lebih cepat"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "photon",
    "chapter": "14",
    "title": "Momentum cahaya",
    "mood": "wonder",
    "part": 2,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Cahaya tidak bermassa, tetapi cahaya membawa momentum.",
        "hl": [
          "membawa momentum"
        ],
        "pause": 0.7
      },
      {
        "text": "Momentum sebuah foton sama dengan tetapan Planck dibagi panjang gelombangnya: p sama dengan h per lambda.",
        "hl": [
          "h per lambda"
        ],
        "pause": 0.7
      },
      {
        "text": "Foton hijau lima ratus nanometer membawa momentum sekitar satu koma tiga kali sepuluh pangkat minus dua puluh tujuh kilogram meter per detik.",
        "pause": 0.7
      },
      {
        "text": "Saat atom hidrogen memancarkan foton ultraviolet, atom itu tertolak ke arah berlawanan, seperti senapan yang menembak.",
        "hl": [
          "tertolak"
        ],
        "pause": 0.7
      },
      {
        "text": "Kecepatan tolakannya sekitar tiga meter per detik. Kecil, tetapi nyata dan terukur.",
        "hl": [
          "tiga meter per detik"
        ],
        "pause": 0.7
      },
      {
        "text": "Prinsip ini dipakai untuk mendinginkan atom dengan laser, dan untuk mendorong layar surya di antariksa.",
        "hl": [
          "mendinginkan atom dengan laser"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "crash",
    "chapter": "15",
    "title": "Keselamatan berkendara",
    "mood": "tension",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Mobil modern sengaja dibuat mudah penyok di bagian depan. Bagian ini disebut zona remuk.",
        "hl": [
          "zona remuk"
        ],
        "pause": 0.7
      },
      {
        "text": "Zona remuk memperpanjang waktu tumbukan, sehingga gaya pada kabin penumpang lebih kecil.",
        "hl": [
          "memperpanjang waktu tumbukan"
        ],
        "pause": 0.7
      },
      {
        "text": "Mobil yang terlalu kaku justru berbahaya: penghentiannya terlalu singkat, gayanya terlalu besar.",
        "hl": [
          "terlalu kaku"
        ],
        "pause": 0.7
      },
      {
        "text": "Sabuk pengaman menahan tubuh agar ikut melambat bersama mobil, dan kantong udara memperluas bidang tekan serta memperlama penghentian kepala.",
        "hl": [
          "sabuk pengaman",
          "kantong udara"
        ],
        "pause": 0.7
      },
      {
        "text": "Helm bekerja dengan cara yang sama: busa di dalamnya remuk perlahan untuk memperlama tumbukan.",
        "hl": [
          "Helm"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "ballistic",
    "chapter": "16",
    "title": "Bandul balistik",
    "mood": "build",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Bagaimana mengukur kecepatan peluru tanpa alat elektronik? Gunakan bandul balistik.",
        "hl": [
          "bandul balistik"
        ],
        "pause": 0.7
      },
      {
        "text": "Peluru sepuluh gram ditembakkan ke balok kayu dua kilogram yang tergantung, lalu tertanam di dalamnya.",
        "hl": [
          "tertanam"
        ],
        "pause": 0.7
      },
      {
        "text": "Balok dan peluru berayun naik setinggi lima sentimeter.",
        "hl": [
          "lima sentimeter"
        ],
        "pause": 0.7
      },
      {
        "text": "Tahap kedua memakai kekekalan energi: kecepatan balok sesaat setelah tumbukan adalah akar dua g h, yaitu satu meter per detik.",
        "hl": [
          "satu meter per detik"
        ],
        "pause": 0.7
      },
      {
        "text": "Tahap pertama memakai kekekalan momentum: kecepatan peluru sama dengan massa total dibagi massa peluru, dikali satu meter per detik.",
        "hl": [
          "kekekalan momentum"
        ],
        "pause": 0.7
      },
      {
        "text": "Hasilnya dua ratus satu meter per detik. Dua hukum kekekalan, dipakai berurutan.",
        "hl": [
          "dua ratus satu meter per detik"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "rocket",
    "chapter": "17",
    "title": "Roket di ruang hampa",
    "mood": "wonder",
    "part": 3,
    "lead": 1.2,
    "tail": 1.4,
    "lines": [
      {
        "text": "Kembali ke roket di ruang hampa.",
        "pause": 0.5
      },
      {
        "text": "Roket tidak mendorong udara. Roket mendorong gas buangnya sendiri ke belakang dengan sangat cepat.",
        "hl": [
          "gas buangnya sendiri"
        ],
        "pause": 0.7
      },
      {
        "text": "Gas mendapat momentum ke belakang, maka roket mendapat momentum yang sama besar ke depan.",
        "hl": [
          "sama besar ke depan"
        ],
        "pause": 0.7
      },
      {
        "text": "Gaya dorongnya sama dengan kecepatan gas buang dikali massa gas yang dibuang setiap detik.",
        "hl": [
          "kecepatan gas buang"
        ],
        "pause": 0.7
      },
      {
        "text": "Gas buang tiga ribu meter per detik, dibuang seratus kilogram setiap detik, menghasilkan dorongan tiga ratus ribu newton.",
        "hl": [
          "tiga ratus ribu newton"
        ],
        "pause": 0.7
      },
      {
        "text": "Makin banyak bahan bakar terbakar, roket makin ringan, sehingga percepatannya terus bertambah.",
        "hl": [
          "makin ringan"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "recap",
    "chapter": "18",
    "title": "Rangkuman",
    "mood": "resolve",
    "lead": 1.0,
    "tail": 1.6,
    "lines": [
      {
        "text": "Mari rangkum.",
        "pause": 0.5
      },
      {
        "text": "Momentum adalah massa kali kecepatan, besaran vektor yang menunjukkan seberapa sulit sebuah benda dihentikan.",
        "hl": [
          "massa kali kecepatan"
        ],
        "pause": 0.7
      },
      {
        "text": "Impuls, yaitu gaya kali selang waktu, sama dengan perubahan momentum. Memperlama tumbukan memperkecil gaya.",
        "hl": [
          "Memperlama tumbukan memperkecil gaya"
        ],
        "pause": 0.7
      },
      {
        "text": "Tanpa gaya luar, momentum total selalu kekal, pada tumbukan apa pun. Energi kinetik kekal hanya pada tumbukan lenting sempurna.",
        "hl": [
          "momentum total selalu kekal"
        ],
        "pause": 0.7
      },
      {
        "text": "Dari tekanan gas sampai roket dan foton, momentum hanya berpindah, tidak pernah hilang.",
        "hl": [
          "tidak pernah hilang"
        ],
        "pause": 0.7
      },
      {
        "text": "Jadi, setiap kali melihat benda bertumbukan, tanyakan: ke mana momentumnya berpindah, dan ke mana energinya pergi?",
        "hl": [
          "ke mana momentumnya berpindah"
        ],
        "pause": 0.8
      }
    ]
  },
  {
    "id": "outro",
    "chapter": "",
    "title": "Penutup",
    "mood": "outro",
    "fixed": 16,
    "lines": []
  }
];
