# AttendanceNow — Meeting Attendance System

A simple web-based meeting attendance system that allows organizers to create meetings, share a QR code with attendees, collect attendance with digital signatures, monitor attendees in real time, and export attendance records as PDF or CSV.

## ✨ Features

* **Create Meetings** — Organizers can create a meeting with a custom title.
* **QR Code Attendance** — Generate a unique QR code that attendees can scan to join.
* **Digital Signature** — Attendees can sign their names directly using a signature canvas.
* **Meeting Status Control** — Organizers can start and end meetings.
* **Live Attendee List** — The admin dashboard automatically refreshes attendee records.
* **Duplicate Submission Prevention** — Uses a browser-generated device identifier to prevent repeated attendance submissions from the same device.
* **Admin Secret Key** — Each meeting receives a unique secret key for accessing the organizer dashboard.
* **PDF Export** — Download attendance records including signatures as a PDF.
* **CSV Export** — Export attendance data as a CSV file.
* **Responsive UI** — Designed to work on both desktop and mobile devices.
* **No User Account Required** — Attendees can join without creating an account.

## 🖥️ How It Works

### 1. Organizer creates a meeting

The organizer enters a meeting title and creates a new meeting.

The system generates:

* A unique Meeting ID
* A unique Admin Secret Key
* A meeting status initially set to `PENDING`

### 2. Organizer opens the dashboard

The organizer uses the generated secret key to access the meeting dashboard.

From the dashboard, the organizer can:

* Start the meeting
* Display the QR code
* Monitor attendees
* Refresh attendance records
* End the meeting
* Download attendance reports

### 3. Attendees scan the QR code

Attendees scan the QR code displayed by the organizer.

They are taken to the meeting's attendance page.

### 4. Attendee submits attendance

The attendee provides:

1. Full name
2. Digital signature

The attendance record is then stored in the database.

### 5. Organizer monitors attendance

The dashboard periodically fetches the latest attendance records, allowing the organizer to see new attendees without manually refreshing the page.

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      Attendee       │
                    │  Mobile / Browser   │
                    └──────────┬──────────┘
                               │
                          Scan QR Code
                               │
                               ▼
                    ┌─────────────────────┐
                    │    React Frontend   │
                    │       Vite          │
                    └──────────┬──────────┘
                               │
                            REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │      Node.js        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      SQLite DB      │
                    │    better-sqlite3   │
                    └─────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              PDF Generation          CSV Export
```

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Axios
- Lucide React
- QRCode React
- React Signature Canvas
- html2canvas

### Backend
- Node.js
- Express 5
- REST API
- CORS
- Body Parser
- UUID
- dotenv

### Database
- SQLite
- better-sqlite3

### Reporting
- PDFKit
- JSON2CSV

## 📁 Project Structure

```text
meeting_attendance_taker/
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── AttendeeView.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── index.html
│
├── database.js
├── routes.js
├── server.js
├── package.json
├── attendance.db
└── README.md
```

## 🔌 API Endpoints

### Meetings

| Method | Endpoint                   | Description             |
| ------ | -------------------------- | ----------------------- |
| `POST` | `/api/meetings`            | Create a new meeting    |
| `GET`  | `/api/meetings/:id`        | Get meeting information |
| `POST` | `/api/meetings/:id/status` | Update meeting status   |

### Attendance

| Method | Endpoint                      | Description       |
| ------ | ----------------------------- | ----------------- |
| `POST` | `/api/attend`                 | Submit attendance |
| `GET`  | `/api/meetings/:id/attendees` | Get attendees     |

### Reports

| Method | Endpoint                       | Description              |
| ------ | ------------------------------ | ------------------------ |
| `GET`  | `/api/meetings/:id/export/pdf` | Export attendance as PDF |
| `GET`  | `/api/meetings/:id/export/csv` | Export attendance as CSV |

The API implementation is contained in `routes.js`.

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

* Node.js
* npm

### 1. Clone the repository

```bash
git clone https://github.com/AkashJos3/meeting_attendance_taker.git
cd meeting_attendance_taker
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client
npm install
cd ..
```

### 4. Start the application

For development, run:

```bash
npm run dev
```

This starts both the Express server and the Vite development server.

The root project defines the development command using `concurrently`.

### 5. Open the application

Open the frontend URL shown by Vite in your browser.

The backend runs on:

```text
http://localhost:3000
```

## 📱 Using It on a Local Network

The application can also be used for meetings where attendees are connected to the same local network.

The server listens on:

```text
0.0.0.0:3000
```

The organizer dashboard generates a join URL based on the browser's current hostname, allowing the QR code to point to the accessible application address.

For example:

```text
http://192.168.1.10:3000/join/<meeting-id>
```

Attendees connected to the same network can scan the QR code and open the attendance page from their phones.

## 🔐 Meeting Security

Each meeting is assigned a randomly generated admin secret.

The secret is required for organizer-only operations such as:

* Starting/ending the meeting
* Viewing attendees
* Exporting attendance records

Attendees only receive public meeting information and cannot access the admin secret through the public meeting endpoint.

> **Note:** This is a project-level access mechanism, not a production-grade authentication system. A production deployment should use proper authentication, authorization, HTTPS, secure secret handling, and stronger abuse protection.

## 🗄️ Database

The application uses SQLite with `better-sqlite3`.

Two main tables are created automatically:

### `meetings`

Stores:

* Meeting ID
* Meeting title
* Admin secret
* Meeting status
* Creation timestamp

### `attendees`

Stores:

* Attendee ID
* Meeting ID
* Name
* Digital signature
* Device identifier
* Attendance timestamp

The database schema is initialized automatically when the server starts.

## 📊 Attendance States

A meeting can have three states:

```text
PENDING
   │
   ▼
ACTIVE
   │
   ▼
ENDED
```

### PENDING

The meeting has been created but attendance is not yet open.

### ACTIVE

Attendees can submit their names and signatures.

### ENDED

Attendance submissions are closed.

The backend validates these states before accepting attendance submissions.

## 📄 Exported Reports

Organizers can export attendance records in two formats:

### PDF

The PDF contains:

* Meeting title
* Date
* Attendee names
* Attendance times
* Digital signatures

### CSV

The CSV contains:

* Attendee name
* Attendance timestamp
* Attendance record ID

## 🔮 Future Improvements

Potential improvements for a production-ready version include:

* User authentication with JWT/OAuth
* Role-based authorization
* PostgreSQL/MySQL instead of SQLite
* HTTPS
* Rate limiting
* Stronger device/session validation
* Meeting expiration
* Attendance analytics
* Email notifications
* Multiple organizers
* Cloud deployment
* Docker support
* Automated tests
* CI/CD with GitHub Actions

## 📌 Project Status

This project is currently a functional meeting attendance application built for practical use and learning.

It demonstrates:

* Full-stack web development
* REST API design
* React frontend development
* Database integration
* QR-code based workflows
* Digital signature collection
* File/report generation
* Client-server communication

## 👨‍💻 Author

**Akash Jose**

GitHub: [@AkashJos3](https://github.com/AkashJos3)

## 📄 License

This project is currently available without a specified open-source license.
