import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import '../../styles/components/DateTimePicker.css';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [selectedTime, setSelectedTime] = useState({ hour: 0, minute: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setSelectedTime({ hour: date.getHours(), minute: date.getMinutes() });
    }
  }, [value]);

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(selectedTime.hour).padStart(2, '0');
    const minutes = String(selectedTime.minute).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    updateDateTime(newDate, selectedTime.hour, selectedTime.minute);
  };

  const handleTimeSelect = (type: 'hour' | 'minute', value: number) => {
    const newTime = { ...selectedTime, [type]: value };
    setSelectedTime(newTime);
    if (selectedDate) {
      updateDateTime(selectedDate, newTime.hour, newTime.minute);
    }
  };

  const updateDateTime = (date: Date, hour: number, minute: number) => {
    const newDateTime = new Date(date);
    newDateTime.setHours(hour, minute, 0, 0);
    onChange(formatDate(newDateTime));
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
    setSelectedTime({ hour: today.getHours(), minute: today.getMinutes() });
    onChange(formatDate(today));
  };

  const handleClear = () => {
    setSelectedDate(null);
    setSelectedTime({ hour: 0, minute: 0 });
    onChange('');
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Dias do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const displayValue = value && selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, '0')} / ${String(selectedDate.getMonth() + 1).padStart(2, '0')} / ${selectedDate.getFullYear()} ${String(selectedTime.hour).padStart(2, '0')} : ${String(selectedTime.minute).padStart(2, '0')}`
    : placeholder || 'dd / mm / aaaa -- : --';

  return (
    <div className="datetime-picker-container" ref={containerRef}>
      <div 
        className="datetime-picker-input"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar size={18} className="datetime-picker-icon" />
        <span className={value ? 'datetime-picker-value' : 'datetime-picker-placeholder'}>
          {displayValue}
        </span>
      </div>

      {isOpen && (
        <div className="datetime-picker-modal">
          <div className="datetime-picker-content">
            {/* Calendário */}
            <div className="datetime-picker-calendar">
              <div className="calendar-header">
                <button 
                  className="calendar-nav-btn"
                  onClick={() => navigateMonth('prev')}
                  type="button"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="calendar-month-year">
                  {months[currentMonth.getMonth()]} de {currentMonth.getFullYear()}
                </span>
                <button 
                  className="calendar-nav-btn"
                  onClick={() => navigateMonth('next')}
                  type="button"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="calendar-weekdays">
                {weekDays.map((day, index) => (
                  <div key={index} className="calendar-weekday">{day}</div>
                ))}
              </div>

              <div className="calendar-days">
                {getDaysInMonth(currentMonth).map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="calendar-day empty" />;
                  }
                  return (
                    <button
                      key={index}
                      className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
                      onClick={() => handleDateSelect(day)}
                      type="button"
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="calendar-footer">
                <button className="calendar-action-btn" onClick={handleClear} type="button">
                  Limpar
                </button>
                <button className="calendar-action-btn" onClick={handleToday} type="button">
                  Hoje
                </button>
              </div>
            </div>

            {/* Seletor de Hora */}
            <div className="datetime-picker-time">
              <div className="time-label">
                <Clock size={16} />
                Hora
              </div>
              <div className="time-selectors">
                <div className="time-column">
                  <div className="time-value selected">{String(selectedTime.hour).padStart(2, '0')}</div>
                  <div className="time-scroll">
                    {Array.from({ length: 24 }, (_, i) => (
                      <button
                        key={i}
                        className={`time-option ${selectedTime.hour === i ? 'active' : ''}`}
                        onClick={() => handleTimeSelect('hour', i)}
                        type="button"
                      >
                        {String(i).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="time-column">
                  <div className="time-value selected">{String(selectedTime.minute).padStart(2, '0')}</div>
                  <div className="time-scroll">
                    {Array.from({ length: 60 }, (_, i) => (
                      <button
                        key={i}
                        className={`time-option ${selectedTime.minute === i ? 'active' : ''}`}
                        onClick={() => handleTimeSelect('minute', i)}
                        type="button"
                      >
                        {String(i).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;

