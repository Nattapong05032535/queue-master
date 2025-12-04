# ☁️ ตั้งค่า Cloudinary สำหรับอัปโหลดรูปใบเสร็จ

## 🎯 ทำไมใช้ Cloudinary แทน Imgur?

- ✅ **เสถียรกว่า** - ไม่มีปัญหา over capacity
- ✅ **Private storage** - รองรับ private images
- ✅ **Free tier ดี** - 25GB storage, 25GB bandwidth/เดือน
- ✅ **URL signing** - รองรับ signed URLs สำหรับความปลอดภัย
- ✅ **ง่ายต่อการใช้งาน** - API ใช้งานง่าย

---

## 📋 ขั้นตอนการตั้งค่า

### 1. สร้าง Cloudinary Account

1. ไปที่ **https://cloudinary.com/users/register/free**
2. สร้าง account ฟรี (ใช้ Email)
3. Login เข้าสู่ระบบ

---

### 2. หา API Credentials

1. หลังจาก login แล้ว จะเห็น **Dashboard**
2. ใน Dashboard จะแสดง:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz123456`

3. **คัดลอกข้อมูลทั้ง 3 อย่าง**:
   - Cloud Name
   - API Key
   - API Secret

---

### 3. สร้าง Upload Preset (Optional แต่แนะนำ)

1. ไปที่ **Settings → Upload**
2. เลื่อนลงไปที่ **"Upload presets"**
3. คลิก **"Add upload preset"**
4. ตั้งชื่อ: `queue-master-receipts`
5. **Signing mode**: เลือก **"Unsigned"** (สำหรับ public uploads)
6. **Folder**: `queue-master/receipts` (optional)
7. **Save**

---

### 4. ตั้งค่า Environment Variables

#### สำหรับ Local Development

แก้ไขไฟล์ `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_UPLOAD_PRESET=queue-master-receipts
```

#### สำหรับ Vercel

1. ไปที่ **Vercel Dashboard**
2. เลือกโปรเจกต์ **"queue-master"**
3. ไปที่ **Settings → Environment Variables**
4. เพิ่ม Variables:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
   CLOUDINARY_UPLOAD_PRESET=queue-master-receipts
   ```
5. **Save**
6. **Redeploy**

---

## ✅ ตรวจสอบการตั้งค่า

หลังจากตั้งค่าแล้ว:

1. Restart development server: `pnpm run dev`
2. เปิดเบราว์เซอร์ไปที่ http://localhost:3000
3. ลองจองห้องและอัปโหลดรูปใบเสร็จ
4. ตรวจสอบใน Airtable ว่ามี Receipt attachment หรือไม่

---

## 📝 หมายเหตุ

- **Cloudinary Free Tier**:
  - 25GB storage
  - 25GB bandwidth/เดือน
  - รองรับ private storage
  - URL signing

- **Security**:
  - API Secret ต้องเก็บเป็นความลับ
  - อย่า commit ลง Git
  - ใช้ Environment Variables เท่านั้น

---

## 🔄 เปลี่ยนจาก Imgur เป็น Cloudinary

ถ้าต้องการเปลี่ยนจาก Imgur เป็น Cloudinary:

1. ตั้งค่า Cloudinary ตามขั้นตอนข้างต้น
2. แก้ไข `app/booking/page.tsx`:
   - เปลี่ยน `/api/upload` → `/api/upload-cloudinary`
3. หรือใช้ Cloudinary เป็น default และ Imgur เป็น fallback

---

## 🆘 แก้ไขปัญหา

### ปัญหา: "Cloudinary ไม่ได้ตั้งค่า"

**วิธีแก้:**
- ตรวจสอบว่าเพิ่ม Environment Variables ครบ 3 ตัว:
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET

### ปัญหา: Upload ล้มเหลว

**วิธีแก้:**
- ตรวจสอบว่า Upload Preset ถูกต้อง
- ตรวจสอบว่า API credentials ถูกต้อง
- ตรวจสอบ Cloudinary Dashboard → Media Library

---

## 📚 เอกสารเพิ่มเติม

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Image Upload API](https://cloudinary.com/documentation/image_upload_api_reference)

---

## ✅ Checklist

- [ ] สร้าง Cloudinary account แล้ว
- [ ] คัดลอก Cloud Name, API Key, API Secret แล้ว
- [ ] สร้าง Upload Preset (optional)
- [ ] ตั้งค่า Environment Variables แล้ว
- [ ] Redeploy (ถ้าใช้ Vercel)
- [ ] ทดสอบอัปโหลดรูปใบเสร็จ

---

## 🎉 พร้อมใช้งาน!

หลังจากตั้งค่า Cloudinary แล้ว ระบบจะสามารถอัปโหลดรูปใบเสร็จได้โดยไม่มีปัญหา!

