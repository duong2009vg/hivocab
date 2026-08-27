// ============================================================
// HI - AI HINT ENGINE  |  aiHint.js
// ============================================================
// Gọi Gemini API để tạo gợi ý thông minh cho bài tập Fill-in-blank.
// API key bảo mật server-side qua Vercel proxy (không lưu localStorage).
//
// Phụ thuộc: sessionEngine.js (HiSession) phải load trước.
//
// Cách dùng:
//   HiAIHint.getHint(context)  → trả về Promise<string>
//   HiAIHint.renderHint()      → lấy context từ HiSession hiện tại và render vào #ai-hint-container
// ============================================================

const HiAIHint = (() => {

    // ----------------------------------------------------------
    // CONSTANTS
    // ----------------------------------------------------------
    // ⚠️ Proxy Vercel — API key bảo mật server-side, không lộ ra frontend
    const GROQ_PROXY  = '/api/groq';
    const GROQ_MODEL  = 'llama-3.1-8b-instant';
    const MAX_TOKENS  = 256;

    // ----------------------------------------------------------
    // PROMPT BUILDER
    // ----------------------------------------------------------

    /**
     * Xây dựng prompt thông minh từ context từ vựng thật.
     *
     * @param {Object} ctx
     *   - word       : từ tiếng Anh cần đoán
     *   - meaning    : nghĩa tiếng Việt
     *   - sentence   : câu ví dụ (có thể null)
     *   - phonetic   : phiên âm (có thể null)
     */
    function _buildPrompt(ctx) {
        const { word, meaning, sentence, phonetic } = ctx;

        let prompt = '';

        if (sentence) {
            // Có câu ví dụ → gợi ý dựa vào ngữ cảnh câu
            const blankedSentence = sentence.replace(
                new RegExp(`\\b${_escapeRegex(word)}\\b`, 'gi'),
                '_____'
            );
            prompt = `Bạn là trợ lý học từ vựng tiếng Anh thông minh.

Người dùng đang luyện tập điền từ còn thiếu vào câu sau:
"${blankedSentence}"

Từ còn thiếu có nghĩa tiếng Việt là: "${meaning}"${phonetic ? `\nPhiên âm: ${phonetic}` : ''}

Hãy đưa ra MỘT gợi ý ngắn gọn (2-3 câu) bằng tiếng Việt:
- Giải thích ngữ cảnh của câu để người dùng hiểu từ nào phù hợp
- Có thể gợi ý về từ loại, chữ cái đầu, hoặc số âm tiết nếu phù hợp  
- TUYỆT ĐỐI KHÔNG nói thẳng từ tiếng Anh cần điền
- Ngắn gọn, dễ hiểu, khuyến khích người dùng tự đoán`;
        } else {
            // Không có câu ví dụ → gợi ý dựa vào nghĩa
            prompt = `Bạn là trợ lý học từ vựng tiếng Anh thông minh.

Người dùng đang cố nhớ một từ tiếng Anh có nghĩa: "${meaning}"${phonetic ? `\nPhiên âm: ${phonetic}` : ''}

Hãy đưa ra MỘT gợi ý thông minh (2-3 câu) bằng tiếng Việt:
- Mô tả ngữ cảnh hoặc tình huống dùng từ này
- Có thể gợi ý từ đồng nghĩa tiếng Anh phổ biến hơn (nếu có)
- Có thể gợi ý chữ cái đầu hoặc số âm tiết  
- TUYỆT ĐỐI KHÔNG nói thẳng từ tiếng Anh cần đoán
- Ngắn gọn, dễ hiểu`;
        }

        return prompt;
    }

    function _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ----------------------------------------------------------
    // GROQ API CALL
    // ----------------------------------------------------------

    /**
     * Gọi Groq qua Vercel proxy và trả về text response.
     * API key bảo mật server-side — frontend không cần biết key.
     */
    async function _callGroq(prompt) {
        const res = await fetch(GROQ_PROXY, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model:       GROQ_MODEL,
                messages:    [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens:  MAX_TOKENS,
            })
        });

        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            const errMsg  = errBody?.error?.message || `HTTP ${res.status}`;
            throw new Error(errMsg);
        }

        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error('Groq trả về kết quả rỗng.');
        return text;
    }

    // ----------------------------------------------------------
    // PUBLIC: LẤY GỢI Ý
    // ----------------------------------------------------------

    /**
     * Lấy gợi ý AI cho một context từ vựng cụ thể.
     * API key bảo mật server-side, không cần truyền từ frontend.
     *
     * @param {Object} ctx  - { word, meaning, sentence?, phonetic? }
     * @returns {Promise<string>}  - text gợi ý
     * @throws {Error}  - nếu gọi proxy thất bại
     */
    async function getHint(ctx) {
        const prompt = _buildPrompt(ctx);
        return await _callGroq(prompt);
    }

    // ----------------------------------------------------------
    // PUBLIC: RENDER GỢI Ý VÀO DOM
    // ----------------------------------------------------------

    /**
     * Lấy context từ HiSession hiện tại và render gợi ý vào
     * phần tử #ai-hint-container trong DOM.
     *
     * Hàm này được gọi từ sessionUI._getAIHint().
     */
    async function renderHint() {
        const hintEl = document.getElementById('ai-hint-container');
        if (!hintEl) return;

        // Lấy context từ HiSession
        let ctx = null;
        if (typeof HiSession !== 'undefined') {
            const item = HiSession.getCurrentItem();
            if (item && item.exerciseType === 'fill' && item.exerciseData) {
                ctx = item.exerciseData.aiContext || item.exerciseData;
            }
        }

        // Hiện loading
        hintEl.classList.remove('hidden');
        hintEl.innerHTML = `
            <div class="flex items-center gap-2 text-primary">
                <span class="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Groq AI đang tạo gợi ý...</span>
            </div>`;

        try {
            if (!ctx) throw new Error('Không tìm thấy context bài tập.');

            const hint = await getHint({
                word:     ctx.answer,
                meaning:  ctx.meaning,
                sentence: ctx.sentence || '',
                phonetic: ctx.phonetic || '',
            });

            hintEl.innerHTML = `
                <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">lightbulb</span>
                    <div>
                        <strong class="text-primary text-xs uppercase tracking-wide">Gợi ý AI:</strong>
                        <p class="mt-1 leading-relaxed">${_esc(hint).replace(/\n/g, '<br/>')}</p>
                    </div>
                </div>`;

        } catch (err) {
            hintEl.innerHTML = `
                <div class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">error</span>
                    <div>
                        <span class="text-error font-medium text-sm">${_esc(err.message)}</span>
                    </div>
                </div>`;
        }
    }

    // ----------------------------------------------------------
    // UTILS
    // ----------------------------------------------------------

    function _esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ----------------------------------------------------------
    // PUBLIC API
    // ----------------------------------------------------------
    return {
        getHint,
        renderHint,
    };

})();
