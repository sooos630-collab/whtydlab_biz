import Head from "next/head";
import { useState, useMemo } from "react";
import s from "@/styles/Contracts.module.css";
import { dummyScheduleEvents, type ScheduleEvent } from "@/data/dummy-schedule";

const catBadge = (cat: string) => {
  switch (cat) {
    case "계약": return s.badgeBlue;
    case "수금": return s.badgeGreen;
    case "급여": return s.badgeOrange;
    case "세금": return s.badgeRed;
    case "정부사업": return s.badgeBlue;
    case "고객": return s.badgeOrange;
    case "고정비": return s.badgeGray;
    default: return s.badgeGray;
  }
};

type CatFilter = "all" | ScheduleEvent["category"];

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>(() =>
    dummyScheduleEvents.map((e) => ({ ...e }))
  );
  const [filter, setFilter] = useState<CatFilter>("all");
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = viewMonth.year;
  const month = viewMonth.month;
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const filtered = useMemo(() => {
    let result = events.filter((e) => e.date.startsWith(monthStr));
    if (filter !== "all") result = result.filter((e) => e.category === filter);
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [events, filter, monthStr]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filtered.filter((e) => e.date === selectedDate);
  }, [filtered, selectedDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    filtered.forEach((e) => {
      const arr = map.get(e.date) || [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return map;
  }, [filtered]);

  const toggleDone = (id: string) => {
    setEvents(events.map((e) => e.id === id ? { ...e, done: !e.done } : e));
  };

  const prevMonth = () => {
    setViewMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setViewMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
    setSelectedDate(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const upcomingCount = events.filter((e) => !e.done && e.date >= todayStr).length;
  const overdueCount = events.filter((e) => !e.done && e.date < todayStr).length;
  const doneCount = events.filter((e) => e.done && e.date.startsWith(monthStr)).length;

  return (
    <>
      <Head><title>통합일정 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>통합일정</h1>
        </div>

        <div className={s.summary}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>이번 달 일정</div>
            <div className={s.summaryValue}>{filtered.length}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>예정</div>
            <div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{upcomingCount}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>지연/미처리</div>
            <div className={s.summaryValue} style={{ color: overdueCount > 0 ? "var(--color-danger)" : undefined }}>{overdueCount}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>완료</div>
            <div className={s.summaryValue} style={{ color: "var(--color-success)" }}>{doneCount}건</div>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {(["all", "계약", "수금", "급여", "세금", "정부사업", "고객", "고정비"] as const).map((f) => (
            <button
              key={f}
              className={`${s.btn} ${s.btnSmall} ${filter === f ? s.btnPrimary : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "전체" : f}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* 달력 */}
          <div className={s.section} style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button className={s.btnIcon} onClick={prevMonth} style={{ fontSize: 18 }}>‹</button>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.04em" }}>
                {year}년 {month + 1}월
              </span>
              <button className={s.btnIcon} onClick={nextMonth} style={{ fontSize: 18 }}>›</button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  {DAYS.map((d, i) => (
                    <th key={d} style={{
                      padding: "6px 0",
                      fontSize: 11,
                      fontWeight: 600,
                      color: i === 0 ? "var(--color-danger)" : i === 6 ? "var(--color-primary)" : "var(--color-text-tertiary)",
                      textAlign: "center",
                    }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: calendarCells.length / 7 }, (_, week) => (
                  <tr key={week}>
                    {calendarCells.slice(week * 7, week * 7 + 7).map((day, di) => {
                      if (day === null) return <td key={di} />;
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const dayEvents = eventsByDate.get(dateStr);
                      const isToday = dateStr === todayStr;
                      const isSelected = dateStr === selectedDate;
                      const dayOfWeek = (firstDay + day - 1) % 7;

                      return (
                        <td
                          key={di}
                          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                          style={{
                            padding: "2px",
                            textAlign: "center",
                            verticalAlign: "top",
                            cursor: "pointer",
                            height: 52,
                          }}
                        >
                          <div style={{
                            borderRadius: 10,
                            padding: "4px 0 2px",
                            background: isSelected ? "var(--color-primary)" : isToday ? "var(--color-primary-light)" : "transparent",
                            color: isSelected ? "white" : dayOfWeek === 0 ? "var(--color-danger)" : dayOfWeek === 6 ? "var(--color-primary)" : "var(--color-text)",
                            transition: "all 0.15s",
                          }}>
                            <div style={{ fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400 }}>{day}</div>
                            {dayEvents && dayEvents.length > 0 && (
                              <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2 }}>
                                {dayEvents.slice(0, 3).map((_, i) => (
                                  <div key={i} style={{
                                    width: 4, height: 4, borderRadius: 2,
                                    background: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-primary)",
                                  }} />
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 오른쪽: 선택 날짜 일정 또는 전체 리스트 */}
          <div className={s.section} style={{ marginBottom: 0, maxHeight: 420, overflowY: "auto" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.03em" }}>
              {selectedDate
                ? `${selectedDate} 일정 (${selectedEvents.length}건)`
                : `${month + 1}월 전체 일정 (${filtered.length}건)`
              }
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(selectedDate ? selectedEvents : filtered).map((ev) => (
                <div key={ev.id} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  background: ev.done ? "var(--color-divider)" : "var(--color-bg)",
                  borderRadius: 10,
                  opacity: ev.done ? 0.6 : 1,
                  transition: "all 0.15s",
                }}>
                  <button
                    onClick={() => toggleDone(ev.id)}
                    style={{
                      width: 20, height: 20, borderRadius: 6, border: "2px solid",
                      borderColor: ev.done ? "var(--color-success)" : "var(--color-border)",
                      background: ev.done ? "var(--color-success)" : "transparent",
                      cursor: "pointer", flexShrink: 0, marginTop: 1,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontSize: 11, fontWeight: 700,
                    }}
                  >
                    {ev.done ? "✓" : ""}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, marginBottom: 3,
                      textDecoration: ev.done ? "line-through" : "none",
                      color: ev.done ? "var(--color-text-secondary)" : "var(--color-text)",
                    }}>
                      {ev.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={`${s.badge} ${catBadge(ev.category)}`}>{ev.category}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{ev.source}</span>
                      {!selectedDate && (
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{ev.date}</span>
                      )}
                    </div>
                    {ev.memo && (
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3 }}>{ev.memo}</div>
                    )}
                  </div>
                </div>
              ))}
              {(selectedDate ? selectedEvents : filtered).length === 0 && (
                <div className={s.empty}>일정이 없습니다</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
