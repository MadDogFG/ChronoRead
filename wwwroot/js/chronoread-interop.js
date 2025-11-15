window.ChronoReadInterop = {

    _lastSelectionRange: null,

    /**
     * 1. 定位所有元素
     */
    alignAllElements: () => {
        try {
            const elements = document.querySelectorAll('[data-precise-top]');
            elements.forEach(el => {
                if (el.dataset.preciseTop) {
                    el.style.top = `${parseFloat(el.dataset.preciseTop)}px`;
                }
            });
        } catch (e) {
            console.error("Error aligning elements:", e);
        }
    },

    /**
     * 2. 处理碰撞 (*** 修改版：返回受影响的 ID 列表 ***)
     */
    manageCollisions: (expandingCardId, isExpanding) => {
        const card = document.getElementById(expandingCardId);
        if (!card) return []; // 返回空数组

        if (isExpanding) {
            const myTop = card.offsetTop;
            // *** 修改：从 350px 增加到 400px 以确保覆盖 ***
            const myExpandedHeight = card.querySelector('.card-summary').offsetHeight + 400;
            const myBottom = myTop + myExpandedHeight;
            const allVisibleCards = document.querySelectorAll('.timeline-card.visible');
            let hiddenCards = []; // 存储将被隐藏的 ID

            allVisibleCards.forEach(otherCard => {
                if (otherCard === card) return;
                const isSameSide = (card.classList.contains('ai') && otherCard.classList.contains('ai')) ||
                    (card.classList.contains('user') && otherCard.classList.contains('user'));
                if (!isSameSide) return;

                const otherTop = otherCard.offsetTop;
                // 检查：如果 otherCard 的顶部在 expandingCard 的区域内
                if (otherTop > myTop && otherTop < myBottom) {
                    otherCard.classList.add('hidden-by-expansion');
                    hiddenCards.push(otherCard.id); // 添加 ID
                }
            });

            if (hiddenCards.length > 0) {
                card.dataset.hiddenCardIds = JSON.stringify(hiddenCards);
            }
            return hiddenCards; // *** 返回被隐藏的 ID 列表 ***
        }
        else {
            // 正在收起
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
                return hiddenIds; // *** 返回被恢复的 ID 列表 ***
            }
            return []; // 没有卡片被恢复
        }
    },

    /**
     * 3. 初始化划词监听器 (*** 关键修复 ***)
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

                let isOverlap = false;
                const existingHighlights = content.querySelectorAll('.chrono-anchor-text');
                for (let span of existingHighlights) {
                    if (range.intersectsNode(span)) {
                        isOverlap = true;
                        break;
                    }
                }

                window.ChronoReadInterop._lastSelectionRange = range;

                const rect = range.getBoundingClientRect();
                const contentRect = content.getBoundingClientRect();

                const lineCenter = rect.top + (rect.height / 2);

                const menuTop = (rect.top - contentRect.top) - 50;
                const verticalPosition = (lineCenter - contentRect.top) - 5;
                const relativeLeft = (rect.left - contentRect.left) + window.scrollX + (rect.width / 2);

                dotNetHelper.invokeMethodAsync(
                    'ShowSelectionMenu',
                    selectedText,
                    menuTop,
                    relativeLeft,
                    range.startContainer.parentElement.id,
                    verticalPosition,
                    isOverlap
                );
            } else {
                window.ChronoReadInterop._lastSelectionRange = null;
                dotNetHelper.invokeMethodAsync('HideSelectionMenu');
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (!content.contains(e.target) && !e.target.closest('#selection-menu')) {
                window.ChronoReadInterop._lastSelectionRange = null;
                dotNetHelper.invokeMethodAsync('HideSelectionMenu');
            }
        });
    },

    /**
     * 4. 应用绿色下划线 (原版，未修改)
     */
    applySelectionHighlight: (noteId) => {
        if (!window.ChronoReadInterop._lastSelectionRange) {
            console.error("ApplyHighlight: No selection range was saved.");
            return;
        }

        try {
            const range = window.ChronoReadInterop._lastSelectionRange;

            const span = document.createElement('span');
            span.className = 'chrono-anchor-text user';
            span.dataset.noteId = noteId;

            range.surroundContents(span);

            window.ChronoReadInterop._lastSelectionRange = null;
            window.getSelection().removeAllRanges();

        } catch (e) {
            console.error("Error applying highlight:", e);
            window.ChronoReadInterop._lastSelectionRange = null;
        }
    }, // *** <-- 这里有一个关键的逗号 ***

    /**
     * 5. 获取所有段落的顶部位置
     */
    getParagraphTops: (contentContainerId) => {

        const content = document.getElementById(contentContainerId);
        if (!content) {
            return {};
        }

        const tops = {};
        const paragraphs = content.querySelectorAll('main p[id]');
        const contentRect = content.getBoundingClientRect();

        paragraphs.forEach(p => {
            const rect = p.getBoundingClientRect();
            const lineCenter = rect.top + (rect.height / 2);
            const pTop = (lineCenter - contentRect.top) - 5;
            tops[p.id] = pTop;

        });


        return tops;
    },

    /**
     * 6. 新增：初始化滚轮监听器 (用于堆叠切换)
     */
    initializeWheelListener: (dotNetHelper) => {
        document.addEventListener('wheel', (e) => {
            const stackCard = e.target.closest('.timeline-card.is-stack');

            if (stackCard) {
                e.preventDefault();
                e.stopPropagation();

                const itemId = stackCard.id;
                const deltaY = e.deltaY;

                dotNetHelper.invokeMethodAsync('HandleStackWheel', itemId, deltaY);
            }
        }, { passive: false, capture: true });
    }
};