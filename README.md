# Queue Master - Restaurant Room Booking System

ระบบจองห้องสำหรับร้านอาหารที่สร้างด้วย Next.js 14, TypeScript, และ TailwindCSS

## Features

1. **หน้าแรก**: แสดงห้องที่ว่างและเลือกช่วงเวลา
2. **หน้าจองห้อง**: กรอกข้อมูลเพิ่มเติม (ชื่อ, นามสกุล)
3. **บันทึกข้อมูล**: บันทึกลง Airtable พร้อม retry logic
4. **Error Handling**: แสดงข้อความ error ที่เข้าใจง่ายเป็นภาษาไทย
5. **Responsive Design**: รองรับทั้ง desktop และ mobile

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Airtable
- **Infrastructure**: Docker + Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker and Docker Compose (optional)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   ไฟล์ `.env.local` ควรมีอยู่แล้ว (ถูกสร้างไว้แล้ว) แต่ถ้ายังไม่มี:
   ```bash
   cp .env.example .env.local
   ```
   
   แก้ไข `.env.local` และเพิ่มข้อมูล Airtable:
   ```
   AIRTABLE_API_KEY=your_airtable_api_key
   AIRTABLE_BASE_ID=your_airtable_base_id
   AIRTABLE_TABLE_NAME=Bookings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Set up Airtable:**
   
   สร้าง Base ใน Airtable และสร้าง Table ชื่อ "Bookings" พร้อม Fields:
   - First Name (Single line text)
   - Last Name (Single line text)
   - Time Slot (Single line text)
   - Room ID (Single line text)
   - Room Name (Single line text)
   - Receipt (Attachment)
   - Status (Single line text)
   - Created At (Date)

4. **Run development server:**
   ```bash
   pnpm run dev
   # หรือ
   npm run dev
   ```

5. เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

6. **ทดสอบการเชื่อมต่อ Airtable (Optional):**
   ```bash
   pnpm run setup:airtable
   ```

### Docker Deployment

#### Development Mode

1. **Build and run with Docker Compose (development):**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. แอปจะรันที่ [http://localhost:3000](http://localhost:3000)

#### Production Mode

1. **Build and run with Docker Compose (production):**
   ```bash
   docker-compose up -d --build
   ```

2. แอปจะรันที่ [http://localhost:3000](http://localhost:3000)

## Project Structure

```
queue-master/
├── app/
│   ├── api/
│   │   └── bookings/
│   │       └── route.ts      # API endpoint for saving bookings
│   ├── booking/
│   │   └── page.tsx          # Booking form page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page (room selection)
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Docker configuration
└── package.json              # Dependencies
```

## Environment Variables

- `AIRTABLE_API_KEY`: Airtable API key
- `AIRTABLE_BASE_ID`: Airtable Base ID
- `AIRTABLE_TABLE_NAME`: Name of the Airtable table (default: "Bookings")
- `NEXT_PUBLIC_APP_URL`: Public URL of the application

## License

MIT

# queue-master
