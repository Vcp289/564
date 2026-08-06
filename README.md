# LuckyNumber V5.4.5 iPhone Navigation Stable

แก้ปัญหาเข้า History แล้วกดเมนูด้านล่างไปหน้าอื่นไม่ได้บน iPhone/PWA

- ล้างสถานะ `keypad-open` และ `modal-open` ทุกครั้งก่อน render
- เพิ่มระบบนำทางสำรองด้วย pointer event แบบ capture สำหรับ Safari/iPhone
- ไม่ปิด pointer events ของ bottom navigation อีกต่อไป
- คง Image Import, History protection, Auto Table และ AI เดิมทั้งหมด
- เพิ่ม cache-busting เป็น v545
