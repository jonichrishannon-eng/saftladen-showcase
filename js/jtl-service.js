
export const JTLService = {
    getProducts: async (fallbackCsvPath = 'produkte.csv') => {
        // We use a cache-busting timestamp to ensure the user gets the latest CSV
        // from GitHub Pages after an update.
        const cacheBuster = `?t=${Date.now()}`;
        const url = fallbackCsvPath.startsWith('http') ? fallbackCsvPath : (fallbackCsvPath + cacheBuster);

        return new Promise((resolve, reject) => {
            Papa.parse(url, {
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
