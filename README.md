# AS LOJİSTİK — B2B Tedarik ve Akıllı Lojistik Platformu

**AS LOJİSTİK**, Türkiye'deki üretim, sanayi ve dağıtım şirketleri için geliştirilmiş **Çok Kiracılı (Multi-Tenant) bir B2B Tedarik Zinciri, Canlı Sevkiyat Telemetrisi ve Birim Ekonomisi (Kârlılık) SaaS Platformudur**.

Platform; fabrikadan veya organize sanayi bölgesi (OSB) depolarından çıkan paletli/konteynerli yüklerin **ERP/Excel veri girişinden canlı otoyol takibine, soğuk zincir kontrolünden navlun düşülmüş net kâr analizine kadar** tüm yaşam döngüsünü tek bir **Stealth Dark** komuta merkezinde birleştirir.

---

## 1. Uygulamanın Temel İş Mantığı (Uçtan Uca Akış)

Geleneksel lojistik operasyonlarında **Operasyon Ekibi**, **Muhasebe/Finans Ekibi** ve **Alıcı Müşteri** birbirinden kopuktur:
1. Muhasebe faturayı **Logo / Mikro / Netsis / Excel** üzerinde keser ama tırın yolda geciktiğinden haberi yoktur.
2. Operasyon ekibi tırı yola çıkarır ama **artan navlun (nakliye) maliyetinin o sevkiyattaki kâr marjını negatife düşürdüğünü** göremez.
3. Alıcı firma ("Malım nerede, kaçta depoda olur?") sorusu için sürekli telefon trafiği yaratır.

**AS LOJİSTİK bu üç kopukluğu tek bir veri akışında çözer:**

```text
[1. VERİ GİRİŞİ & ERP]        [2. CANLI OPERASYON]          [3. FİNANS & STOK]
Excel (.xlsx/.csv) veya  ───► 5 Aşamalı Sevkiyat Takibi ───► Sevkiyat Bazlı Net Kâr
Logo / Mikro / Netsis         • Vektör Rota & GPS            • Ciro - (COGS + Navlun + Paketleme)
Paraşüt / BirFatura           • Sıcaklık (°C) & Nem (%)      • Haftalık Marj Kırılımı
(Girdi Sterilizasyonu +       • Sürücü & Müşteri SMS         • Kritik Stok & Hızlı İkmal
 Otomatik Sütun Eşleme)       • Dijital Teslim Belgesi (POD) • Yönetici Özeti (Executive PDF)
```

---

## 2. Rol Bazlı Erişim Matrisi (`RBAC`)

Uygulama, sol menüden anlık olarak test edilebilen **3 farklı kullanıcı rolüne** (`Admin`, `Satıcı`, `Müşteri`) göre ekranları ve yetkileri dinamik olarak izole eder:

| Özellik / Modül | Satıcı (`seller`) | Müşteri (`customer`) | Super Admin (`admin`) |
| :--- | :---: | :---: | :---: |
| **Operasyon & Canlı Harita** | Tam Yetki (+ Yeni Sevkiyat) | Sadece İzleme & Takip | Tam Yetki |
| **Veri Yükleme & ERP Webhook** | Açık | Kapalı (RBAC Korumalı) | Açık |
| **Finans & COGS Kârlılık Analizi** | Açık | Kapalı (RBAC Korumalı) | Açık |
| **Satış / Stok Envanteri & İkmal** | Açık | Kapalı (RBAC Korumalı) | Açık |
| **Altyapı Paket Yükseltme (`SaaS`)** | Açık | Açık | Açık |
| **Super Admin (MRR, ROI, Audit Log)** | Kapalı (RBAC Korumalı) | Kapalı (RBAC Korumalı) | Açık |

---

## 3. Modüllerin Detaylı Çalışma Mantığı

### A. Operasyon Yönetimi (`src/components/OperationView.tsx`)
Sahadaki aktif tırların ve yüklerin gerçek zamanlı komuta merkezidir:
* **5 Aşamalı Sevkiyat Hunisi:** Her sevkiyat sırasıyla `1. Onay` → `2. Paletleme` → `3. Yolda` → `4. Dağıtım` → `5. Teslim` adımlarından geçer.
* **Canlı Telemetri & Soğuk Zincir Kontrolü:** Konteyner içi sıcaklık (`°C`), nem (`%`), anlık hız (`km/s`) ve yük miktarı (`Palet` / `Konteyner`) izlenir. Sıcaklık, ürünün güvenli aralığında (`tempMin`–`tempMax`, örn. `15–25°C`) ise yeşil **Optimal**, dışına çıkarsa kırmızı **Uyarı** verir.
* **İstisna Bildirimi (Exception Alert):** Hava muhalefeti veya yol yoğunluğu nedeniyle geciken sevkiyatlarda (örn. `AR-9104` Ankara–Niğde hattı) otomatik sapma uyarısı gösterilir.
* **Türkiye Lojistik Koridoru Vektör Haritası:** İstanbul, Bursa, İzmir, Ankara, Mersin ve Gaziantep lojistik koridorları üzerinde tamamlanan (`#00FF87`), mevcut (`#06B6D4`) ve beklenen durakları interaktif olarak gösterir.
* **SMS Dispatch & Geçmiş:** Seçili sevkiyatın şoförüne ve alıcı müşteriye gönderilecek SMS şablonlarını otomatik hazırlar, XSS filtresinden geçirir ve gönderilen mesajları canlı olarak **SMS Geçmişi** listesine işler.
* **Sürücü Takibi, Müşteri Takibi ve Dijital POD:**
  * **Sürücü Takibi:** Şoförün mobil terminal görünümünü ve canlı GPS konum paylaşımını simüle eder.
  * **Müşteri Takibi:** Alıcı firmanın gördüğü mobil takip ekranını, kalan süreyi ve e-İrsaliye PDF indirme aksiyonunu sunar.
  * **POD (Proof of Delivery):** Teslim edilmiş sevkiyatlarda (`AR-9075`, `AR-9120`) teslim alan kişinin adı, saati ve dijital imzasını içeren resmi teslim belgesini açar.

