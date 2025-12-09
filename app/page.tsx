'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Available time options for dropdown (24 hours, hourly slots)
const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const ROOMS = [
  { id: 'room1', name: 'ห้องที่ 1' },
  { id: 'room2', name: 'ห้องที่ 2' },
];

// This function will be replaced with API call

export default function HomePage() {
  const router = useRouter();
  // Get today's date in YYYY-MM-DD format for date input
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [availableRoomsData, setAvailableRoomsData] = useState<Array<{id: string, name: string}>>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [timeConfirmed, setTimeConfirmed] = useState<boolean>(false);

  const handleConfirmTime = async () => {
    if (!startTime || !endTime) {
      alert('กรุณาเลือกเวลาเริ่มต้นและเวลาสิ้นสุด');
      return;
    }
    
    if (startTime >= endTime) {
      alert('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      return;
    }

    setIsLoadingRooms(true);
    setTimeConfirmed(true);
    setSelectedRoom(''); // Reset room selection
    
    try {
      // Call API to get available rooms from Airtable
      const response = await fetch('/api/rooms/available', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          startTime: startTime,
          endTime: endTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'ไม่สามารถดึงข้อมูลห้องได้');
      }

      // Update available rooms
      setAvailableRooms(data.availableRooms || []);
      setAvailableRoomsData(data.rooms || []);
      
      // Show warning if there's a fallback message
      if (data.warning) {
        console.warn(data.warning);
      }
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      alert('ไม่สามารถดึงข้อมูลห้องได้ กรุณาลองอีกครั้ง');
      setTimeConfirmed(false);
      setAvailableRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleResetTime = () => {
    setStartTime('');
    setEndTime('');
    setTimeConfirmed(false);
    setAvailableRooms([]);
    setAvailableRoomsData([]);
    setSelectedRoom('');
  };

  const handleContinue = () => {
    if (selectedDate && startTime && endTime && selectedRoom) {
      // Store selection in sessionStorage to pass to next page
      sessionStorage.setItem('bookingData', JSON.stringify({
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        timeSlot: `${startTime} - ${endTime}`, // For display purposes
        roomId: selectedRoom,
        roomName: availableRoomsData.find(r => r.id === selectedRoom)?.name || ROOMS.find(r => r.id === selectedRoom)?.name || '',
      }));
      router.push('/booking');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Queue Master</h1>
          <p className="text-lg text-gray-600">ระบบจองห้องสำหรับร้านอาหาร</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">เลือกช่วงเวลาและห้อง</h2>

          {/* Date Selection */}
          <div className="mb-8">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              เลือกวันที่
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            />
          </div>

          {/* Time Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              เลือกช่วงเวลา
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Start Time */}
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาเริ่มต้น
                </label>
                <select
                  id="startTime"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setTimeConfirmed(false);
                    setAvailableRooms([]);
                    setSelectedRoom('');
                  }}
                  disabled={timeConfirmed}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- เลือกเวลาเริ่มต้น --</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาสิ้นสุด
                </label>
                <select
                  id="endTime"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setTimeConfirmed(false);
                    setAvailableRooms([]);
                    setSelectedRoom('');
                  }}
                  disabled={timeConfirmed}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- เลือกเวลาสิ้นสุด --</option>
                  {TIME_OPTIONS.filter(time => !startTime || time > startTime).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Confirm Time Button */}
            {startTime && endTime && !timeConfirmed && (
              <div className="mb-4">
                <button
                  onClick={handleConfirmTime}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                >
                  ยืนยันช่วงเวลา
                </button>
              </div>
            )}

            {/* Reset Time Button */}
            {timeConfirmed && (
              <div className="mb-4">
                <button
                  onClick={handleResetTime}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm"
                >
                  เปลี่ยนช่วงเวลา
                </button>
              </div>
            )}

            {/* Display Selected Time Range */}
            {timeConfirmed && startTime && endTime && (
              <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-900">
                  <span className="font-semibold">ช่วงเวลาที่เลือก:</span> {startTime} - {endTime}
                </p>
              </div>
            )}
          </div>

          {/* Available Rooms */}
          {timeConfirmed && (
            <div className="mb-8">
              {isLoadingRooms ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">กำลังโหลดข้อมูลห้อง...</p>
                </div>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    ห้องที่ว่างในช่วงเวลา {startTime} - {endTime}
                  </label>
                  {availableRooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableRoomsData.map((room) => {
                        const isSelected = selectedRoom === room.id;
                        return (
                          <button
                            key={room.id}
                            onClick={() => setSelectedRoom(room.id)}
                            className={`p-6 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-center">
                              <div className={`text-2xl mb-2 ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`}>
                                🏠
                              </div>
                              <div className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                                {room.name}
                              </div>
                              {isSelected && (
                                <div className="mt-2 text-sm text-indigo-600">✓ เลือกแล้ว</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">ไม่มีห้องว่างในช่วงเวลานี้</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Continue Button */}
          {selectedDate && timeConfirmed && startTime && endTime && selectedRoom && (
            <div className="mt-8">
              <button
                onClick={handleContinue}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl"
              >
                ดำเนินการต่อ →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

