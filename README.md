# LuckyNumber V5.4.2 iPhone Startup Fix

แก้หน้าจอว่างบน iPhone โดยไม่ลบ History:
- ยกเลิก Service Worker/Cache รุ่นเก่าที่อาจโหลด index และ app.js คนละเวอร์ชัน
- เพิ่มการตรวจและซ่อมโครงสร้าง State ก่อนเปิดหน้าแอป
- ข้ามเฉพาะรายการ History ที่เสียหายแทนการทำให้ทั้งแอปเปิดไม่ได้
- เพิ่มหน้ากู้คืนเมื่อเกิด Startup error
- เก็บฟังก์ชัน Image Import และ Auto AI จาก V5.4.1

อัปโหลดไฟล์ทั้งหมดทับของเดิมบน GitHub Pages จากนั้นเปิด Safari และรีเฟรชหนึ่งครั้ง ก่อน Add to Home Screen ใหม่
