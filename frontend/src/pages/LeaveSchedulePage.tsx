import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { api } from '@/api';
import { useAuth } from '@/hooks';
import { Calendar as CalendarIcon, Trash2, Edit2, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface LeaveSchedule {
  id: number;
  user: number;
  user_name: string;
  start_date: string;
  end_date: string;
  leave_type: 'vacation' | 'sick' | 'personal' | 'other';
  reason: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const LEAVE_TYPE_COLORS: Record<string, string> = {
  vacation: '#3B82F6',
  sick: '#EF4444',
  personal: '#8B5CF6',
  other: '#6B7280',
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: 'Vacation',
  sick: 'Sick Leave',
  personal: 'Personal',
  other: 'Other',
};

interface TeamMember {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
  };
  team: number;
}

export function LeaveSchedulePage() {
  const location = useLocation();
  const { getToken } = useClerkAuth();
  const { backendUser } = useAuth();
  const [leaves, setLeaves] = useState<LeaveSchedule[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveSchedule[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveSchedule | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduleView, setScheduleView] = useState<'my' | 'team'>('my');
  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] = useState(false);
  const scheduleDropdownRef = useRef<HTMLDivElement>(null);
  const [timezone, setTimezone] = useState<string>(() => {
    // Auto-detect user's timezone
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  });
  const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState(false);
  const timezoneDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'vacation' as LeaveSchedule['leave_type'],
    reason: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch leaves and team members
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const token = await getToken?.();
        
        // Fetch all leave schedules (for team view)
        const leavesResponse = await api.get<PaginatedResponse<LeaveSchedule>>('/leave-schedules/', token || undefined);
        setAllLeaves(leavesResponse.results || []);
        
        // Fetch team members to filter team schedules
        try {
          const membersResponse = await api.get<PaginatedResponse<TeamMember>>('/members/', token || undefined);
          setTeamMembers(membersResponse.results || []);
        } catch (err) {
          console.warn('Failed to fetch team members:', err);
          setTeamMembers([]);
        }
      } catch (err) {
        console.error('Failed to fetch leaves:', err);
        setError('Failed to load leave schedule');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [getToken]);

  // Check URL params for initial view
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    if (viewParam === 'team') {
      setScheduleView('team');
    } else {
      setScheduleView('my');
    }
  }, [location.search]);

  // Filter leaves based on view
  useEffect(() => {
    if (scheduleView === 'my') {
      // Show only current user's leaves
      const myLeaves = allLeaves.filter(leave => leave.user === backendUser?.id);
      setLeaves(myLeaves);
    } else {
      // Show team members' leaves
      const teamMemberIds = teamMembers.map(m => m.user.id);
      const teamLeaves = allLeaves.filter(leave => teamMemberIds.includes(leave.user));
      setLeaves(teamLeaves);
    }
  }, [scheduleView, allLeaves, teamMembers, backendUser]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (scheduleDropdownRef.current && !scheduleDropdownRef.current.contains(event.target as Node)) {
        setIsScheduleDropdownOpen(false);
      }
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target as Node)) {
        setIsTimezoneDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get timezone options
  const getTimezoneOptions = () => {
    const getTimezoneInfo = (tz: string) => {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'short',
        });
        const parts = formatter.formatToParts(now);
        const tzAbbr = parts.find(part => part.type === 'timeZoneName')?.value || '';
        
        // Get UTC offset
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
        const offsetMs = tzDate.getTime() - utcDate.getTime();
        const offsetHours = offsetMs / (1000 * 60 * 60);
        const offsetSign = offsetHours >= 0 ? '+' : '';
        const offsetStr = `${offsetSign}${Math.round(offsetHours)}`;
        
        // Friendly timezone names
        const tzNames: Record<string, string> = {
          'America/New_York': 'Eastern Time',
          'America/Chicago': 'Central Time',
          'America/Denver': 'Mountain Time',
          'America/Los_Angeles': 'Pacific Time',
          'Europe/London': 'London',
          'Europe/Paris': 'Paris',
          'Europe/Berlin': 'Berlin',
          'Asia/Tokyo': 'Tokyo',
          'Asia/Shanghai': 'Shanghai',
          'Asia/Dubai': 'Dubai',
          'Australia/Sydney': 'Sydney',
          'America/Sao_Paulo': 'São Paulo',
          'America/Mexico_City': 'Mexico City',
        };
        
        const friendlyName = tzNames[tz] || tz.replace('America/', '').replace('Europe/', '').replace('Asia/', '').replace('Australia/', '').replace(/_/g, ' ');
        const displayName = `${friendlyName} (${tzAbbr}, UTC${offsetStr})`;
        
        return { tz, label: displayName, offset: offsetStr };
      } catch {
        return { tz, label: tz.replace(/_/g, ' '), offset: '' };
      }
    };
    
    const commonTimezones = [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
      'Asia/Dubai', 'Australia/Sydney', 'America/Sao_Paulo', 'America/Mexico_City',
      'UTC',
    ];
    
    return commonTimezones.map(getTimezoneInfo);
  };

  const timezoneOptions = getTimezoneOptions();
  const selectedTimezone = timezoneOptions.find(opt => opt.tz === timezone) || timezoneOptions[0];

  const handleOpenModal = (leave?: LeaveSchedule, prefillDate?: string) => {
    if (leave) {
      setEditingLeave(leave);
      setFormData({
        start_date: leave.start_date,
        end_date: leave.end_date,
        leave_type: leave.leave_type,
        reason: leave.reason || '',
      });
    } else {
      setEditingLeave(null);
      const dateToUse = prefillDate || '';
      setFormData({
        start_date: dateToUse,
        end_date: dateToUse, // Pre-fill end date with same date for convenience
        leave_type: 'vacation',
        reason: '',
      });
    }
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLeave(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const token = await getToken?.();
      if (editingLeave) {
        // Update existing leave
        await api.patch<LeaveSchedule>(
          `/leave-schedules/${editingLeave.id}/`,
          formData,
          token || undefined
        );
      } else {
        // Create new leave
        await api.post<LeaveSchedule>('/leave-schedules/', formData, token || undefined);
      }
      handleCloseModal();
      // Refresh leaves
      const response = await api.get<PaginatedResponse<LeaveSchedule>>('/leave-schedules/', token || undefined);
      setAllLeaves(response.results || []);
    } catch (err: any) {
      console.error('Failed to save leave:', err);
      let errorMessage = 'Failed to save leave schedule';
      
      // Try to extract a better error message
      if (err.message) {
        try {
          // Try to parse if it's JSON
          const parsedError = JSON.parse(err.message);
          if (typeof parsedError === 'object') {
            // Handle DRF validation errors
            if (parsedError.end_date) {
              errorMessage = Array.isArray(parsedError.end_date) 
                ? parsedError.end_date[0] 
                : parsedError.end_date;
            } else if (parsedError.start_date) {
              errorMessage = Array.isArray(parsedError.start_date) 
                ? parsedError.start_date[0] 
                : parsedError.start_date;
            } else if (parsedError.leave_type) {
              errorMessage = Array.isArray(parsedError.leave_type) 
                ? parsedError.leave_type[0] 
                : parsedError.leave_type;
            } else if (parsedError.detail) {
              errorMessage = parsedError.detail;
            } else if (parsedError.message) {
              errorMessage = parsedError.message;
            } else {
              errorMessage = JSON.stringify(parsedError);
            }
          } else {
            errorMessage = err.message;
          }
        } catch {
          // If not JSON, use the message as-is
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this leave schedule?')) {
      return;
    }

    try {
      const token = await getToken?.();
      await api.delete(`/leave-schedules/${id}/`, token || undefined);
      // Refresh leaves
      const response = await api.get<PaginatedResponse<LeaveSchedule>>('/leave-schedules/', token || undefined);
      setAllLeaves(response.results || []);
    } catch (err) {
      console.error('Failed to delete leave:', err);
      setError('Failed to delete leave schedule');
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateInRange = (date: Date, leave: LeaveSchedule) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const startDate = new Date(leave.start_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(leave.end_date);
    endDate.setHours(0, 0, 0, 0);
    return checkDate >= startDate && checkDate <= endDate;
  };

  const getLeavesForDate = (date: Date) => {
    return leaves.filter(leave => isDateInRange(date, leave));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return (
      <div className="w-full">
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold py-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-24" />;
            }

            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateLeaves = getLeavesForDate(date);
            const isToday = 
              date.toDateString() === new Date().toDateString();
            const isPast = date < new Date() && !isToday;

            const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            return (
              <div
                key={index}
                className={`${scheduleView === 'team' ? 'h-32' : 'h-24'} border rounded-lg p-1 transition-colors relative ${
                  scheduleView === 'team' 
                    ? 'overflow-y-auto' 
                    : isPast 
                      ? 'overflow-hidden cursor-not-allowed' 
                      : 'overflow-hidden cursor-pointer hover:bg-opacity-80'
                }`}
                style={{
                  borderColor: '#000000',
                  borderWidth: '1px',
                  backgroundColor: isPast ? '#F3F4F6' : '#FFFFFF',
                  opacity: isPast ? 0.7 : 1,
                }}
                onClick={() => {
                  // In Team Schedule view, don't allow editing (read-only)
                  if (scheduleView === 'team') {
                    return;
                  }
                  // Don't allow creating/editing leaves on past dates
                  if (isPast) {
                    return;
                  }
                  // If clicking on a date with leaves, show details, otherwise open new leave form
                  if (dateLeaves.length > 0) {
                    handleOpenModal(dateLeaves[0]);
                  } else {
                    handleOpenModal(undefined, dateString);
                  }
                }}
              >
                <div
                  className={`text-sm font-medium ${
                    isToday ? 'font-bold' : ''
                  }`}
                  style={{
                    color: isToday ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  }}
                >
                  {day}
                </div>
                {dateLeaves.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {scheduleView === 'team' ? (
                      // Team Schedule: Show names
                      <>
                        {dateLeaves.slice(0, 3).map((leave, idx) => (
                          <div
                            key={leave.id}
                            className="text-xs font-medium truncate"
                            style={{ 
                              color: 'var(--color-text-primary)',
                              backgroundColor: LEAVE_TYPE_COLORS[leave.leave_type] + '20',
                              padding: '2px 4px',
                              borderRadius: '3px',
                            }}
                            title={`${leave.user_name} - ${LEAVE_TYPE_LABELS[leave.leave_type]}: ${leave.start_date} - ${leave.end_date}`}
                          >
                            {leave.user_name}
                          </div>
                        ))}
                        {dateLeaves.length > 3 && (
                          <div
                            className="text-xs font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            +{dateLeaves.length - 3} more
                          </div>
                        )}
                      </>
                    ) : (
                      // My Schedule: Show leave type badge
                      <>
                        <div
                          className="text-xs font-semibold px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: LEAVE_TYPE_COLORS[dateLeaves[0].leave_type],
                            color: '#ffffff',
                          }}
                          title={`${LEAVE_TYPE_LABELS[dateLeaves[0].leave_type]}: ${dateLeaves[0].start_date} - ${dateLeaves[0].end_date}`}
                        >
                          On Leave
                        </div>
                        {dateLeaves.length > 1 && (
                          <div
                            className="text-xs font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            +{dateLeaves.length - 1} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-serif" style={{ color: 'var(--color-text-primary)' }}>
            Leave Schedule
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Schedule your unavailability and leave at work
          </p>
        </div>
        {/* Schedule View Dropdown */}
        <div ref={scheduleDropdownRef} className="relative">
          <button
            onClick={() => setIsScheduleDropdownOpen(!isScheduleDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF'
            }}
          >
            <span className="font-medium">
              {scheduleView === 'my' ? 'My Schedule' : 'Team Schedule'}
            </span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${isScheduleDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isScheduleDropdownOpen && (
            <div
              className="absolute top-full rounded-lg shadow-lg overflow-hidden z-50 min-w-[160px]"
              style={{
                right: '50%',
                marginTop: '4px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              <button
                onClick={() => {
                  setScheduleView('my');
                  setIsScheduleDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                style={{
                  backgroundColor: scheduleView === 'my' ? '#000000' : 'transparent',
                  color: scheduleView === 'my' ? '#FFFFFF' : 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (scheduleView !== 'my') {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (scheduleView !== 'my') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                <span className="font-medium text-sm">My Schedule</span>
              </button>
              <button
                onClick={() => {
                  setScheduleView('team');
                  setIsScheduleDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                style={{
                  backgroundColor: scheduleView === 'team' ? '#000000' : 'transparent',
                  color: scheduleView === 'team' ? '#FFFFFF' : 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (scheduleView !== 'team') {
                    e.currentTarget.style.backgroundColor = '#000000';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (scheduleView !== 'team') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                <span className="font-medium text-sm">Team Schedule</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calendar</CardTitle>
            <div className="flex items-center gap-3">
              {/* Timezone Selector */}
              <div ref={timezoneDropdownRef} className="relative">
                <button
                  onClick={() => setIsTimezoneDropdownOpen(!isTimezoneDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all border"
                  style={{
                    backgroundColor: isTimezoneDropdownOpen ? '#000000' : '#FFFFFF',
                    color: isTimezoneDropdownOpen ? '#FFFFFF' : 'var(--color-text-primary)',
                    borderColor: '#000000',
                  }}
                >
                  <span className="text-xs font-medium max-w-[200px] truncate">
                    {selectedTimezone?.label || timezone}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${isTimezoneDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Timezone Dropdown */}
                {isTimezoneDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 rounded-lg shadow-lg overflow-hidden z-50 min-w-[280px] max-h-[300px] overflow-y-auto"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {timezoneOptions.map((option) => (
                      <button
                        key={option.tz}
                        onClick={() => {
                          setTimezone(option.tz);
                          setIsTimezoneDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left text-sm"
                        style={{
                          backgroundColor: timezone === option.tz ? '#000000' : 'transparent',
                          color: timezone === option.tz ? '#FFFFFF' : 'var(--color-text-secondary)',
                        }}
                        onMouseEnter={(e) => {
                          if (timezone !== option.tz) {
                            e.currentTarget.style.backgroundColor = '#000000';
                            e.currentTarget.style.color = '#FFFFFF';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (timezone !== option.tz) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                          }
                        }}
                      >
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeMonth(-1)}
                >
                  <ChevronLeft size={20} />
                </Button>
                <div className="text-lg font-semibold min-w-[180px] text-center" style={{ color: 'var(--color-text-primary)' }}>
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: timezone })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => changeMonth(1)}
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
              Loading calendar...
            </div>
          ) : (
            renderCalendar()
          )}
        </CardContent>
      </Card>

      {/* Leave List - Only show in My Schedule view */}
      {scheduleView === 'my' && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Leaves</CardTitle>
          </CardHeader>
          <CardContent>
          {isLoading ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
              Loading...
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
              No leave schedules yet. Click "Schedule Leave" to add one.
            </div>
          ) : (
            <div className="space-y-3">
              {leaves
                .filter(leave => new Date(leave.end_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                .map((leave) => (
                  <div
                    key={leave.id}
                    className="p-4 rounded-lg border"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: LEAVE_TYPE_COLORS[leave.leave_type] }}
                          />
                          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {LEAVE_TYPE_LABELS[leave.leave_type]}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          <div className="flex items-center gap-1">
                            <CalendarIcon size={16} />
                            <span>
                              {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {leave.reason && (
                          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {leave.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(leave)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(leave.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <Card
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingLeave ? 'Edit Leave' : 'Schedule Leave'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Leave Type
                  </label>
                  <select
                    value={formData.leave_type}
                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value as LeaveSchedule['leave_type'] })}
                    className="w-full px-4 py-2 rounded-lg border text-base"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    required
                  >
                    {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Reason (Optional)
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border text-base resize-none"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1">
                    {editingLeave ? 'Update' : 'Schedule'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

