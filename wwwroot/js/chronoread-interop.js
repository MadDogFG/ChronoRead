window.ChronoReadInterop = {

    // *** 新增：用于暂存最后一次划词的 Range 对象 ***
    _lastSelectionRange: null,

    /**
     * 1. 定位所有元素
     */
    alignAllElements: () => {
        try {
            const elements = document.querySelectorAll('[data-anchor]');
            elements.forEach(el => {
                if (el.dataset.preciseTop) {
                    el.style.top = `${parseFloat(el.dataset.preciseTop)}px`;
                }
                else {
                    const anchorId = el.dataset.anchor;
                    const anchorElement = document.getElementById(anchorId);
                    if (anchorElement) {
                        const topPosition = anchorElement.offsetTop;
                        const offset = el.classList.contains('node-marker') ? 8 : 0;
                        el.style.top = `${topPosition + offset}px`;
                    }
                }
            });
        } catch (e) {
            console.error("Error aligning elements:", e);
        }
    },

    /**
     * 2. 处理碰撞
     */
    manageCollisions: (expandingCardId, isExpanding) => {
        // ... (此函数保持不变)
        const card = document.getElementById(expandingCardId);
        if (!card) return;
        if (isExpanding) {
            const myTop = card.offsetTop;
            const myExpandedHeight = card.querySelector('.card-summary').offsetHeight + 350;
            const myBottom = myTop + myExpandedHeight;
            const allVisibleCards = document.querySelectorAll('.timeline-card.visible');
            let hiddenCards = [];
            allVisibleCards.forEach(otherCard => {
                if (otherCard === card) return;
                const isSameSide = (card.classList.contains('ai') && otherCard.classList.contains('ai')) ||
                    (card.classList.contains('user') && otherCard.classList.contains('user'));
                if (!isSameSide) return;
                const otherTop = otherCard.offsetTop;
                if (otherTop > myTop && otherTop < myBottom) {
                    otherCard.classList.add('hidden-by-expansion');
                    hiddenCards.push(otherCard.id);
                }
            });
            if (hiddenCards.length > 0) {
                card.dataset.hiddenCardIds = JSON.stringify(hiddenCards);
            }
        } else {
            const hiddenIdsJson = card.dataset.hiddenCardIds;
            if (hiddenIdsJson) {
                const hiddenIds = JSON.parse(hiddenIdsJson);
                hiddenIds.forEach(id => {
                    const hiddenCard = document.getElementById(id);
                    if (hiddenCard) {
                        hiddenCard.classList.remove('hidden-by-expansion');
                    }
                });
                delete card.dataset.hiddenCardIds;
            }
        }
    },

    /**
     * 3. 初始化划词监听器 (修改版)
     */
    initializeSelectionListener: (dotNetHelper, contentContainerId) => {
        const content = document.getElementById(contentContainerId);
        if (!content) { console.error("Selection listener: content container not found."); return; }

        content.addEventListener('mouseup', (e) => {
            if (e.target.closest('.timeline-card') || e.target.closest('#selection-menu')) {
                return;
            }
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            if (selectedText.length > 3) {
                const range = selection.getRangeAt(0);

                // *** 关键：立即暂存 Range 对象 ***
                window.ChronoReadInterop._lastSelectionRange = range;

                const rect = range.getBoundingClientRect();
                const contentRect = content.getBoundingClientRect();
                const menuTop = (rect.top - contentRect.top) + window.scrollY - 50;
                const nodeTop = (rect.top - contentRect.top) + window.scrollY + 4;
                const relativeLeft = (rect.left - contentRect.left) + window.scrollX + (rect.width / 2);

                dotNetHelper.invokeMethodAsync(
                    'ShowSelectionMenu',
                    selectedText, menuTop, relativeLeft,
                    range.startContainer.parentElement.id,
                    nodeTop
                );
            } else {
                // *** 关键：清除暂存的 Range ***
                window.ChronoReadInterop._lastSelectionRange = null;
                dotNetHelper.invokeMethodAsync('HideSelectionMenu');
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (!content.contains(e.target) && !e.target.closest('#selection-menu')) {
                // *** 关键：点击其他地方也清除暂存的 Range ***
                window.ChronoReadInterop._lastSelectionRange = null;
                dotNetHelper.invokeMethodAsync('HideSelectionMenu');
            }
        });
    },

    /**
     * 4. 应用绿色下划线 (修改版)
     */
    applySelectionHighlight: (noteId) => {

        // *** 关键：不再调用 getSelection()，而是使用暂存的 Range ***
        if (!window.ChronoReadInterop._lastSelectionRange) {
            console.error("ApplyHighlight: No selection range was saved.");
            return;
        }

        try {
            const range = window.ChronoReadInterop._lastSelectionRange;

            const span = document.createElement('span');
            span.className = 'chrono-anchor-text user';
            span.dataset.noteId = noteId;

            // *** 使用暂存的 Range 包裹内容 ***
            range.surroundContents(span);

            // *** 关键：清除暂存的 Range，防止重复使用 ***
            window.ChronoReadInterop._lastSelectionRange = null;

            // 清除浏览器视觉上的划词高亮
            window.getSelection().removeAllRanges();

        } catch (e) {
            console.error("Error applying highlight:", e);
            // 发生错误时也清除
            window.ChronoReadInterop._lastSelectionRange = null;
        }
    }
};