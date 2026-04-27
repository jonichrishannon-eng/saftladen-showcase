
const GITHUB_TOKEN_KEY = 'gh_token';
const REPO_OWNER = 'jonichrishannon-eng';
const REPO_NAME = 'saftladen-showcase';

export const GitHubService = {
    setToken: (token) => localStorage.setItem(GITHUB_TOKEN_KEY, token),
    getToken: () => localStorage.getItem(GITHUB_TOKEN_KEY),
    logout: () => localStorage.removeItem(GITHUB_TOKEN_KEY),

    async getUser(token) {
        const response = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${token}` }
        });
        if (!response.ok) throw new Error('Invalid Token');
        return await response.json();
    },

    async checkCollaboration(token) {
        const user = await this.getUser(token);
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/collaborators/${user.login}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        // 204 No Content means user is a collaborator
        return response.status === 204;
    },

    async uploadCSV(token, content, fileName = 'produkte.csv') {
        const user = await this.getUser(token);

        // 1. Get the current file SHA
        const getFile = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`, {
            headers: { 'Authorization': `token ${token}` }
        });

        let sha = null;
        if (getFile.ok) {
            const fileData = await getFile.json();
            sha = fileData.sha;
        }

        // 2. Upload/Update the file
        const body = {
            message: `Manual update of ${fileName} by ${user.login} via SaftladenSuite`,
            content: btoa(unescape(encodeURIComponent(content))), // Handle UTF-8 content
            sha: sha
        };

        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to upload file');
        }

        return await response.json();
    }
};
