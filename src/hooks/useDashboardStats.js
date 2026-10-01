// src/hooks/useDashboardStats.js
// Reactive hook to manage Dashboard stats, SRS memory distribution, Hero state, Flame calendar & IELTS goal
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getDashboardStats as apiGetDashboardStats,
  getNextReviewTime as apiGetNextReviewTime,
  getMonthlyStudySessions as apiGetMonthlyStudySessions,
  getIELTSGoal as apiGetIELTSGoal,
} from '../services/db.js';

const DEFAULT_LEVELS = { lv0: 0, lv1: 0, lv2: 0, lv3: 0, lv4: 0, lv5: 0 };

export function useDashboardStats() {
  const [stats, setStats] = useState({
    wordsDueCount: 0,
    streak: 0,
    memoryLevels: DEFAULT_LEVELS,
    totalWordsLearned: 0,
  });

  const [heroState, setHeroState] = useState('ready'); // 'ready' | 'countdown' | 'empty'
  const [countdown, setCountdown] = useState({ hours: '00', minutes: '00', seconds: '00', label: '' });
  const [nextReviewTime, setNextReviewTime] = useState(null);

  // Flame calendar state
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [calendarSessions, setCalendarSessions] = useState({});
  const [calendarHint, setCalendarHint] = useState('');

  // IELTS Goal state
  const [ieltsGoal, setIeltsGoal] = useState({
    isSet: false,
    overall: '7.0',
    listening: '7.0',
    reading: '7.0',
    writing: '6.5',
    speaking: '6.5',
    daysLeft: 0,
    examDateText: '',
    motto: 'Học tập kiên trì, tự tin chinh phục mục tiêu IELTS!',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const countdownIntervalRef = useRef(null);
  const hintTimeoutRef = useRef(null);

  // 1. Fetch Main Stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rawStats = await apiGetDashboardStats();
      if (rawStats) {
        const mem = rawStats.memoryLevels || DEFAULT_LEVELS;
        const total =
          (mem.lv0 || 0) +
          (mem.lv1 || 0) +
          (mem.lv2 || 0) +
          (mem.lv3 || 0) +
          (mem.lv4 || 0) +
          (mem.lv5 || 0);

        const due = rawStats.wordsDueCount || 0;

        setStats({
          wordsDueCount: due,
          streak: rawStats.streak || 0,
          memoryLevels: mem,
          totalWordsLearned: total,
        });

        // Determine Hero State
        if (total === 0) {
          setHeroState('empty');
        } else if (due > 0) {
          setHeroState('ready');
        } else {
          setHeroState('countdown');
          try {
            const nextT = await apiGetNextReviewTime();
            setNextReviewTime(nextT ? new Date(nextT) : null);
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('[useDashboardStats] Failed to fetch stats:', err);
      setError(err.message || 'Không thể tải thống kê');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Flame Calendar Sessions
  const fetchCalendarSessions = useCallback(async (date) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    try {
      const sessions = await apiGetMonthlyStudySessions(y, m);
      setCalendarSessions(sessions || {});
    } catch (err) {
      console.warn('[useDashboardStats] Calendar sessions error:', err);
    }
  }, []);

  // 3. Fetch IELTS Goal
  const fetchIeltsGoal = useCallback(async () => {
    try {
      const goal = await apiGetIELTSGoal();

      if (goal && goal.examDate) {
        const examDateObj = new Date(goal.examDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        examDateObj.setHours(0, 0, 0, 0);

        const diffTime = examDateObj - today;
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const [y, m, d] = goal.examDate.split('-');
        const dateFormatted = d && m && y ? `${d}/${m}/${y}` : goal.examDate;

        setIeltsGoal({
          isSet: true,
          overall: goal.overall || '7.0',
          listening: goal.listening || '7.0',
          reading: goal.reading || '7.0',
          writing: goal.writing || '6.5',
          speaking: goal.speaking || '6.5',
          daysLeft: Math.max(0, days),
          examDateText: dateFormatted,
          motto: goal.motto || '“Học tập kiên trì, tự tin chinh phục mục tiêu IELTS!”',
        });
      }
    } catch (err) {
      console.warn('[useDashboardStats] IELTS goal error:', err);
    }
  }, []);

  // Init Data Fetch
  useEffect(() => {
    fetchStats();
    fetchCalendarSessions(calendarDate);
    fetchIeltsGoal();
  }, [fetchStats, fetchCalendarSessions, fetchIeltsGoal, calendarDate]);

  // Countdown Timer Logic
  useEffect(() => {
    if (heroState !== 'countdown' || !nextReviewTime) {
      clearInterval(countdownIntervalRef.current);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const target = new Date(nextReviewTime);
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(countdownIntervalRef.current);
        setHeroState('ready');
        setStats((prev) => ({ ...prev, wordsDueCount: 1 }));
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const s = String(totalSec % 60).padStart(2, '0');

      setCountdown({
        hours: h,
        minutes: m,
        seconds: s,
        label: `Lần ôn tiếp theo lúc ${target.getHours()}:${String(target.getMinutes()).padStart(2, '0')}`,
      });
    };

    updateTimer();
    countdownIntervalRef.current = setInterval(updateTimer, 1000);
    return () => clearInterval(countdownIntervalRef.current);
  }, [heroState, nextReviewTime]);

  // Calendar Navigation
  const prevMonth = useCallback(() => {
    setCalendarDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCalendarDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  }, []);

  const showDayDetail = useCallback((dateStr, count) => {
    const [y, m, d] = dateStr.split('-');
    const formatted = `${d}/${m}/${y}`;
    const msg =
      count > 0
        ? `🔥 Ngày ${formatted}: Bạn đã ôn luyện chăm chỉ và hoàn thành ${count} từ vựng!`
        : `⚪ Ngày ${formatted}: Chưa có phiên học nào trong ngày này.`;

    setCalendarHint(msg);
    clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = setTimeout(() => {
      setCalendarHint('');
    }, 4000);
  }, []);

  // Compute Calendar Grid Days
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth() + 1;
  const firstDayOfMonth = new Date(calYear, calMonth - 1, 1);
  const lastDateOfMonth = new Date(calYear, calMonth, 0).getDate();

  let startDayIndex = firstDayOfMonth.getDay() - 1;
  if (startDayIndex === -1) startDayIndex = 6;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === calYear && today.getMonth() + 1 === calMonth;
  const todayDate = today.getDate();

  let activeDaysCount = 0;
  let totalWordsThisMonth = 0;

  const daysList = [];
  for (let day = 1; day <= lastDateOfMonth; day++) {
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const count = Number(calendarSessions[dateStr] || 0);
    if (count > 0) {
      activeDaysCount++;
      totalWordsThisMonth += count;
    }
    daysList.push({
      day,
      dateStr,
      count,
      isToday: isCurrentMonth && day === todayDate,
    });
  }

  return {
    stats,
    loading,
    error,
    heroState,
    countdown,
    calendar: {
      year: calYear,
      month: calMonth,
      startDayIndex,
      days: daysList,
      activeDaysCount,
      totalWordsThisMonth,
      hint: calendarHint,
    },
    ieltsGoal,
    prevMonth,
    nextMonth,
    showDayDetail,
    refresh: () => {
      fetchStats();
      fetchCalendarSessions(calendarDate);
      fetchIeltsGoal();
    },
  };
}

export default useDashboardStats;
