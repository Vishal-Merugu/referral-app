"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, availability as availabilityApi } from "@/utils/api";
import { User } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Trash2, Save, Clock, Info } from "lucide-react";
import styles from "./page.module.css";

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AvailabilityPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data: userData } = await auth.getProfile();
        if (userData.role !== "EMPLOYEE") {
          router.push("/dashboard");
          return;
        }
        if (mounted) setUser(userData);

        const { data: availData } = await availabilityApi.getMine();
        if (mounted) {
          if (availData.slots && availData.slots.length > 0) {
            setSlots(availData.slots);
            setTimezone(availData.slots[0].timezone || timezone);
          } else {
            // Default block 9-5 M-F
            const defaultSlots = [1, 2, 3, 4, 5].map((day) => ({
              dayOfWeek: day,
              startTime: "09:00",
              endTime: "17:00",
            }));
            setSlots(defaultSlots);
          }
        }
      } catch (err) {
        if (mounted) router.push("/login");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [router, timezone]);

  const addSlot = (dayOfWeek: number) => {
    setSlots([...slots, { dayOfWeek, startTime: "09:00", endTime: "17:00" }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (
    index: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await availabilityApi.setMine({ timezone, slots });
      setMessage({ text: "Availability saved successfully!", type: "success" });
    } catch {
      setMessage({ text: "Failed to save availability.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderPage}>
        <div className={styles.loaderSpinner} />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>
          <Calendar className={styles.titleIcon} />
          Manage Availability
        </h1>
        <p className={styles.pageSubtitle}>
          Set the hours you are available to chat with referred candidates. This
          helps candidates automatically book a mutually convenient time.
        </p>
      </div>

      <div className={`glass-card ${styles.contentCard}`}>
        {/* Settings Bar */}
        <div className={styles.settingsBar}>
          <div className={styles.tzBox}>
            <span className={styles.tzLabel}>Timezone:</span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={styles.tzSelect}
            >
              <option value={timezone}>{timezone}</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="UTC">UTC</option>
            </select>
            <span className={styles.autoDetect}>
              <Info className="w-3 h-3" /> Auto-detected
            </span>
          </div>
          <Button
            variant="gradient"
            size="md"
            onClick={handleSave}
            disabled={saving}
            className={styles.saveBtn}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save schedule"}
          </Button>
        </div>

        {message && (
          <div
            className={`${styles.msgBox} ${message.type === "success" ? styles.msgSuccess : styles.msgError}`}
          >
            <Info className="w-4 h-4" /> {message.text}
          </div>
        )}

        {/* Days List */}
        <div className={styles.daysList}>
          {DAYS.map((dayName, dayIndex) => {
            const daySlots = slots.filter((s) => s.dayOfWeek === dayIndex);
            const isAvailable = daySlots.length > 0;

            return (
              <div
                key={dayName}
                className={`${styles.dayRow} ${!isAvailable ? styles.dayRowDisabled : ""}`}
              >
                <div className={styles.dayLayout}>
                  {/* Day Toggle */}
                  <div className={styles.dayToggleBox}>
                    <label className={styles.toggleLabel}>
                      <input
                        type="checkbox"
                        className={styles.toggleInput}
                        checked={isAvailable}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addSlot(dayIndex);
                          } else {
                            setSlots(
                              slots.filter((s) => s.dayOfWeek !== dayIndex),
                            );
                          }
                        }}
                      />
                      <div className={styles.toggleTrack}></div>
                    </label>
                    <span className={styles.dayNameText}>{dayName}</span>
                  </div>

                  {/* Intervals */}
                  <div className={styles.intervalsBox}>
                    {!isAvailable ? (
                      <div className={styles.unavailableText}>
                        <Clock className="w-4 h-4" /> Unavailable
                      </div>
                    ) : (
                      <>
                        {daySlots.map((slot, i) => {
                          const globalIndex = slots.findIndex(
                            (s) => s === slot,
                          );
                          return (
                            <div
                              key={globalIndex}
                              className={styles.intervalRow}
                            >
                              <Input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) =>
                                  updateSlot(
                                    globalIndex,
                                    "startTime",
                                    e.target.value,
                                  )
                                }
                                className={styles.timeInput}
                              />
                              <span className={styles.intervalDash}>-</span>
                              <Input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) =>
                                  updateSlot(
                                    globalIndex,
                                    "endTime",
                                    e.target.value,
                                  )
                                }
                                className={styles.timeInput}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className={styles.removeBtn}
                                onClick={() => removeSlot(globalIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          className={styles.addIntervalBtn}
                          onClick={() => addSlot(dayIndex)}
                        >
                          <Plus className="w-3.5 h-3.5" /> Add interval
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
