# SPIDEY-OS: Symbiote Max Overdrive Dashboard

A high-performance Google Apps Script web application providing real-time telemetry, schedule tracking, and disposition logging for Voice Nation operations.

## Overview

SPIDEY-OS connects directly to Google Sheets data to display an interactive, matrix-style schedule grid across multiple operators and time slots. It enables live monitoring, disposition tracking, and secure record mutation for daily agent interactions.

## Core Features

* **Interactive Matrix Grid:** Renders schedule slots by agent and time interval for each operational day (Monday through Friday).
* **Real-Time Telemetry & Sync:** Automatically refreshes data every 30 seconds directly from the backing Google Sheet.
* **Disposition Tracking & Mutating:** Allows updating booking statuses, including:
  * `On Call`
  * `Customer not interested`
  * `Form Completed`
  * `Customer didn't pick up`
  * `Reschedule Appointment`
  * `Does not qualify`
* **Mandatory Comments & Validation:** Requires a minimum 20-character comment for specific status mutations.
* **Integrated Rescheduling:** Dynamically re-routes and logs rescheduled bookings to new target days, time slots, and agents.
* **Security Clearance Gate:** Enforces security pin verification (`spidey123`) prior to committing status changes.

## File Structure

* `Code.gs` — Apps Script backend containing data fetching algorithms, normalizers, ISO week filters, and status write-back logic (`commitStatusUpdate`).
* `Index.html` — Cyberpunk/Symbiote-themed single-page frontend interface featuring HUD panels, canvas web physics, and live client-side state handling.

## Setup & Deployment

1. Open your **Google Sheet** containing customer form responses.
2. Navigate to **Extensions > Apps Script**.
3. Copy `Code.gs` content into the script editor.
4. Create an HTML file named `Index.html` in Apps Script and paste the frontend code.
5. Click **Deploy > New Deployment**, select **Web App**, set access permissions, and deploy.
