# Beyaz Tahta

> **Geliştiriciler, tasarımcılar ve üreticiler için yerel öncelikli (local-first), etkileşimli fikir, proje ve not panosu.**  
> Fikir kıvılcımlarınızı canlı tutun, mikro güncellemeler ekleyin, yapılacaklar listelerinizi takip edin ve her şeyi tek bir sonsuz beyaz tahta üzerinde özgürce düzenleyin.

![Lisans: Source-Available](https://img.shields.io/badge/Lisans-Source--Available-amber.svg)
![React 19](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)
![Electron](https://img.shields.io/badge/Electron-Masa%C3%BCst%C3%BC-47848F.svg)
![Yerel Veri](https://img.shields.io/badge/Veri-Yerel--%C3%96ncelikli-emerald.svg)

---

## Neden Beyaz Tahta?

Çoğu proje yönetim aracı karmaşık kurumsal iş akışları ve katı tablolar için tasarlanmıştır. **Beyaz Tahta**, fikirlerin ve projelerin en heyecanlı, hızlı ve özgür aşaması için geliştirildi:

- **Özet Odaklı Yaklaşım**: Her fikir veya proje 1-2 cümlelik net bir özetle başlar. Başlamak için sayfalarca doküman yazmanıza gerek yoktur.
- **Özgür Beyaz Tahta Alanı**: Kartları özelleştirilebilir renkli bölgeler (zone) içine serbestçe yerleştirin ve 4 köşeden boyutlandırın.
- **Çoklu Öğe Türleri**: Panoya yalnızca proje değil; **Not Defteri / Hatırlatıcı**, **Link Kutusu**, **Tablo (Excel)** ve **Basit Metin** öğeleri de ekleyin.
- **Özelleştirilebilir Kategoriler**: Kendi renkli kategorilerinizi oluşturun, projelerinizi tek tıkla filtreleyin.
- **Alt Fikirler & Yapılacaklar (To-Do)**: Projelerinizi alt adımlara bölün (`Kıvılcım` -> `Yapılıyor` -> `Bitti`) veya doğrudan kart üzerinden yapılacaklar listesi işaretleyin.
- **%100 Yerel ve Gizli**: Bulut hesabı zorunluluğu, abonelik veya veri takibi yoktur. Tüm verileriniz doğrudan bilgisayarınızdaki okunabilir JSON dosyalarına kaydedilir.
- **Her Yerde Çalışır**: İster Electron ile yerel Windows masaüstü uygulaması (`.exe`) olarak, ister tarayıcı üzerinden web uygulaması olarak kullanın.

---

## Özellikler

| Özellik | Açıklama |
| :--- | :--- |
| **Proje / Etkinlik Kartları** | Özet, durum, ilerleme günlüğü, alt fikirler ve yapılacaklar listesi içeren kapsamlı proje kartları. |
| **Not Defteri / Hatırlatıcı** | Kart üzerinde doğrudan düzenlenebilen serbest not alanı ve işaretlenebilir hatırlatıcı maddeler. |
| **Link Kutusu** | Bir başlık altında dilediğiniz kadar tıklanabilir bağlantı (`Link Başlığı` + `URL`) toplayabileceğiniz kartlar. |
| **Tablo (Excel)** | Dinamik satır/sütun ekleme, `fx` formül çubuğu (`=TOPLA`, `=ORTALAMA`, `=A1*B1`), Excel'den çoklu hücre yapıştırma (`Ctrl+V`), otomatik sütun toplamı (`Σ`) ve `.csv` dışa aktarma destekli tablo kartları. |
| **Basit Metin (`T`)** | Çerçevesiz, tek fontlu, doğrudan tuval üzerine yazılıp taşınabilen sade metin notları. |
| **Serbest Çizim Kalemi & Silgi** | Farklı renk ve kalınlıklarda serbest çizim (`Ç`), silgi (`S`) ve `Ctrl+Z` ile anında geri alma. |
| **Panodan Resim Yapıştırma** | `Ctrl+V` ile ekran görüntülerini doğrudan tahtaya yapıştırma veya bilgisayardan görsel yükleme. |
| **Üst Çerçeveler (Frames)** | Kategorileri ve öğeleri içine alan, birlikte taşınabilen ancak kategori listesinde görünmeyen kapsayıcı çerçeveler. |
| **Yapışkan (Sticky) Taşıma** | Bir çerçeveyi veya kategori alanını taşıdığınızda içindeki tüm kartlar, tablolar, metinler ve link kutuları onunla birlikte hareket eder; tekil öğeler ise bağımsız taşınır. |
| **4 Köşeden Boyutlandırma** | Çerçeve ve kategori bölgelerini (zone) 4 köşeden gerçek zamanlı piksel ölçüleriyle yeniden boyutlandırma. |
| **Kanban & Liste Görünümleri** | Beyaz tahta görünümü, klasik Kanban panosu ve yoğun liste görünümü arasında anında geçiş. |
| **JSON Yedekleme (İçe / Dışa Aktarma)** | Tüm panoyu tek tıkla `.json` dosyası olarak yedekleme veya mevcut yedeği geri yükleme. |

---

## Kısayollar ve Araçlar

- **`P` — İmleç Aracı**: Kartları seçin, sürükleyin; bir projeye **çift tıklayarak** detay penceresini açın.
- **`H` — El Aracı**: Beyaz tahtayı basılı tutarak kaydırın (Pan).
- **`Ç` — Kalem Aracı**: Tahta üzerine serbest çizim yapın.
- **`S` — Silgi Aracı**: Çizimleri tıklayarak veya sürükleyerek silin.
- **`T` — Metin Aracı**: Tahtada tıkladığınız yere doğrudan basit metin ekleyin.
- **`N` — Yeni Öğe**: Yeni öğe ekleme penceresini açın.
- **`Ctrl + V`**: Panodaki resmi doğrudan beyaz tahtaya yapıştırın.

---

## Hızlı Başlangıç

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18 veya üzeri önerilir)
- Git

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/teomankerki/beyaz-tahta.git
cd beyaz-tahta
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Uygulamayı Çalıştırın

#### Seçenek A: Tarayıcıda Çalıştırma (Web Modu)
```bash
npm run dev
```
Tarayıcınızda **[http://localhost:5173](http://localhost:5173)** adresini açın.

#### Seçenek B: Masaüstü Uygulaması Olarak Çalıştırma (Electron)
```bash
npm run electron:dev
```
Canlı yenileme (hot-reload) destekli yerel masaüstü penceresini başlatır.

---

## Masaüstü Uygulamasını Derleme (`.exe`)

Bağımsız Windows kurulum dosyasını ve taşınabilir (portable) `.exe` paketini oluşturmak için:

```bash
npm run electron:build
```

Derlenen Windows dosyaları `./release-yeni` klasörü içinde oluşturulur:
- **`Beyaz Tahta Setup 1.0.0.exe`**: Başlat Menüsü ve masaüstü kısayolu oluşturan tam Windows kurulum sihirbazı.
- **`Beyaz Tahta 1.0.0.exe`**: Kurulum gerektirmeyen, tek dosyadan çalışan taşınabilir (portable) sürüm.
- **`win-unpacked/Beyaz Tahta.exe`**: Klasör içinden anında açılan paketlenmemiş masaüstü sürümü.

---

## Teknoloji Yığını

- **Arayüz**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Derleyici & Geliştirme Ortamı**: [Vite 8](https://vite.dev/)
- **Stil & Tasarım**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Masaüstü Paketleme**: [Electron](https://www.electronjs.org/), [electron-builder](https://www.electron.build/)
- **İkonlar**: [Lucide React](https://lucide.dev/)
- **Efektler**: [Canvas Confetti](https://github.com/catdad/canvas-confetti)
- **Veri Katmanı**: Doğrudan yerel JSON dosya sistemi + tarayıcı `localStorage` hibrit senkronizasyonu

---

## Proje Yapısı

```text
beyaz-tahta/
├── assets/
│   ├── icon.ico                  # Çok katmanlı Windows uygulama ikonu
│   └── icon.png                  # Yüksek çözünürlüklü uygulama logosu
├── data/
│   ├── backlog.example.json      # Yeni kurulumlar için örnek başlangıç verisi
│   └── backlog.json              # Kişisel yerel pano verileriniz (.gitignore ile korunur)
├── electron/
│   ├── main.cjs                  # Electron ana süreci ve yerel dosya IPC köprüsü
│   └── preload.cjs               # Güvenli contextBridge (electronAPI)
├── src/
│   ├── components/
│   │   ├── Navigation/           # Üst bar, kategori yönetimi, filtreler
│   │   ├── ProjectModal/         # Yeni öğe, proje detay ve hızlı güncelleme pencereleri
│   │   ├── Stats/                # Pano analizi, istatistikler ve JSON içe/dışa aktarma
│   │   ├── Views/                # Kanban ve Liste görünümleri
│   │   └── Whiteboard/           # Etkileşimli beyaz tahta, bölgeler, kartlar ve çizim katmanı
│   ├── services/
│   │   └── storage.ts            # Hibrit Electron IPC + Web yerel depolama servisi
│   ├── types/                    # TypeScript veri tipleri
│   ├── utils/                    # Renk paletleri ve tarih/zaman yardımcıları
│   ├── App.tsx                   # Ana uygulama durumu ve kontrolcüleri
│   └── main.tsx                  # React başlangıç noktası
├── package.json
├── vite.config.ts
└── README.md
```

---

## Gizlilik ve Verileriniz

Fikirleriniz ve notlarınız yalnızca size aittir:
- Geliştirme modunda tüm veriler `data/backlog.json` dosyasında, masaüstü (`.exe`) modunda ise kullanıcı uygulama verileri (`AppData/Roaming/Beyaz Tahta/data/backlog.json`) altında saklanır.
- `data/backlog.json` dosyası `.gitignore` içindedir; kişisel projeleriniz ve notlarınız yanlışlıkla GitHub'a yüklenmez.

---

## Lisans (Source-Available & Ticari Lisans)

**Beyaz Tahta**, tam açık kaynak (OSI) değil; `tldraw` modeline benzer şekilde **Kaynak Kodu Açık (Source-Available)** bir lisans modeliyle sunulmaktadır:

- **Bireysel ve Geliştirme Kullanımı (Ücretsiz)**: Uygulamayı kendi cihazınızda kişisel kullanım, eğitim, değerlendirme ve ticari olmayan geliştirme amaçlarıyla ücretsiz olarak çalıştırabilir ve kaynak kodunu inceleyebilirsiniz.
- **Ticari ve Production Kullanımı (Ticari Lisans Gerektirir)**: Uygulamayı, beyaz tahta motorunu veya paketlerini ticari bir üründe, üretim (production) ortamında, SaaS hizmetinde veya kurumsal şirket içi kullanımda barındırmak/dağıtmak için telif hakkı sahibinden özel **Ticari Lisans (Commercial License)** alınması gerekmektedir.

Ayrıntılı koşullar için [`LICENSE`](./LICENSE) dosyasına göz atabilirsiniz.