### B. Veri Yükleme & ERP Entegrasyonu (`src/components/DataIntegrationView.tsx`)
* **Excel / CSV Toplu Yükleme & Girdi Sterilizasyonu:** Sürükle-bırak veya dosya seçici ile yüklenen dosyalar önce uzantı (`.xlsx`, `.xls`, `.csv`), boyut (`<= 10 MB`) ve dizin aşımı (`..`) kontrolünden geçer. Ardından hücre içindeki zararlı Excel formül enjeksiyonları (`=CMD`, `+`, `-`, `@`) temizlenir ve kullanıcı **Sevkiyatlara Aktar** butonuyla temizlenmiş kayıtları doğrudan **Operasyon** listesine aktarabilir.
* **Sütun Eşleştirme (Schema Mapping):** Excel'deki `Müşteri Adı`, `Ürün Adı`, `Miktar`, `Çıkış Depo`, `Varış Depo`, `Plaka` sütunlarını sistemdeki `client`, `product`, `units`, `origin`, `destination`, `plate` alanlarıyla eşleştirir.
* **ERP Webhook Senkronizasyonu:** **Logo**, **Mikro**, **Netsis**, **Paraşüt** ve **BirFatura** entegrasyonlarını yönetir. Kullanıcı mevcut ERP'leri bağlayabilir veya bağlı ERP'lerde `HMAC-SHA256` imzalı canlı senkronizasyon tetikleyebilir.

### C. Finans Analitiği (`src/components/FinanceSalesView.tsx`)
Lojistik operasyonunun birim ekonomisini ve gerçek kârlılığını ölçer:
* **Net Kâr ve Marj Formülü:**
  $$\text{Net Kâr} = \text{Satış Cirosu} - (\text{Ürün Maliyeti [COGS]} + \text{Nakliye [Freight]} + \text{Paketleme})$$
  $$\text{Marj (\%)} = \left(\frac{\text{Net Kâr}}{\text{Satış Cirosu}}\right) \times 100$$
* **Otomatik Kârlılık Sınıflandırması:**
  * $\text{Marj} < 0\%$ → **Zarar** (`Crimson #FF2E4D`) — *Örn: Yüksek navlun nedeniyle zarar eden sevkiyatlar*
  * $0\% \le \text{Marj} < 15\%$ → **Düşük** (`Crimson #FF2E4D`)
  * $15\% \le \text{Marj} \le 25\%$ → **Orta** (`Amber #FFB800`)
  * $\text{Marj} > 25\%$ → **Sağlıklı** (`Emerald #00FF87`)
* **Haftalık Maliyet & Kâr Grafiği ve Detay Çekmecesi:** 6 haftalık COGS, Nakliye, Net Kâr ve Marj % eğrisini görselleştirir. Tablodaki herhangi bir haftaya tıklandığında sağdan açılan çekmecede o haftanın sevkiyat bazlı kâr/zarar kırılımı listelenir.
* **Haftalık Yönetici PDF Özeti:** `Standart KOBİ` paketinde kilitlidir; kullanıcı paketini `Pro` veya `Enterprise` seviyesine yükselttiğinde kilit açılır ve konsolide yönetici raporu görüntülenir.

### D. Satış / Stok Envanteri (`src/components/FinanceSalesView.tsx`)
* **Kritik Stok Takibi:** Depolardaki (`Gebze OSB`, `Hadımköy`, `İzmir Atatürk OSB`, `Bursa Nilüfer OSB`, `Adana OSB`, `Ambarlı Liman`) ürünlerin mevcut stok adedini minimum sipariş eşiği (`reorderLevel`) ile karşılaştırır.
* **Hızlı Stok İkmali:** Kritik veya düşük seviyeye inen ürünlerde (`Otomotiv Motor Modülü`, `Dökme Çelik Profil` vb.) **`+25 Palet`** butonu ile anında stok ikmali yapılır ve ürün durumu otomatik güncellenir.

