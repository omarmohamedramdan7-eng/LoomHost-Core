/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  js: string;
}

export const PRESET_TEMPLATES: Template[] = [
  {
    id: "dentist",
    name: "عيادة دنتال كير - Dental Care Clinic",
    description: "قالب أنيق ونظيف لعيادة أسنان باللونين الكحلي والذهبي الفاخر مع حجز مواعيد.",
    html: `
<div class="dental-clinic">
  <div class="top-nav">
    <div class="brand">🦷 دنتال كير</div>
    <div class="links">
      <a href="#services">خدماتنا</a>
      <a href="#doctors">أطباؤنا</a>
      <a href="#booking" class="cta-mini">احجز الآن</a>
    </div>
  </div>
  
  <div class="hero">
    <h1>ابتسامتك هي لوحتنا الفنية ✨</h1>
    <p>نقدم رعاية أسنان متكاملة ومخصصة لكل فرد باستخدام أحدث التقنيات الطبية الرقمية في الشرق الأوسط.</p>
    <a href="#booking" class="btn-primary">احجز استشارة مجانية اليوم</a>
  </div>

  <div class="features">
    <div class="card">
      <div class="icon">✨</div>
      <h3>تبييض الأسنان بالليزر</h3>
      <p>احصل على ابتسامة ناصعة البياض خالية من العيوب في جلسة واحدة مدتها 45 دقيقة فقط.</p>
    </div>
    <div class="card">
      <div class="icon">🦷</div>
      <h3>زراعة الأسنان الفورية</h3>
      <p>تقنيات زراعة ألمانية متطورة بدون جراحة مؤلمة وبنسب استشفاء قياسية.</p>
    </div>
  </div>
</div>`,
    css: `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
.dental-clinic {
  font-family: 'Cairo', sans-serif;
  color: #0d1e3d;
  background-color: #fafbfc;
  margin: 0;
  padding: 0;
  direction: rtl;
  min-height: 100vh;
}
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: white;
  border-bottom: 2px solid #f1f5f9;
}
.brand {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0b2545;
}
.links a {
  text-decoration: none;
  color: #1e3a8a;
  margin-right: 25px;
  font-weight: 600;
}
.cta-mini {
  background: #b58d3d;
  color: white !important;
  padding: 8px 16px;
  border-radius: 6px;
}
.hero {
  text-align: center;
  padding: 80px 20px;
  background: radial-gradient(circle at top right, #edf4ff, #ffffff);
}
.hero h1 {
  font-size: 2.8rem;
  color: #0b2545;
  margin-bottom: 20px;
}
.hero p {
  font-size: 1.2rem;
  color: #64748b;
  max-width: 700px;
  margin: 0 auto 30px;
}
.btn-primary {
  display: inline-block;
  background: linear-gradient(135deg, #0b2545, #134074);
  color: white;
  padding: 14px 30px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  box-shadow: 0 4px 14px rgba(11, 37, 69, 0.2);
}
.features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
}
.card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
}
.card .icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}
.card h3 {
  margin: 0 0 10px;
  color: #0b2545;
}`,
    js: `console.log("قالب عيادة الأسنان جاهز للعمل!");`
  },
  {
    id: "burger",
    name: "مقهى ومطعم ريترو برجر - Retro Burger Co.",
    description: "موقع طعام عصري وجذاب بتصميم ريترو عالي التشبع يعرض قائمة برجر ناري للشباب.",
    html: `
<div class="retro-burger">
  <header>
    <div class="nav-brand">🍔 RETRO BURGER</div>
    <div class="status-indicator">🔴 مغلق مؤقتاً للتطوير</div>
  </header>

  <div class="billboard">
    <div class="badge">الأكثر مبيعاً في المدينة ⚡</div>
    <h2>تذوق لهيب البرجر المشوي على الحطب!</h2>
    <p>لحم بقري طازج 100% مع خلطة الجبن السرية والبطاطس المقرمشة المتبلة.</p>
    <button class="order-btn" id="burger-clicker">اضغط لتخمين صوصك المفضل 🎁</button>
    <div id="sauce-result" class="result-box"></div>
  </div>
</div>`,
    css: `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700&family=Changa:wght@700&display=swap');
.retro-burger {
  font-family: 'Cairo', sans-serif;
  background-color: #ffbe0b;
  color: #3d0066;
  direction: rtl;
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 4px solid #3d0066;
  padding-bottom: 15px;
}
.nav-brand {
  font-family: 'Changa', sans-serif;
  font-size: 2rem;
  font-weight: bold;
}
.status-indicator {
  background: #ff006e;
  color: white;
  padding: 5px 12px;
  border-radius: 5px;
  font-size: 13px;
  font-weight: bold;
}
.billboard {
  max-width: 650px;
  margin: 60px auto;
  text-align: center;
  background: #ffffff;
  border: 4px solid #3d0066;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 10px 10px 0px #3d0066;
}
.badge {
  background: #3a86c8;
  color: white;
  padding: 6px 14px;
  border-radius: 4px;
  display: inline-block;
  font-weight: bold;
  margin-bottom: 20px;
}
h2 {
  font-family: 'Changa', sans-serif;
  font-size: 2.5rem;
  margin-top: 0;
  color: #ff006e;
}
.order-btn {
  background: #ff5400;
  color: white;
  border: 3px solid #3d0066;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 3px 3px 0px #3d0066;
  transition: transform 0.1s;
}
.order-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px #3d0066;
}
.result-box {
  margin-top: 20px;
  font-size: 1.25rem;
  font-weight: bold;
  color: #3a86c8;
}`,
    js: `
const sauces = ["صوص العسل بالثوم الحار 🌶️", "صوص الباربكيو المدخن 🪵", "صوص الديناميت بالجبن 🧀", "الصوص السري الكلاسيكي 🤫"];
document.getElementById('burger-clicker')?.addEventListener('click', () => {
  const item = sauces[Math.floor(Math.random() * sauces.length)];
  const res = document.getElementById('sauce-result');
  if (res) res.textContent = "صوصك المناسب اليوم هو: " + item;
});`
  }
];
