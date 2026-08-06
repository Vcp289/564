# LuckyNumber V5.3.9 Import Overwrite Safe

ฐาน: V5.3.8 Previous Available Table Resolver

การเปลี่ยนแปลงเดียวในเวอร์ชันนี้:
- Import ใช้ Profile + วันที่ เป็นคีย์หลัก
- ถ้ามีรายการเดิมและเลขเปลี่ยน จะอัปเดตทับ Record เดิมโดยเก็บ id, referenceTableId และ createdAt
- ถ้าข้อมูลเหมือนเดิมจะข้าม ไม่สร้างรายการซ้ำ
- ถ้าเป็นวันที่ใหม่จะเพิ่มรายการใหม่
- ปุ่มลบยังอยู่เฉพาะหน้า Edit/รายละเอียด ไม่เพิ่มปุ่มลบบนหน้า History หลัก
- หลัง Import จะสร้าง Table/History L และประมวลผล AI ตามระบบเดิม

ไม่ได้แก้ OCR, UI หลัก, Storage, Formula Selector, Reference Resolver หรือ Navigation
