# LuckyNumber V5.4.3 Stability Build

ปรับความเสถียรสำหรับ Safari และ Home Screen บน iPhone:
- เริ่มระบบหลัง DOM พร้อม และป้องกันการ Boot ซ้ำ
- ตัดคำสั่ง JavaScript ที่อาจเข้ากันไม่ได้กับ Safari บางรุ่น
- เพิ่มหน้าสถานะกรณี app.js หรือ CSS โหลดไม่สำเร็จ แทนหน้าขาว
- ล้างเฉพาะ Service Worker เก่า ไม่ลบ Local Storage/History
- คง Image Import, Auto Table, Auto AI และ History Protection

หลังอัปโหลดทับ GitHub Pages ให้เปิด URL ใน Safari และ Refresh หนึ่งครั้ง ก่อน Add to Home Screen ใหม่