### E. Super Admin Panel (`src/components/AdminView.tsx`)
Platformu B2B SaaS olarak yöneten çatı yönetim ekranıdır:
* **SaaS Metrikleri:** Aylık Tekrarlayan Gelir (**MRR**), Yıllık Gelir (**ARR**), Aktif Abonelik Sayısı ve Aylık Toplam Sevkiyat.
* **Platform ROI:** Müşterilere kazandırılan operasyonel otomasyon süresi (`140+ saat`), platform üzerinden geçen yük değeri (`₺4.2M`) ve yatırım getirisi çarpanı (`12x`).
* **Abonelik Yönetimi:** Şirketleri paket (`Enterprise`, `Pro`, `Basic`) bazında filtreler; süresi dolmak üzere olan (`expiring`) veya pasif (`inactive`) şirketlerin aboneliklerini tek tıkla yeniler ve MRR'ı canlı günceller.
* **Güvenlik & Denetim Kayıtları (Audit Log):** Rol değişimleri, dosya sterilizasyonları, SMS gönderimleri ve ERP webhook imzalarını zaman damgalı olarak kayıt altına alır.

---

## 4. Güvenlik Mimarisi (`src/utils/security.ts`)

Projede hiçbir güvenlik açığı bırakılmaması için çok katmanlı koruma uygulanmıştır:
1. **Content-Security-Policy (CSP) & HTTP Güvenlik Başlıkları (`index.html` & `vercel.json`):**
   * `X-Content-Type-Options: nosniff`
   * `X-Frame-Options: DENY` (Clickjacking koruması)
   * `Referrer-Policy: strict-origin-when-cross-origin`
   * `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   * Harici üçüncü parti izleme betikleri tamamen temizlenmiştir.
2. **XSS ve Kontrol Karakteri Sterilizasyonu (`sanitizeText`):** Kullanıcı girdilerindeki `<script>`, HTML etiketleri, `javascript:` protokolleri ve görünmez zero-width karakterler anında temizlenir.
3. **CSV / Excel Formül Enjeksiyonu Koruması (`sanitizeSpreadsheetCell`):** Tablo yüklemelerinde `=`, `+`, `-`, `@`, `\t`, `\r` ile başlayan hücreler sterilize edilerek DDE/Makro saldırıları engellenir.
4. **Sıkı Dosya Doğrulaması (`validateUploadFile`):** Sadece `.xlsx`, `.xls`, `.csv` uzantılarına izin verilir; dizin aşımı (`..`, `/`, `\`) ve `10 MB` üzeri dosyalar reddedilir.
5. **Sliding-Window Rate Limiter (`createRateLimiter`):** SMS gönderimi ve ERP webhook senkronizasyon istekleri aşırı yükleme/spam saldırılarına karşı hız sınırına tabidir.
6. **Sıfır Paket Zafiyeti:** `npm audit` taramasında **0 güvenlik açığı (`found 0 vulnerabilities`)** bulunmaktadır.

---

## 5. Tasarım Sistemi (Stealth Dark & Tipografi)

Uygulama kimliği aşağıdaki renk ve tipografi standartlarına sıkı sıkıya bağlıdır:

* **Tipografi:**
  * Başlık & Arayüz: `Plus Jakarta Sans`, `Inter`, `system-ui`, `sans-serif`
  * Kod, Plaka, Koordinat ve Finansal Rakamlar: `JetBrains Mono`, `monospace`
* **Renk Paleti:**
  * Arka Plan (`stealth-950`): `#000000`
  * Kart Zemini (`stealth-900`): `#0A0A0A`
  * İkincil Zemin (`stealth-800`): `#111111`
  * Kenarlıklar (`stealth-600` / `stealth-500`): `#1F1F1F` / `#262626`
  * Başarı / Optimal (`emerald`): `#00FF87`
  * Aktif Rota / Bilgi (`cyan`): `#06B6D4`
  * Uyarı / Yükleme (`amber`): `#FFB800`
  * Kritik / Gecikme / Zarar (`crimson`): `#FF2E4D`

---

## 6. Kurulum ve Çalıştırma

### Gereksinimler
* **Node.js:** `>= 20.19.0` (veya `>= 22.12.0`)

### Yerel Ortamda Çalıştırma
```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Production derlemesi alın
npm run build

# Güvenlik denetimini doğrulayın
npm audit
```

### Vercel Üzerinde Dağıtım (Deploy)
Proje kök dizinindeki `vercel.json` dosyası; Vite derleme ayarlarını, statik varlık önbelleklemesini (`Cache-Control: immutable`), SPA yönlendirmesini ve tüm güvenlik başlıklarını otomatik olarak yapılandırır:
1. [Vercel Dashboard](https://vercel.com/new) üzerinden **Add New Project** seçeneğine tıklayın.
2. `CoskunerBerke/Arda_site` GitHub deposunu seçin.
3. Hiçbir ek ayara dokunmadan **Deploy** butonuna basın.
