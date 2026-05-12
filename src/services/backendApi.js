import apiClient from './apiClient';

const BackendApiService = {
    // ============ Authentication ============

    async login(email, password, role) {
        const { data } = await apiClient.post('/login', { email, password, role });
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('appalto_user', JSON.stringify(data.user));
        }
        return data.user;
    },

    async register(userData) {
        const { data } = await apiClient.post('/register', userData);
        return data.user;
    },

    async forgotPassword(email) {
        const { data } = await apiClient.post('/forgot-password', { email });
        return data;
    },

    async resetPassword(resetData) {
        const { data } = await apiClient.post('/reset-password', resetData);
        return data;
    },

    async logout() {
        try {
            await apiClient.post('/logout');
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('appalto_user');
        }
    },

    async getCurrentUser() {
        const { data } = await apiClient.get('/user');
        localStorage.setItem('appalto_user', JSON.stringify(data));
        return data;
    },

    // ============ Profile ============

    async getProfile() {
        const { data } = await apiClient.get('/profile');
        return data.data;
    },

    async updateProfile(profileData) {
        const { data } = await apiClient.put('/profile', profileData);
        // Update local storage user if needed
        const currentUser = this.getCurrentUserSync();
        if (currentUser) {
            localStorage.setItem('appalto_user', JSON.stringify({ ...currentUser, ...data.data }));
        }
        return data.data;
    },

    async changePassword(currentPassword, newPassword) {
        await apiClient.put('/profile/password', {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: newPassword,
        });
    },

    async uploadAvatar(file) {
        console.log("Uploading avatar (converting to base64 for crash prevention):", file);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const { data } = await apiClient.post('/profile/avatar', {
                        avatar_base64: reader.result
                    });
                    console.log("Avatar upload response (base64):", data);
                    resolve(data);
                } catch (error) {
                    console.error("Avatar upload API error (base64):", error);
                    reject(error);
                }
            };
            reader.onerror = error => reject(error);
        });
    },

    async uploadProfileDocument(file, type) {
        console.log(`Uploading document (${type}) - converting to base64:`, file);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                try {
                    const { data } = await apiClient.post('/profile/documents', {
                        file_base64: reader.result,
                        document_type: type,
                        original_filename: file.name
                    });
                    console.log("Document upload response (base64):", data);
                    resolve(data.data);
                } catch (error) {
                    console.error("Document upload API error (base64):", error);
                    reject(error);
                }
            };
            reader.onerror = error => reject(error);
        });
    },

    // ============ Tenders ============

    async getTenders(filters = {}) {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.location && filters.location !== 'All') params.append('location', filters.location);
        if (filters.status && filters.status !== 'All') params.append('status', filters.status);
        if (filters.saved) params.append('saved', 'true');

        const { data } = await apiClient.get(`/tenders?${params.toString()}`);
        return data.data || [];
    },


    async getTenderById(id) {
        const { data } = await apiClient.get(`/tenders/${id}`);
        return data.data;
    },

    async createTender(tenderData) {
        const { data } = await apiClient.post('/tenders', tenderData);
        return data.data;
    },

    async updateTender(id, tenderData) {
        const { data } = await apiClient.put(`/tenders/${id}`, tenderData);
        return data.data;
    },

    async publishTender(id) {
        const { data } = await apiClient.post(`/tenders/${id}/publish`);
        return data.data;
    },

    async deleteTender(id) {
        const { data } = await apiClient.delete(`/tenders/${id}`);
        return data;
    },

    async unlockTender(id) {
        const { data } = await apiClient.post(`/tenders/${id}/unlock`);
        return data;
    },

    async updateTenderBoqItems(id, items) {
        const { data } = await apiClient.put(`/tenders/${id}/boq-items`, { items });
        return data;
    },

    // ============ Bids ============

    async getTenderBids(tenderId) {
        const { data } = await apiClient.get(`/tenders/${tenderId}/bids`);
        const list = data?.data ?? data;
        return Array.isArray(list) ? list : [];
    },

    async getBid(bidId) {
        const { data } = await apiClient.get(`/bids/${bidId}`);
        return data.data;
    },

    async getMyBids() {
        const { data } = await apiClient.get('/my-bids');
        return data.data || [];
    },

    async createOrUpdateBid(
        tenderId,
        bidItems,
        offerFileData = null,
        proposalText = '',
        discountType = null,
        discountValue = 0
    ) {
        const payload = {
            items: bidItems,
            discount_type: discountType,
            discount_value: discountValue,
        };
        if (offerFileData) {
            payload.offer_file_base64 = offerFileData.base64;
            payload.offer_file_name = offerFileData.name;
        }
        if (proposalText) {
            payload.proposal = proposalText;
        } else {
            payload.proposal = '';
        }
        const { data } = await apiClient.post(`/tenders/${tenderId}/bids`, payload);
        return data.data;
    },

    async submitBid(bidId) {
        const { data } = await apiClient.post(`/bids/${bidId}/submit`);
        return data.data;
    },

    async awardBid(bidId) {
        const { data } = await apiClient.post(`/bids/${bidId}/award`);
        return data;
    },

    // ============ Contractor Dashboard ============

    async getContractorDashboardStats() {
        const { data } = await apiClient.get('/contractor/dashboard');
        return data;
    },

    // ============ Notifications ============

    async getNotifications() {
        const { data } = await apiClient.get('/notifications');
        return data;
    },

    async markNotificationRead(id) {
        await apiClient.put(`/notifications/${id}/read`);
    },

    async markAllNotificationsRead() {
        await apiClient.put('/notifications/read-all');
    },

    // ============ Admin Dashboard ============

    async getAdminDashboardStats() {
        const { data } = await apiClient.get('/admin/dashboard');
        return data;
    },

    // ============ Owner Dashboard ============

    async getOwnerDashboardStats() {
        const { data } = await apiClient.get('/owner/dashboard');
        return data;
    },

    async getOwnerRevenue() {
        const { data } = await apiClient.get('/owner/revenue');
        return data;
    },

    async getOwnerTransactions(page = 1, perPage = 10) {
        const { data } = await apiClient.get(`/owner/transactions?page=${page}&per_page=${perPage}`);
        return data;
    },

    async getOwnerTenders(filters = {}) {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.status && filters.status !== 'All') params.append('status', filters.status);

        const { data } = await apiClient.get('/owner/tenders?' + params.toString());
        return data || [];
    },

    async extractPdf(tenderId, file, type = 'standard') {
        const formData = new FormData();
        formData.append('pdf_file', file);
        formData.append('file', file); // some hosts/proxies prefer generic "file" name
        formData.append('extraction_type', type);

        const url = tenderId ? `/tenders/${tenderId}/extract-pdf` : '/extract-pdf';

        // Do not set Content-Type so browser sets multipart/form-data with boundary (required for file uploads)
        const { data } = await apiClient.post(url, formData, {
            headers: { 'Content-Type': false },
        });
        return data; // returns { extraction_id, ... }
    },

    async getExtractionStatus(extractionId) {
        const { data } = await apiClient.get(`/extractions/${extractionId}`);
        return data;
    },

    // ============ Admin Contractor Management ============

    async getContractors(filters = {}) {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.location && filters.location !== 'All') params.append('location', filters.location);

        const { data } = await apiClient.get(`/contractors?${params.toString()}`);
        return data.data || [];
    },

    async getContractorDetails(id) {
        const { data } = await apiClient.get(`/contractors/${id}`);
        return data.data;
    },

    async scanBidDocument(formData) {
        // Upload file for AI scanning
        const { data } = await apiClient.post('/contractor/ai-scan', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    async getContractorStatistics(id) {
        const { data } = await apiClient.get(`/contractors/${id}/statistics`);
        return data;
    },

    // ============ Admin Audit, Config, and Notifications ============

    async getAuditLogs(filters = {}) {
        const params = new URLSearchParams(filters);
        const { data } = await apiClient.get('/owner/audit-logs?' + params.toString());
        return data;
    },

    async getSystemConfig() {
        const { data } = await apiClient.get('/owner/config');
        return data;
    },

    async updateSystemConfig(configData) {
        const { data } = await apiClient.post('/owner/config', configData);
        return data;
    },

    async getNotificationTemplates() {
        const { data } = await apiClient.get('/owner/notifications');
        return data;
    },

    async updateNotificationTemplate(id, templateData) {
        const { data } = await apiClient.put(`/owner/notifications/${id}`, templateData);
        return data;
    },

    // User Management calls using apiClient directly for now until generalized
    async getUsers(filters = {}) {
        const params = new URLSearchParams(filters);
        const { data } = await apiClient.get(`/owner/users?${params}`);
        return data;
    },

    async getUserProfile(userId) {
        const { data } = await apiClient.get(`/owner/users/${userId}`);
        return data;
    },

    async suspendUser(userId) {
        const { data } = await apiClient.put(`/owner/users/${userId}/suspend`);
        return data;
    },

    async activateUser(userId) {
        const { data } = await apiClient.put(`/owner/users/${userId}/activate`);
        return data;
    },

    async deleteUser(userId) {
        const { data } = await apiClient.delete(`/owner/users/${userId}`);
        return data;
    },

    async getUserStatistics() {
        const { data } = await apiClient.get('/owner/statistics');
        return data;
    },

    async verifyContractor(id) {
        const { data } = await apiClient.put(`/owner/users/${id}/verify`);
        return data;
    },

    async updateUserStatus(id, status) {
        const { data } = await apiClient.put(`/owner/users/${id}/status`, { status });
        return data;
    },

    async getBillingOverview() {
        const { data } = await apiClient.get('/billing');
        return data;
    },

    async purchaseCredits(payload) {
        const { data } = await apiClient.post('/billing/purchase', payload);
        return data;
    },

    async createStripeCheckout(credits) {
        const { data } = await apiClient.post('/stripe/checkout', { credits });
        return data;
    },

    async verifyStripeSession(sessionId) {
        const { data } = await apiClient.get('/stripe/verify', { params: { session_id: sessionId } });
        return data;
    },

    // ============ Documents ============

    async getDocuments() {
        const { data } = await apiClient.get('/documents');
        return data.data || [];
    },

    async downloadDocument(documentId, fileName) {
        try {
            const response = await apiClient.get(`/documents/${documentId}/download`, {
                responseType: 'blob'
            });

            // Create blob and download
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'document.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error("Document download failed", error);
            throw error;
        }
    },

    // ============ Helper Methods (for compatibility) ============

    // No-op for data seeding (not needed with real backend)
    seedInitialData() {
        console.log('Seeding not required with backend API');
    },

    // Get current user from localStorage
    getCurrentUserSync() {
        const userStr = localStorage.getItem('appalto_user');
        return userStr ? JSON.parse(userStr) : null;
    }
};

export default BackendApiService;
