# 🔧 แก้ไขปัญหา Status Field - Airtable

## ❌ ปัญหา: `INVALID_MULTIPLE_CHOICE_OPTIONS`

### Error Message
```
Insufficient permissions to create new select option "Pending"
```

### สาเหตุ
- Field "Status" ใน Airtable เป็น Single select
- ระบบพยายามบันทึกค่า "Pending" แต่ Airtable ไม่มี option นี้
- หรือ Personal Access Token ไม่มีสิทธิ์สร้าง option ใหม่

---

## ✅ วิธีแก้ไข

### วิธีที่ 1: เพิ่ม Option "Pending" ใน Airtable (แนะนำ)

1. ไปที่ Airtable: https://airtable.com
2. เปิด Base "Queue Master"
3. เปิด Table "Bookings"
4. คลิกที่ Field "Status"
5. ตรวจสอบว่า Options มี:
   - ✅ Pending
   - ✅ Confirmed
   - ✅ Cancelled

6. ถ้าไม่มี "Pending":
   - คลิก "+ Add option"
   - พิมพ์ "Pending"
   - กด Enter

### วิธีที่ 2: ตรวจสอบ Personal Access Token Scopes

ตรวจสอบว่า Personal Access Token มี Scopes:
- ✅ `schema.bases:write` (สำหรับสร้าง option ใหม่)

ถ้าไม่มี:
1. ไปที่ Builder Hub → Developers → Personal access tokens
2. เปิด Token "Queue Master"
3. เพิ่ม Scope: `schema.bases:write`
4. Save changes

### วิธีที่ 3: ไม่ส่ง Status (ชั่วคราว)

ถ้ายังแก้ไม่ได้ สามารถลบ Status ออกชั่วคราว:

แก้ไข `app/api/bookings/route.ts`:
```typescript
// ลบหรือ comment บรรทัดนี้
// fields['Status'] = 'Pending';
```

---

## 🔍 ตรวจสอบ

### 1. ตรวจสอบ Field "Status" ใน Airtable

- Type: **Single select**
- Options ต้องมี:
  - Pending
  - Confirmed
  - Cancelled

### 2. ตรวจสอบ Personal Access Token

- Scopes ต้องมี: `schema.bases:write`
- Access: "ALL RESOURCES"

---

## 📝 หมายเหตุ

- ถ้าใช้ Personal Access Token แบบเก่า (API Key) อาจไม่มีสิทธิ์สร้าง option ใหม่
- ต้องใช้ Personal Access Token ที่มี Scope `schema.bases:write`
- หรือเพิ่ม option ใน Airtable เอง

---

## ✅ หลังจากแก้ไข

1. Restart development server: `pnpm run dev`
2. ทดสอบบันทึกข้อมูลอีกครั้ง
3. ตรวจสอบว่าไม่มี error

---

## 🆘 ถ้ายังไม่ได้

ลองวิธีที่ 3 (ไม่ส่ง Status) ชั่วคราว แล้วเพิ่ม Status ใน Airtable เองภายหลัง

