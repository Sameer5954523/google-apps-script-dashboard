function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('SPIDEY-OS: Symbiote Max Overdrive')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let mainSheet = ss.getSheetByName("Form Responses 1"); 
  let logSheet = ss.getSheetByName("Dashboard_Logs"); 
  
  if (!mainSheet) mainSheet = ss.getSheets()[0];
  
  let updatedCustomerStates = {};
  let slotSpecificStates = {};
  let processedSlots = {};
  let todayCount = 0;
  
  const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const now = new Date();
  const currentDayName = daysOfWeek[now.getDay()];
  const currentWeekKey = getWeekIdentifier(now); 

  // --- PASS 1: Read Dashboard_Logs IN REVERSE (Newest logs win) ---
  if (logSheet) {
    const logLastRow = logSheet.getLastRow();
    if (logLastRow > 1) {
      const logData = logSheet.getRange(2, 1, logLastRow - 1, 12).getValues();
      
      for (let i = logData.length - 1; i >= 0; i--) {
        const row = logData[i];
        
        const isRescheduledEntry = String(row[10]).trim() === "RESCHEDULED_NEW_SLOT";
        const phone = normalizePhone(row[4]);
        let outcome = normalizeOutcomeString(String(row[9])); 
        const statusComment = row[11] ? String(row[11]).trim() : "";

        const dayRaw = String(row[5]).trim().toUpperCase();
        const timeSlot = standardizeTimeSlot(String(row[6]));
        const agent = standardizeAgentName(String(row[2]));
        
        const exactSlotKey = `${dayRaw}||${timeSlot}||${agent}`;
        const lookupKeyUpper = exactSlotKey.toUpperCase();

        if (isRescheduledEntry) {
          if (!processedSlots[exactSlotKey]) {
            processedSlots[exactSlotKey] = {
              isFree: false,
              bookedBy: row[1],
              bookedFor: agent,
              customerName: row[3],
              customerNumber: String(row[4]).trim(),
              day: dayRaw,
              timeSlot: timeSlot,
              dob: row[7] ? Utilities.formatDate(new Date(row[7]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
              notes: row[8],
              outcome: outcome,
              statusComment: statusComment
            };
          }
        } else {
          if (phone && outcome !== "" && updatedCustomerStates[phone] === undefined) {
            updatedCustomerStates[phone] = {
              outcome: outcome,
              comment: statusComment
            };
          }
          
          if (dayRaw && timeSlot && agent && outcome !== "" && slotSpecificStates[lookupKeyUpper] === undefined) {
            slotSpecificStates[lookupKeyUpper] = {
              outcome: outcome,
              comment: statusComment
            };
          }
        }
      }
    }
  }

  // --- PASS 2: Read raw data from main sheet ---
  const mainLastRow = mainSheet.getLastRow();
  if (mainLastRow > 1) {
    const mainData = mainSheet.getRange(2, 1, mainLastRow - 1, 10).getValues();

    for (let i = mainData.length - 1; i >= 0; i--) {
      const row = mainData[i];
      if (!row[0] || !row[2] || !row[5] || !row[6]) continue; 

      const rowTimestamp = new Date(row[0]);
      const agentRaw = String(row[2]);
      const dayRaw = String(row[5]).trim().toUpperCase();
      const timeRaw = String(row[6]); 
      const rawPhone = String(row[4]).trim();
      const normalizedPhone = normalizePhone(rawPhone);
      let originalMainOutcome = normalizeOutcomeString(String(row[9]));

      // --- WEEK FILTER ---
      const entryWeekKey = getWeekIdentifier(rowTimestamp);
      const submissionDayIndex = rowTimestamp.getDay(); 
      let keepRowAlive = false;

      if (entryWeekKey === currentWeekKey) {
        keepRowAlive = true;
      } else {
        const previousWeekKey = getWeekIdentifier(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        if (entryWeekKey === previousWeekKey && dayRaw === "MONDAY" && (submissionDayIndex === 5 || submissionDayIndex === 6 || submissionDayIndex === 0)) {
          keepRowAlive = true;
        }
      }

      if (!keepRowAlive) continue;

      const agent = standardizeAgentName(agentRaw);
      const timeSlot = standardizeTimeSlot(timeRaw);

      if (!agent || !timeSlot) continue; 
      if (timeSlot === "5:00 PM" && agent !== "Hussain" && agent !== "Amaani") continue;

      const exactSlotKey = `${dayRaw}||${timeSlot}||${agent}`;
      const lookupKeyUpper = exactSlotKey.toUpperCase();
      
      if (processedSlots[exactSlotKey]) continue; 

      let finalOutcome = "";
      let statusComment = "";

      if (slotSpecificStates[lookupKeyUpper] !== undefined) {
        finalOutcome = slotSpecificStates[lookupKeyUpper].outcome;
        statusComment = slotSpecificStates[lookupKeyUpper].comment;
      } 
      else if (normalizedPhone !== "" && updatedCustomerStates[normalizedPhone] !== undefined) {
        finalOutcome = updatedCustomerStates[normalizedPhone].outcome;
        statusComment = updatedCustomerStates[normalizedPhone].comment;
      } 
      else if (originalMainOutcome !== "") {
        finalOutcome = originalMainOutcome;
      } 
      else {
        finalOutcome = "Pending Connection";
      }

      processedSlots[exactSlotKey] = {
        isFree: false,
        bookedBy: row[1],
        bookedFor: agent,
        customerName: row[3],
        customerNumber: rawPhone,
        day: dayRaw,
        timeSlot: timeSlot,
        dob: row[7] ? Utilities.formatDate(new Date(row[7]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        notes: row[8],
        outcome: finalOutcome,
        statusComment: statusComment
      };

      if (dayRaw === currentDayName) {
        todayCount++;
      }
    }
  }

  return {
    bookings: processedSlots,
    stats: {
      todayCount: todayCount,
      lastSync: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "hh:mm:ss a")
    }
  };
}

// --- HELPER NORMALIZERS ---

function normalizeOutcomeString(rawOutcome) {
  if (!rawOutcome) return "";
  const clean = String(rawOutcome).trim().replace(/’/g, "'").toLowerCase();

  // Robust string match for Form Completed variations
  if (
    clean.includes("form") || 
    clean.includes("complete") || 
    clean.includes("gone through") || 
    clean.includes("done")
  ) {
    if (!clean.includes("reschedule") && !clean.includes("pending")) {
      return "Form Completed"; // Standardized clean value
    }
  }
  
  if (clean.includes("reschedule")) {
    return "Reschedule Appointment";
  }

  return String(rawOutcome).trim();
}

function standardizeAgentName(agentRaw) {
  if (!agentRaw) return "";
  const clean = String(agentRaw).replace(/\s+/g, '').toLowerCase();
  
  if (clean.includes("chati")) return "Chati";
  if (clean.includes("saad")) return "Saad";
  if (clean.includes("hamza")) return "Hamza";
  if (clean.includes("anika")) return "Anika";
  if (clean === "hanzi" || clean === "hanzii") return "Hanzii";
  if (clean.includes("ibrahim")) return "Ibrahim";
  if (clean.includes("ali")) return "Ali";
  if (clean.includes("hussain")) return "Hussain";
  if (clean.includes("amaani")) return "Amaani";
  if (clean.includes("agent1")) return "Agent 1";
  if (clean.includes("agent2")) return "Agent 2";
  if (clean.includes("agent3")) return "Agent 3";
  if (clean.includes("agent4")) return "Agent 4";
  return agentRaw.trim();
}

function standardizeTimeSlot(timeRaw) {
  if (!timeRaw) return "";
  const clean = String(timeRaw).toUpperCase().replace(/\s+/g, '');
  
  if (clean.includes("9:15")) return "9:15 AM";
  if (clean.includes("10:15")) return "10:15 AM";
  if (clean.includes("11:30")) return "11:30 AM";
  if (clean.includes("12:45")) return "12:45 PM";
  if (clean.includes("1:45")) return "1:45 PM";
  if (clean.includes("3:00")) return "3:00 PM";
  if (clean.includes("4:15")) return "4:15 PM";
  if (clean.includes("5:00") || clean.includes("5PM") || clean.includes("5O'CLOCK")) return "5:00 PM";
  return timeRaw.trim();
}

function normalizePhone(phoneVal) {
  if (!phoneVal) return "";
  return String(phoneVal).replace(/\D/g, "");
}

function getWeekIdentifier(date) {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
  return target.getFullYear() + "-" + weekNumber;
}

function commitStatusUpdate(updatedPayload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName("Dashboard_Logs");
  
  if (!logSheet) {
    logSheet = ss.insertSheet("Dashboard_Logs");
    logSheet.appendRow(["Timestamp", "Booked By", "Booked For", "Customer Name", "Customer Number", "Day", "Time Slot", "Customer DOB", "Notes", "Outcome", "Extra", "Status Comment"]);
  }

  let finalOutcome = normalizeOutcomeString(updatedPayload.outcome);
  
  logSheet.appendRow([
    new Date(),
    updatedPayload.bookedBy,
    updatedPayload.bookedFor,
    updatedPayload.customerName,
    updatedPayload.customerNumber,
    updatedPayload.day,
    updatedPayload.timeSlot,
    updatedPayload.dob,
    updatedPayload.notes,
    finalOutcome,
    "", 
    updatedPayload.statusComment || ""
  ]);
  
  SpreadsheetApp.flush();

  if (updatedPayload.outcome === "Reschedule Appointment" && updatedPayload.rescheduleDetails) {
    const res = updatedPayload.rescheduleDetails;
    logSheet.appendRow([
      new Date(),
      updatedPayload.bookedBy,
      res.newAgent,
      updatedPayload.customerName,
      updatedPayload.customerNumber,
      res.newDay,
      res.newTime,
      updatedPayload.dob,
      `Rescheduled from ${updatedPayload.day} ${updatedPayload.timeSlot} (${updatedPayload.bookedFor}). Notes: ${updatedPayload.notes}`,
      "Pending Connection",
      "RESCHEDULED_NEW_SLOT", 
      `Rescheduled to ${res.newDay} ${res.newTime} with ${res.newAgent}.`
    ]);
    SpreadsheetApp.flush();
  }

  return { success: true };
}