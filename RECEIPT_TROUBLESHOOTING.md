# 🔍 แก้ไขปัญหา: รูปใบเสร็จไม่เข้า Airtable

## ❌ ปัญหา: Receipt cell ว่างเปล่าใน Airtable

### สาเหตุที่เป็นไปได้

1. **ยังไม่ได้ตั้งค่า IMGUR_CLIENT_ID**
   - ระบบไม่สามารถอัปโหลดไปยัง Imgur ได้
   - ข้อมูลการจองจะถูกบันทึก แต่ไม่มีรูปใบเสร็จ

2. **Imgur Upload ล้มเหลว**
   - Imgur API error
   - ไฟล์ใหญ่เกิน 10MB
   - Network timeout

3. **Airtable ไม่รับ URL จาก Imgur**
   - URL format ไม่ถูกต้อง
   - Airtable attachment field ไม่รองรับ Imgur URL

---

## ✅ วิธีแก้ไข

### 1. ตรวจสอบ IMGUR_CLIENT_ID

#### สำหรับ Local Development

ตรวจสอบไฟล์ `.env.local`:
```bash
cat .env.local | grep IMGUR_CLIENT_ID
```

ถ้าไม่มีหรือเป็น placeholder:
1. ไปที่ https://api.imgur.com/oauth2/addclient
2. สร้าง Application
3. คัดลอก Client ID
4. เพิ่มใน `.env.local`:
   ```env
   IMGUR_CLIENT_ID=your_client_id_here
   ```
5. Restart development server

#### สำหรับ Vercel

1. ไปที่ Vercel Dashboard
2. เลือกโปรเจกต์ "queue-master"
3. ไปที่ Settings → Environment Variables
4. ตรวจสอบว่า `IMGUR_CLIENT_ID` มีค่า (ไม่ใช่ placeholder)
5. ถ้าไม่มีหรือเป็น placeholder:
   - คลิก "Add" หรือแก้ไข
   - Key: `IMGUR_CLIENT_ID`
   - Value: Client ID จริงจาก Imgur
   - Save
6. Redeploy

---

### 2. ตรวจสอบ Console Logs

#### ใน Browser Console

เปิด Developer Tools (F12) → Console tab แล้วดู:
- `Receipt uploaded successfully: [URL]` - อัปโหลดสำเร็จ
- `Failed to upload receipt image: [error]` - อัปโหลดล้มเหลว

#### ใน Server Logs (Terminal)

ดู logs ใน terminal:
- `Adding receipt attachment to Airtable: [URL]` - ส่งไปยัง Airtable แล้ว
- `No receipt URL provided` - ไม่มี URL (อัปโหลดล้มเหลว)

---

### 3. ทดสอบ Imgur Upload

ทดสอบ API โดยตรง:

```bash
curl -X POST https://api.imgur.com/3/image \
  -H "Authorization: Client-ID YOUR_CLIENT_ID" \
  -H "Content-Type: application/json" \
  -d '{"image":"BASE64_STRING","type":"base64"}'
```

---

### 4. ตรวจสอบ Airtable Attachment Field

1. ไปที่ Airtable
2. เปิด Table "Bookings"
3. ตรวจสอบ Field "Receipt":
   - Type ต้องเป็น **Attachment**
   - ไม่ใช่ Single line text หรือ type อื่น

---

## 🔍 การวินิจฉัยปัญหา

### ขั้นตอนที่ 1: ตรวจสอบ IMGUR_CLIENT_ID

```bash
# Local
cat .env.local | grep IMGUR

# Vercel
# ไปที่ Dashboard → Settings → Environment Variables
```

### ขั้นตอนที่ 2: ทดสอบอัปโหลด

1. เปิดแอป
2. เลือกไฟล์ใบเสร็จ
3. เปิด Browser Console (F12)
4. ดู error messages

### ขั้นตอนที่ 3: ตรวจสอบ Network Tab

1. เปิด Developer Tools → Network tab
2. Filter: `/api/upload`
3. ดู Response:
   - Status 200 = สำเร็จ
   - Status 500 = Error (ดู Response body)

---

## 💡 วิธีแก้ไขชั่วคราว

### ถ้ายังแก้ไม่ได้

1. **บันทึกข้อมูลโดยไม่มีรูปใบเสร็จ** (ระบบจะทำงานได้)
2. **อัปโหลดรูปด้วยตนเองใน Airtable** (ชั่วคราว)
3. **ใช้ Storage Service อื่น** เช่น:
   - Cloudinary
   - AWS S3
   - Vercel Blob Storage

---

## 📝 Checklist

- [ ] IMGUR_CLIENT_ID ตั้งค่าแล้ว (ไม่ใช่ placeholder)
- [ ] Imgur Client ID ถูกต้อง
- [ ] Field "Receipt" ใน Airtable เป็น Type "Attachment"
- [ ] ไฟล์ไม่เกิน 10MB
- [ ] ไฟล์เป็นรูปภาพ (jpg, png, gif, etc.)
- [ ] ตรวจสอบ Console logs แล้ว

---

## 🆘 ถ้ายังไม่ได้

1. **ตรวจสอบ Browser Console** - ดู error messages
2. **ตรวจสอบ Server Logs** - ดู terminal output
3. **ทดสอบ Imgur API** - ใช้ curl หรือ Postman
4. **ลองใช้ Storage Service อื่น** - Cloudinary หรือ S3

---

## 📚 เอกสารเพิ่มเติม

- `IMGUR_SETUP.md` - คู่มือตั้งค่า Imgur
- `RECEIPT_UPLOAD.md` - คู่มือระบบอัปโหลดรูปใบเสร็จ

