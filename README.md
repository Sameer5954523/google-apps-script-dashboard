# SPIDEY-OS: Symbiote Max Overdrive Dashboard[cite: 1, 2]

A high-performance Google Apps Script web application providing real-time telemetry, schedule tracking, and disposition logging for Voice Nation operations[cite: 1, 2].

## Overview

SPIDEY-OS connects directly to Google Sheets data to display an interactive, matrix-style schedule grid across multiple operators and time slots[cite: 1, 2]. It enables live monitoring, disposition tracking, and secure record mutation for daily agent interactions[cite: 1, 2].

## Core Features

* **Interactive Matrix Grid:** Renders schedule slots by agent and time interval for each operational day (Monday through Friday)[cite: 1, 2].
* **Real-Time Telemetry & Sync:** Automatically refreshes data every 30 seconds directly from the backing Google Sheet[cite: 1, 2].
* **Disposition Tracking & Mutating:** Allows updating booking statuses, including:
  * `On Call`[cite: 2]
  * `Customer not interested`[cite: 2]
  * `Form Completed`[cite: 1, 2]
  * `Customer didn't pick up`[cite: 2]
  * `Reschedule Appointment`[cite: 1, 2]
  * `Does not qualify`[cite: 2]
* **Mandatory Comments & Validation:** Requires a minimum 20-character comment for specific status mutations[cite: 2].
* **Integrated Rescheduling:** Dynamically re-routes and logs rescheduled bookings to new target days, time slots, and agents[cite: 1, 2].
* **Security Clearance Gate:** Enforces security pin verification (`spidey123`) prior to committing status changes[cite: 2].

## File Structure

* `Code.gs` — Apps Script backend containing data fetching algorithms, normalizers, ISO week filters, and status write-back logic (`commitStatusUpdate`)[cite: 1].
* `Index.html` — Cyberpunk/Symbiote-themed single-page frontend interface featuring HUD panels, canvas web physics, and live client-side state handling[cite: 2].

## Setup & Deployment

1. Open your **Google Sheet** containing customer form responses[cite: 1].
2. Navigate to **Extensions > Apps Script**[cite: 1].
3. Copy `Code.gs` content into the script editor[cite: 1].
4. Create an HTML file named `Index.html` in Apps Script and paste the frontend code[cite: 1, 2].
5. Click **Deploy > New Deployment**, select **Web App**, set access permissions, and deploy[cite: 1].
