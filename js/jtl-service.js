const API_URL_KEY = 'jtl_connector_url';
const API_KEY_KEY = 'jtl_connector_key';

export const JTLService = {
    getConnectorUrl: () => {
        return localStorage.getItem(API_URL_KEY) || '';
    },

    getConnectorKey: () => {
        return localStorage.getItem(API_KEY_KEY) || '';
    },

    setConnection: (url, key) => {
        if (url && !url.startsWith('http')) {
            url = 'https://' + url;
        }
        localStorage.setItem(API_URL_KEY, url);
        localStorage.setItem(API_KEY_KEY, key);
    },

    sync: async () => {
        const url = JTLService.getConnectorUrl();
        const key = JTLService.getConnectorKey();
        if (!url) throw new Error('No Connector URL configured');

        const response = await fetch(`${url}/sync`, {
            headers: {
                'x-api-key': key,
                'ngrok-skip-browser-warning': 'true', // For ngrok
                'cf-skip-browser-warning': 'true'     # For Cloudflare
            }
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Sync failed');
        }

        const data = await response.json();
        // Save the latest data to session storage to avoid re-fetching from API in the same session
        sessionStorage.setItem('jtl_live_data', JSON.stringify(data.products));
        return data;
    },

    getProducts: async (fallbackCsvPath = 'produkte.csv') => {
        // 1. Try Session Storage (Live Data already fetched)
        const cached = sessionStorage.getItem('jtl_live_data');
        if (cached) {
            console.log("Using cached live data");
            return JSON.parse(cached);
        }

        // 2. Try Live API if configured
        const url = JTLService.getConnectorUrl();
        const key = JTLService.getConnectorKey();
        if (url) {
            try {
                // We use a timeout to not block the UI if the tunnel is slow/down
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(`${url}/sync`, {
                    signal: controller.signal,
                    headers: {
                        'x-api-key': key,
                        'cf-skip-browser-warning': 'true'
                    }
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem('jtl_live_data', JSON.stringify(data.products));
                    return data.products;
                }
            } catch (e) {
                console.warn("Live API fallback to CSV:", e.message);
            }
        }

        // 3. Fallback to CSV
        return new Promise((resolve, reject) => {
            Papa.parse(fallbackCsvPath, {
                download: true,
                header: true,
                delimiter: ";",
                skipEmptyLines: true,
                complete: (results) => {
                    const cleaned = results.data.map(r => ({
                        ArtNr: r.ArtNr || r['Artikel-Nr.'],
                        Name: r.Name || r.Artikelname,
                        Preis: r.Preis || r['Netto-VK']
                    }));
                    resolve(cleaned);
                },
                error: (err) => reject(err)
            });
        });
    }
};
