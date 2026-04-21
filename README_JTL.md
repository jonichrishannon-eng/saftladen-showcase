# JTL-Wawi to GitHub Sync Guide

This guide explains how to automate the connection between your JTL-Wawi software and this GitHub Pages website.

## 1. Prepare the CSV Export
You need a file named `produkte.csv` in the root folder of this project with the following structure:
- **Delimiter:** Semicolon (`;`)
- **Encoding:** UTF-8
- **Required Columns:** `ArtNr`, `Name`, `Preis`

Example content:
```csv
ArtNr;Name;Preis
5449000131836;Coca-Cola Classic 0.5l;1.08
4000539103328;Haribo Goldbären 200g;0.83
```

## 2. Automate the Export (JTL-Ameise)
You can use **JTL-Ameise** to create a command-line export.
1. Open JTL-Ameise.
2. Create an export template for "Artikel" (Items).
3. Select the fields `Artikelnummer` (map to `ArtNr`), `Artikelname` (map to `Name`), and `VK Brutto` or `VK Netto` (map to `Preis`).
4. Save the template as `WebExport`.

## 3. The "Live" Sync Script (PowerShell)
You can run a small PowerShell script on your JTL server every 10 minutes (using Task Scheduler) to export the data and push it to GitHub.

```powershell
# --- CONFIGURATION ---
$JTL_Path = "C:\Program Files (x86)\JTL-Software\JTL-Ameise.exe"
$Repo_Path = "C:\path\to\your\local\git\repo"
$Export_File = "$Repo_Path\produkte.csv"
# --- END CONFIGURATION ---

# 1. Run JTL-Ameise Export
# Note: Adjust login credentials and template name
& $JTL_Path -s (SERVER) -d (DB_NAME) -u (USER) -p (PASS) -t WebExport -o "$Export_File"

# 2. Push to GitHub
cd $Repo_Path
git add produkte.csv
git commit -m "Auto-update products: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin main
```

## 4. Why this is reliable
- **Fail-safe:** If the server goes offline, the website still shows the last successful export.
- **Fast:** The website doesn't need to wait for a slow database connection; it reads a lightweight CSV file.
- **Static & Free:** No need for a paid backend or JTL-Shop hosting.

## 5. Cleaning up
Since we are now using the CSV system, you can safely delete the `saftladen.db` and the `js/sql-wasm.js` / `js/sql-wasm.wasm` files to keep the repository clean.
