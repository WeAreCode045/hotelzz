import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, getDaysArray, formatDate } from '../../utils/helpers';
import { api } from '../../services/api';
import { Room, RoomType, Reservation, RoomStatus } from '../../types';
import { ReservationBlock } from './ReservationBlock';
import { ReservationDetail } from '../Reservation/ReservationDetail';
import { NewReservationModal } from '../Reservation/NewReservationModal';
import { ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const CELL_WIDTH = 64; // px width per day
const ROW_HEIGHT = 48; // px height per room

export const TapeChart: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);

  // Drag State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialMouse, setInitialMouse] = useState({ x: 0, y: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({ queryKey: ['rooms'], queryFn: api.getRooms });
  const { data: roomTypes = [] } = useQuery({ queryKey: ['roomTypes'], queryFn: api.getRoomTypes });
  const { data: guests = [] } = useQuery({ queryKey: ['guests'], queryFn: api.getGuests });
  
  // Calculate date range (14 days view)
  const days = useMemo(() => getDaysArray(new Date(startDate), 14), [startDate]);
  const endDate = days[days.length - 1];

  const { data: reservations = [], isLoading: loadingRes } = useQuery({
    queryKey: ['reservations', startDate],
    queryFn: () => api.getReservations(startDate, endDate)
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: RoomStatus }) => api.updateRoomStatus(id, status),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['rooms'] });
       toast({ type: 'success', title: 'Room Status Updated' });
    }
  });

  const moveReservationMutation = useMutation({
    mutationFn: (data: { id: string, roomId: string, checkIn: string, checkOut: string }) => 
        api.moveReservation(data.id, data.roomId, data.checkIn, data.checkOut),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
        toast({ type: 'success', title: 'Reservation Moved', description: 'Dates and room updated successfully.' });
    },
    onError: (error: any) => {
        toast({ type: 'error', title: 'Move Failed', description: error.message || "Failed to move reservation" });
    }
  });

  // Group rooms by Type
  const roomsByType = useMemo(() => {
    const grouped: Record<string, Room[]> = {};
    roomTypes.forEach(rt => grouped[rt.id] = []);
    rooms.forEach(r => {
      if (grouped[r.roomTypeId]) grouped[r.roomTypeId].push(r);
    });
    return grouped;
  }, [rooms, roomTypes]);

  // Navigation handlers
  const handlePrev = () => setStartDate(prev => addDays(prev, -7));
  const handleNext = () => setStartDate(prev => addDays(prev, 7));
  const handleToday = () => setStartDate(new Date().toISOString().split('T')[0]);

  const handleRoomStatusToggle = (room: Room) => {
    const newStatus = room.status === RoomStatus.CLEAN ? RoomStatus.DIRTY : RoomStatus.CLEAN;
    updateStatusMutation.mutate({ id: room.id, status: newStatus });
  };

  // --- DRAG AND DROP HANDLERS ---

  const handleDragStart = useCallback((e: React.MouseEvent, resId: string) => {
      setDraggingId(resId);
      setInitialMouse({ x: e.clientX, y: e.clientY });
      setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (draggingId) {
          setDragOffset({
              x: e.clientX - initialMouse.x,
              y: e.clientY - initialMouse.y
          });
      }
  }, [draggingId, initialMouse]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
      if (draggingId) {
          const originalRes = reservations.find(r => r.id === draggingId);
          
          if (originalRes) {
              // 1. Calculate Day Shift
              const dayShift = Math.round(dragOffset.x / CELL_WIDTH);
              
              // 2. Calculate Target Room
              // We use pointer-events: none on the dragged item, so elementFromPoint sees 'through' it.
              const el = document.elementFromPoint(e.clientX, e.clientY);
              const rowEl = el?.closest('[data-room-id]');
              const targetRoomId = rowEl?.getAttribute('data-room-id');

              // 3. Commit Change if valid
              if (targetRoomId && (dayShift !== 0 || targetRoomId !== originalRes.roomId)) {
                  const newCheckIn = addDays(originalRes.checkIn, dayShift);
                  const newCheckOut = addDays(originalRes.checkOut, dayShift);
                  
                  moveReservationMutation.mutate({
                      id: draggingId,
                      roomId: targetRoomId,
                      checkIn: newCheckIn,
                      checkOut: newCheckOut
                  });
              }
          }

          setDraggingId(null);
          setDragOffset({ x: 0, y: 0 });
      }
  }, [draggingId, dragOffset, reservations, moveReservationMutation]);

  // Attach global listeners for drag
  useEffect(() => {
      if (draggingId) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      } else {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [draggingId, handleMouseMove, handleMouseUp]);


  if (loadingRooms || loadingRes) return (
    <div className="flex h-full items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Loading Tape Chart...
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden select-none">
      {/* Tape Chart Controls */}
      <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between bg-white z-20 shadow-sm">
        <div className="flex items-center gap-4">
           <h2 className="text-lg font-bold text-slate-800">Tape Chart</h2>
           <div className="flex items-center bg-gray-100 rounded-lg p-1">
             <button onClick={handlePrev} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronLeft size={16} /></button>
             <button onClick={handleToday} className="px-3 text-sm font-medium text-slate-600 hover:text-indigo-600">Today</button>
             <button onClick={handleNext} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronRight size={16} /></button>
           </div>
           <span className="text-sm font-medium text-slate-500">
             {formatDate(startDate)} - {formatDate(endDate)}
           </span>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 mr-4">
                <span className="w-3 h-3 bg-green-500 rounded-sm"></span> Checked In
                <span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Confirmed
                <span className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm"></span> Dirty Room
            </div>
            <button 
                onClick={() => setIsNewReservationModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
            >
                <Plus size={16}/> New Reservation
            </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto relative flex tape-chart-scroll" ref={gridRef}>
        
        {/* Left Column: Room Headers */}
        <div className="sticky left-0 z-30 bg-white border-r border-gray-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] min-w-[200px] w-[200px]">
          <div className="h-[50px] border-b border-gray-200 bg-gray-50"></div> {/* Corner spacer */}
          {roomTypes.map(type => (
            <div key={type.id}>
              <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-gray-200">
                {type.name}
              </div>
              {roomsByType[type.id]?.map(room => (
                <div key={room.id} className="h-[48px] border-b border-gray-100 px-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                  <div>
                    <span className="font-semibold text-slate-700">{room.name}</span>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-slate-500">
                        {room.status === RoomStatus.CLEAN ? 'Clean' : 'Dirty'}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleRoomStatusToggle(room)}
                    className={`opacity-0 group-hover:opacity-100 p-1.5 rounded transition-all ${
                        room.status === RoomStatus.DIRTY ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-indigo-500'
                    }`}
                    title="Toggle Clean Status"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right Area: Timeline Grid */}
        <div className="flex-1 relative">
            {/* Header Dates */}
            <div className="flex sticky top-0 z-20 bg-white shadow-sm h-[50px] border-b border-gray-200 w-max">
                {days.map(day => {
                    const isWeekend = new Date(day).getDay() === 0 || new Date(day).getDay() === 6;
                    return (
                        <div key={day} 
                            className={`flex-shrink-0 border-r border-gray-100 flex flex-col items-center justify-center ${isWeekend ? 'bg-slate-50' : 'bg-white'}`}
                            style={{ width: CELL_WIDTH }}
                        >
                            <span className="text-xs text-slate-500 font-medium">{new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(day))}</span>
                            <span className={`text-sm font-bold ${isWeekend ? 'text-indigo-600' : 'text-slate-800'}`}>
                                {new Date(day).getDate()}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Grid Rows */}
            <div className="w-max pb-20">
                {roomTypes.map(type => (
                    <div key={type.id}>
                        {/* Type Row Spacer (matches left column) */}
                        <div className="h-[33px] bg-gray-50 border-b border-gray-200"></div> 
                        
                        {roomsByType[type.id]?.map(room => (
                            <div 
                                key={room.id} 
                                data-room-id={room.id}
                                className={`relative h-[48px] border-b border-gray-100 flex transition-colors ${
                                    // Highlight target row during drag? (optional visual flair, requires more state)
                                    'bg-white hover:bg-slate-50/50'
                                }`}
                            >
                                {/* Grid Cells */}
                                {days.map(day => {
                                    const isWeekend = new Date(day).getDay() === 0 || new Date(day).getDay() === 6;
                                    return (
                                        <div 
                                            key={day} 
                                            className={`flex-shrink-0 h-full border-r border-gray-100 transition-colors ${isWeekend ? 'bg-slate-50/30' : ''}`}
                                            style={{ width: CELL_WIDTH }}
                                        ></div>
                                    );
                                })}

                                {/* Reservations Layer */}
                                {reservations
                                    .filter(r => r.roomId === room.id)
                                    .map(res => (
                                        <ReservationBlock 
                                            key={res.id} 
                                            reservation={res}
                                            guest={guests.find(g => g.id === res.guestId)}
                                            startDate={startDate}
                                            cellWidth={CELL_WIDTH}
                                            onClick={setSelectedReservation}
                                            onMouseDown={handleDragStart}
                                            isDragging={draggingId === res.id}
                                            dragOffset={draggingId === res.id ? dragOffset : undefined}
                                        />
                                    ))
                                }
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {selectedReservation && (
          <ReservationDetail 
            reservation={selectedReservation} 
            onClose={() => setSelectedReservation(null)} 
          />
      )}
      
      {isNewReservationModalOpen && (
          <NewReservationModal 
            onClose={() => setIsNewReservationModalOpen(false)}
            initialDate={startDate}
          />
      )}
    </div>
  );
};
