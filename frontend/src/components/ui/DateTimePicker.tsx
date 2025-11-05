import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState({ hour: 0, minute: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const adjustModalPosition = () => {
    if (!modalRef.current || !containerRef.current) return;
    
    const modal = modalRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    
    // Resetar estilos inline primeiro
    modal.style.left = '';
    modal.style.right = '';
    modal.style.top = '';
    modal.style.bottom = '';
    
    // Verificar se o modal sai da tela à direita
    if (rect.left + modalRect.width > window.innerWidth - 16) {
      modal.style.left = 'auto';
      modal.style.right = '0';
    } else {
      modal.style.left = '0';
      modal.style.right = 'auto';
    }
    
    // Verificar se o modal sai da tela abaixo
    if (rect.bottom + modalRect.height > window.innerHeight - 16) {
      modal.style.top = 'auto';
      modal.style.bottom = 'calc(100% + 8px)';
    } else {
      modal.style.top = 'calc(100% + 8px)';
      modal.style.bottom = 'auto';
    }
  };

  // Inicializar com valor se existir
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          setSelectedTime({ hour: date.getHours(), minute: date.getMinutes() });
          setCurrentMonth(date);
        }
      } catch (error) {
        console.error('Erro ao parsear data:', error);
      }
    } else {
      setSelectedDate(null);
      setSelectedTime({ hour: 0, minute: 0 });
    }
  }, [value]);

  useLayoutEffect(() => {
    if (isOpen && modalRef.current && containerRef.current) {
      adjustModalPosition();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      if (isOpen) {
        adjustModalPosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
      // Ajustar posicionamento após um pequeno delay para garantir que o modal foi renderizado
      setTimeout(adjustModalPosition, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const formatDate = (date: Date, hour: number, minute: number): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(hour).padStart(2, '0');
    const minutes = String(minute).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateSelect = (day: number) => {
    // Criar nova data garantindo que não há referência compartilhada
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Criar uma nova instância para evitar problemas de referência
    const dateCopy = new Date(newDate.getTime());
    setSelectedDate(dateCopy);
    // Atualizar imediatamente com a hora atual
    updateDateTime(dateCopy, selectedTime.hour, selectedTime.minute);
  };

  const handleTimeChange = (type: 'hour' | 'minute', newValue: number) => {
    // Validar valores
    if (type === 'hour') {
      newValue = Math.max(0, Math.min(23, newValue));
    } else {
      newValue = Math.max(0, Math.min(59, newValue));
    }

    const newTime = { ...selectedTime, [type]: newValue };
    setSelectedTime(newTime);

    // Se já tem data selecionada, atualizar automaticamente
    if (selectedDate) {
      updateDateTime(selectedDate, newTime.hour, newTime.minute);
    }
  };

  const updateDateTime = (date: Date, hour: number, minute: number) => {
    const formatted = formatDate(date, hour, minute);
    onChange(formatted);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
    const newTime = { hour: today.getHours(), minute: today.getMinutes() };
    setSelectedTime(newTime);
    updateDateTime(today, newTime.hour, newTime.minute);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    setSelectedTime({ hour: 0, minute: 0 });
    onChange('');
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      updateDateTime(selectedDate, selectedTime.hour, selectedTime.minute);
      setIsOpen(false);
    }
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

  const handleMonthChange = (monthIndex: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(monthIndex);
      return newMonth;
    });
  };

  const handleYearChange = (year: number) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(year);
      return newMonth;
    });
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
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
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const dayDateOnly = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
    return dayDateOnly.getTime() === selectedDateOnly.getTime();
  };

  const displayValue = value && selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, '0')} / ${String(selectedDate.getMonth() + 1).padStart(2, '0')} / ${selectedDate.getFullYear()} ${String(selectedTime.hour).padStart(2, '0')}:${String(selectedTime.minute).padStart(2, '0')}`
    : placeholder || 'dd / mm / aaaa --:--';

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
        <div className="datetime-picker-modal" ref={modalRef}>
          <div className="datetime-picker-content">
            {/* Calendário */}
            <div className="datetime-picker-calendar">
              <div className="calendar-header">
                <button 
                  className="calendar-nav-btn"
                  onClick={() => navigateMonth('prev')}
                  type="button"
                  title="Mês anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="calendar-month-year-selectors">
                  <select 
                    className="calendar-month-select"
                    value={currentMonth.getMonth()}
                    onChange={(e) => handleMonthChange(Number(e.target.value))}
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                  <select 
                    className="calendar-year-select"
                    value={currentMonth.getFullYear()}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                  >
                    {getYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button 
                  className="calendar-nav-btn"
                  onClick={() => navigateMonth('next')}
                  type="button"
                  title="Próximo mês"
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

              {/* Seletor de Hora */}
              <div className="datetime-picker-time-section">
                <div className="time-label">
                  <Clock size={14} />
                  Hora
                </div>
                <div className="time-inputs">
                  <div className="time-input-group">
                    <label>Hora</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={selectedTime.hour}
                      onChange={(e) => handleTimeChange('hour', parseInt(e.target.value) || 0)}
                      className="time-input"
                    />
                  </div>
                  <div className="time-separator">:</div>
                  <div className="time-input-group">
                    <label>Minuto</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={selectedTime.minute}
                      onChange={(e) => handleTimeChange('minute', parseInt(e.target.value) || 0)}
                      className="time-input"
                    />
                  </div>
                </div>
              </div>

              <div className="calendar-footer">
                <button className="calendar-action-btn" onClick={handleClear} type="button">
                  Limpar
                </button>
                <div className="calendar-footer-right">
                  <button className="calendar-action-btn" onClick={handleToday} type="button">
                    Hoje
                  </button>
                  <button 
                    className="calendar-action-btn confirm-btn" 
                    onClick={handleConfirm} 
                    type="button"
                    disabled={!selectedDate}
                  >
                    Confirmar
                  </button>
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
