# LuckyNumber V4.8.2 Working Fix

แก้ปัญหากดปุ่มไม่ได้:
- เปลี่ยนชื่อไฟล์มาตรฐานให้ตรงกับ index.html: index.html, app.js, style.css, manifest.json, sw.js
- เปลี่ยนคีย์บอร์ดโมเดิร์นให้ใช้ click handler ซึ่งเสถียรกว่าบน Safari/iPhone
- เพิ่ม cache-busting รุ่น 482
- ยกเลิก Service Worker และล้าง cache รุ่นเก่าเมื่อเปิดแอป

## อัปโหลด GitHub Pages
ลบหรือแทนที่ไฟล์เดิม แล้วอัปโหลดไฟล์ทั้ง 6 ไฟล์ในโฟลเดอร์นี้ โดยห้ามเปลี่ยนชื่อไฟล์
