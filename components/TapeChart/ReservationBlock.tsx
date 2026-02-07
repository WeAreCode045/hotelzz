import React from 'react';
import { Reservation, Guest } from '../../types';
import { getDateDiff, getStatusColor } from '../../utils/helpers';

interface Props {
  reservation: Reservation;
  guest?: Guest;
  startDate: string; // The start date of the visible grid
  cellWidth: number;
  onClick: (res: Reservation) => void;
  // Drag props
  onMouseDown: (e: React.MouseEvent, resId: string) => void;
  isDragging?: boolean;
  dragOffset?: { x: number; y: number };
}

export const ReservationBlock: React.FC<Props> = ({ 
  reservation, 
  guest, 
  startDate, 
  cellWidth, 
  onClick, 
  onMouseDown,
  isDragging,
  dragOffset 
}) => {
  // Calculate offset and width
  const offsetDays = getDateDiff(startDate, reservation.checkIn);
  const durationDays = getDateDiff(reservation.checkIn, reservation.checkOut);
  
  // Visual positions
  const baseLeft = offsetDays * cellWidth;
  const width = durationDays * cellWidth;

  const left = isDragging ? baseLeft + (dragOffset?.x || 0) : baseLeft;
  const top = isDragging ? (dragOffset?.y || 0) : 0;

  // Basic color based on status
  const colorClass = getStatusColor(reservation.status);

  return (
    <div
      className={`absolute h-8 mt-1 rounded text-xs font-medium flex items-center px-2 cursor-pointer shadow-sm overflow-hidden whitespace-nowrap z-10 ${colorClass} ${isDragging ? 'shadow-2xl ring-2 ring-white z-50 pointer-events-none opacity-90' : 'transition-all hover:brightness-110'}`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width - 2, 4)}px`, // -2 for gap
        top: `${top}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onClick={(e) => {
        if (!isDragging) {
           e.stopPropagation();
           onClick(reservation);
        }
      }}
      onMouseDown={(e) => {
        // Only trigger drag on left click and not if we are just clicking (though click vs drag is handled in parent usually, 
        // passing it up allows parent to decide)
        e.stopPropagation();
        onMouseDown(e, reservation.id);
      }}
      title={`${guest?.firstName} ${guest?.lastName} - ${reservation.status}`}
    >
      <span className="truncate">
        {guest ? `${guest.lastName}, ${guest.firstName}` : 'Unknown Guest'}
      </span>
      {(reservation.balance || 0) > 0 && (
         <span className="ml-auto bg-red-500 w-2 h-2 rounded-full block flex-shrink-0" title="Unpaid Balance"></span>
      )}
    </div>
  );
};
