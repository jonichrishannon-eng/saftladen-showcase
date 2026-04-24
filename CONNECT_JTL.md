# Connecting JTL-Wawi (Live Sync)

This guide explains how to set up the **JTL-Connector** to enable live updates between your local JTL-Wawi database and the SaftladenSuite website.

## How it works
1. **JTL-Connector:** A small Node.js app runs on your JTL machine. It triggers **JTL-Ameise** to export data on demand.
2. **Cloudflare Tunnel:** A secure tunnel exposes the connector to the internet without opening router ports.
3. **SaftladenSuite:** The website connects to your tunnel to fetch the latest prices and products.

---

## 1. Prerequisites
- **Node.js** installed on the JTL machine.
- **JTL-Wawi** installed and configured.
- A **JTL-Ameise Export Template** named `WebExport` (or your preferred name) with columns: `ArtNr`, `Name`, `Preis`.

---

## 2. Setup the Connector
1. Copy the `jtl-connector` folder to your JTL machine.
2. Open a terminal in that folder and run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your database credentials:
   ```env
   # Security - CHANGE THIS!
   API_KEY=your-secret-password-here

   DB_SERVER=(local)\JTLWAWI
   DB_NAME=eazybusiness
   DB_USER=sa
   DB_PASS=your_password
   JTL_EXPORT_TEMPLATE=WebExport
   ```
4. Start the connector:
   ```bash
   npm start
   ```
   The connector is now running on `http://localhost:3000`.

---

## 3. Setup Cloudflare Tunnel (The "Bridge")
This allows the website to talk to your local machine securely.
1. Download `cloudflared` from [Cloudflare's website](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).
2. In a terminal, run:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Cloudflare will give you a random URL like `https://funny-cat-sounds.trycloudflare.com`. **Copy this URL.**

---

## 4. Connect the Website
1. Open your SaftladenSuite website.
2. Go to **DASHBOARD** (Home.html).
3. Scroll down to **Live Cloud Sync**.
4. Paste your Cloudflare URL into the **Cloudflare Tunnel URL** field.
5. Paste your `API_KEY` (from the `.env` file) into the **API Key** field.
6. Click **Speichern**.
7. Click **JETZT SYNCHRONISIEREN**.

Your website is now pulling live data directly from your JTL-Wawi!

---

## Security & Reliability Features
- **API Key Authentication:** Only your website can trigger the sync.
- **Rate Limiting:** Prevents multiple simultaneous JTL-Ameise runs to save system resources.
- **Caching:** Sync results are cached for 5 minutes by default to reduce database load.
- **One-Way Sync:** The website can only *read* your products. It cannot change anything in your JTL database.
