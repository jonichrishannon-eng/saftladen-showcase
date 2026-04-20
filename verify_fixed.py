import asyncio
from playwright.async_api import async_playwright
import os
import subprocess
import time

async def verify():
    # Start server
    server_process = subprocess.Popen(['python3', '-m', 'http.server', '8081'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2) # Wait for server

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("Verifying Scanner Page...")
        await page.goto("http://localhost:8081/index.html")
        await page.wait_for_selector("#search")

        # Test Search
        await page.fill("#search", "5449000131836")
        await page.click("#barcode-btn")

        # Wait for terminal results
        await page.wait_for_selector("#terminal-content", timeout=10000)
        time.sleep(5) # Wait for fade-in animations

        os.makedirs("verification/screenshots", exist_ok=True)
        await page.screenshot(path="verification/screenshots/scanner_fixed.png")

        # Verify Menu
        await page.click(".menu-button")
        time.sleep(1)
        await page.screenshot(path="verification/screenshots/menu_fixed.png")

        print("Verifying Home Page...")
        await page.goto("http://localhost:8081/dev/Home.html")
        await page.screenshot(path="verification/screenshots/home_fixed.png")

        print("Verifying Statistik Page...")
        await page.goto("http://localhost:8081/dev/Statistik.html")
        await page.screenshot(path="verification/screenshots/statistik_fixed.png")

        await browser.close()

    server_process.terminate()

if __name__ == "__main__":
    asyncio.run(verify())
