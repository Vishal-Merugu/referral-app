"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { availability, appointments } from "@/utils/api";
import styles from "./BookingModal.module.css";

type BookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  referralPostId: string;
  employeeId: string;
  employeeName: string;
  onSuccess: () => void;
};

export function BookingModal({
  isOpen,
  onClose,
  referralPostId,
  employeeId,
  employeeName,
  onSuccess,
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load slots when date or employee changes
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const loadSlots = async () => {
      setLoading(true);
      setError(null);
      setSelectedSlot(null);
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const res = await availability.getForUser(employeeId, dateStr);
        if (mounted) {
          setAvailableSlots(res.data.slots);
          setTimezone(res.data.timezone || "UTC");
        }
      } catch (err) {
        if (mounted) setError("Failed to load available times.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadSlots();
    return () => {
      mounted = false;
    };
  }, [isOpen, selectedDate, employeeId]);

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    // don't allow going before today minus 1
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    prev.setDate(prev.getDate() - 1);
    if (prev >= today) {
      setSelectedDate(prev);
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setError(null);
    try {
      // Create a full ISO string from selectedDate and selectedSlot (HH:MM)
      // Assuming slot is in UTC time as returned by backend. Actually backend creates slots simply treating time as strings.
      // We will supply the local YYYY-MM-DD + slot + Z
      // Example: 2026-02-21T09:00:00Z
      const dateStr = selectedDate.toISOString().split("T")[0];
      const scheduledAt = `${dateStr}T${selectedSlot}:00Z`;

      await appointments.create({
        referralPostId,
        message: message.trim() || undefined,
        scheduledAt,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to book appointment.");
    } finally {
      setBooking(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = selectedDate.toDateString() === today.toDateString();

  return (
    <div className={styles.overlay}>
      <div className={styles.modalBox}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Schedule a chat</h2>
            <p className={styles.subtitle}>Meet with {employeeName}</p>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X className={styles.iconSm} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {error && <div className={styles.errorBox}>{error}</div>}

          {/* Date Selector */}
          <div className={styles.dateSelector}>
            <button
              onClick={handlePrevDay}
              disabled={isToday}
              className={styles.dateBtn}
            >
              <ChevronLeft className={styles.iconMd} />
            </button>
            <div className={styles.dateText}>
              <CalendarIcon className={styles.calendarIcon} />
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <button onClick={handleNextDay} className={styles.dateBtn}>
              <ChevronRight className={styles.iconMd} />
            </button>
          </div>

          <div className={styles.timesLabel}>Available Times ({timezone})</div>

          {/* Slots Grid */}
          <div className={styles.slotsContainer}>
            {loading ? (
              <div className={styles.loadingBox}>
                <Loader2 className={styles.loadingSpinner} />
                <span className={styles.loadingText}>
                  Checking full schedule...
                </span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className={styles.emptySlots}>
                No times available for this date.
              </div>
            ) : (
              <div className={styles.slotsGrid}>
                {availableSlots.map((slot) => {
                  const [h, m] = slot.split(":");
                  const hour = parseInt(h);
                  const ampm = hour >= 12 ? "PM" : "AM";
                  const displayH = hour % 12 || 12;
                  const displayTime = `${displayH}:${m} ${ampm}`;

                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`${styles.slotBtn} ${selectedSlot === slot ? styles.slotActive : ""}`}
                    >
                      {displayTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message field */}
          <div className={styles.messageSection}>
            <label className={styles.messageLabel}>Message (Optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="Hi! I'd love to chat about the role..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <Button
            variant="gradient"
            className={styles.submitBtn}
            disabled={!selectedSlot || booking}
            onClick={handleBook}
          >
            {booking ? "Confirming..." : "Confirm Booking"}
          </Button>
        </div>
      </div>
    </div>
  );
}
